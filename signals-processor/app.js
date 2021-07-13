const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const {
  toSymbolPrecision,
  getTimeDiff,
  cloneObject
} = require("@crypto-signals/utils");
const {
  getTSB,
  getPlainCandle,
  calculateBuySignal,
  castToObjectId
} = require("./utils");
const { api } = require("./axios");

const init = async () => {
  const server = Hapi.server({
    port: config.port,
    host: config.host
  });
  await server.register([
    {
      plugin: require("./db"),
      options: { db_uri: config.db_uri }
    },
    {
      plugin: require("./redis"),
      options: { redis_uri: config.redis_uri }
    }
  ]);

  server.route({
    path: "/",
    method: "POST",
    handler: async (request, h) => {
      try {
        const SignalModel =
          request.server.plugins.mongoose.connection.model("Signal");
        const CandleModel =
          request.server.plugins.mongoose.connection.model("Candle");
        const MarketModel =
          request.server.plugins.mongoose.connection.model("Market");
        const PositionModel =
          request.server.plugins.mongoose.connection.model("Position");

        const positionController = require("./src/position/controller")(
          request.server.plugins.mongoose.connection
        );

        const setAsync = request.server.plugins.redis.setAsync;
        const delAsync = request.server.plugins.redis.delAsync;

        const { symbol } = request.query;

        const count = await CandleModel.countDocuments({
          $and: [
            { symbol },
            {
              open_time: {
                $gte: Date.now() - getTimeDiff(155, config.interval)
              }
            }
          ]
        });

        if (count < 150) {
          return h.response();
        }

        //last 10
        const candles = await CandleModel.find({
          $and: [
            { symbol },
            {
              open_time: {
                $gte: Date.now() - getTimeDiff(10, config.interval)
              }
            }
          ]
        })
          .hint("symbol_1_open_time_1")
          .sort({ open_time: 1 })
          .lean();

        let [sliced_last_candle] = candles.slice(-1);
        let last_candle = cloneObject(sliced_last_candle);

        const hoursLookup = config.signal_hours_lookup;
        const positionHoursLookup = config.last_position_hours_lookup;

        let open_signals = await SignalModel.find({
          $and: [
            { symbol },
            { status: "open" },
            { trigger_time: { $gt: Date.now() - hoursLookup } }
          ]
        })
          .hint("symbol_1_status_1_trigger_time_-1")
          .sort({ trigger_time: -1 })
          .lean();

        if (!open_signals.length) {
          const last_closed_signal = await SignalModel.findOne({
            $and: [
              { symbol },
              { status: "closed" },
              { close_time: { $gt: Date.now() - hoursLookup } }
            ]
          })
            .hint("symbol_1_status_1_close_time_-1")
            .sort({ close_time: -1 })
            .lean();

          const last_open_position = await PositionModel.findOne({
            $and: [
              { symbol },
              { status: "open" },
              { open_time: { $gt: Date.now() - positionHoursLookup } }
            ]
          })
            .hint("symbol_1_status_1_open_time_-1")
            .sort({ open_time: -1 })
            .lean();

          const [triggered_signal] = calculateBuySignal(
            candles,
            last_closed_signal,
            last_open_position
          ).map(s => ({
            ...s,
            trailing_stop_buy: getTSB(last_candle),
            open_candle: getPlainCandle(last_candle),
            is_test: !!last_candle.is_test,
            id: `${last_candle.exchange}_${last_candle.symbol}_${s.trigger}_${last_candle.event_time}`
          }));
          if (triggered_signal) {
            await SignalModel.create(triggered_signal);
            await setAsync(`${last_candle.symbol}_has_open_signal`, true);
          }
          return h.response();
        } else {
          const updated_signals_promises = open_signals.map(
            async (open_signal, index) => {
              try {
                if (index > 0) {
                  return SignalModel.findByIdAndRemove(open_signal._id);
                }

                const market = await MarketModel.findOne({
                  $and: [
                    { exchange: open_signal.exchange },
                    { symbol: open_signal.symbol }
                  ]
                })
                  .hint("exchange_1_symbol_1")
                  .lean();

                if (
                  +last_candle.close_price >= open_signal.trailing_stop_buy &&
                  !open_signal.trader_lock &&
                  !market.trader_lock
                ) {
                  const close_price = toSymbolPrecision(
                    open_signal.trailing_stop_buy,
                    last_candle.symbol
                  );

                  const updatedSignal = await SignalModel.findByIdAndUpdate(
                    open_signal._id,
                    {
                      $set: {
                        status: "closed",
                        price: close_price,
                        close_candle: getPlainCandle(last_candle),
                        close_time: Date.now(),
                        close_date: new Date(),
                        broadcast: market.broadcast_signals
                      }
                    },
                    { new: true }
                  );
                  await delAsync(`${last_candle.symbol}_has_open_signal`);

                  // create position
                  const position = await positionController.create(
                    updatedSignal,
                    last_candle,
                    !!market.use_main_account
                  );
                  // broadcast signal closed
                  api
                    .broadcast("signals", {
                      exchange: open_signal.exchange,
                      symbol: open_signal.symbol,
                      type: "exit",
                      _id: open_signal._id.toString()
                    })
                    .catch(error => {
                      console.log("Exit signal broadcast error.");
                      if (error) {
                        console.error(error);
                      }
                    });
                  // broadcast new position

                  api
                    .broadcast("positions", {
                      exchange: position.exchange,
                      symbol: position.symbol,
                      price: position.buy_price,
                      signal: position.signal.toString(),
                      type: "entry",
                      _id: position._id.toString(),
                      time: position.open_time
                    })
                    .catch(error => {
                      console.log("Entry position broadcast error.");
                      if (error) {
                        console.error(error);
                      }
                    });
                  return Promise.resolve();
                }

                const tsb = getTSB(open_signal, last_candle);
                if (
                  tsb < open_signal.trailing_stop_buy &&
                  Date.now() - open_signal.last_tsb_update > 1e4
                ) {
                  if (!open_signal.enough_balance) {
                    await SignalModel.findByIdAndUpdate(
                      castToObjectId(open_signal._id),
                      {
                        $set: {
                          trailing_stop_buy: tsb,
                          last_tsb_update: Date.now()
                        }
                      },
                      { new: true }
                    );
                  }
                }

                return Promise.resolve();
              } catch (error) {
                console.error(error);
              }
            }
          );

          await Promise.all(updated_signals_promises);

          return h.response();
        }
      } catch (error) {
        console.error(error);
        return Boom.internal();
      }
    }
  });

  await server.start();
  console.log(`Server running on port ${config.port}`);
};

init();
