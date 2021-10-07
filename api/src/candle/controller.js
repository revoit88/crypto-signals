const Boom = require("@hapi/boom");
const {
  positions_processor_microservice,
  signals_processor_microservice,
  candles_processor_microservice,
  binance
} = require("../../utils/axios");
const {
  orderAlphabetically,
  milliseconds,
  getBooleanValue,
  getTimeDiff,
  buildCandles
} = require("@crypto-signals/utils");
const {
  positions_interval,
  signals_interval,
  exchange,
  interval,
  candles_processor_microservice_url
} = require("@crypto-signals/config");
const qs = require("querystring");

exports.create = async function (request, h) {
  try {
    const Candle = request.server.plugins.mongoose.connection.model("Candle");
    const symbol = request.query.symbol;

    const candles = Array.isArray(request.payload)
      ? request.payload
      : [request.payload];

    const existing_candles = await Candle.find({
      id: { $in: candles.map(s => s.id) }
    });

    const [to_update, to_create] = candles
      .map(({ _id: _, ...candle }) => candle)
      .reduce(
        (acc, candle) => {
          const found = existing_candles.find(c => c.id === candle.id);
          return [
            acc[0].concat(found ? candle : []),
            acc[1].concat(found ? [] : candle)
          ];
        },
        [[], []]
      );

    console.log(
      `${symbol} | Candles: ${candles.length} | to create: ${to_create.length} | to update: ${to_update.length}`
    );

    if (to_create.length) {
      await Candle.insertMany(to_create);
    }
    if (to_update.length) {
      const updates = to_update.map(c => ({
        updateOne: {
          filter: { id: c.id },
          update: { $set: c }
        }
      }));
      await Candle.bulkWrite(updates, { ordered: false });
    }

    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
exports.find = async function (request, h) {};
exports.getSymbolCandles = async function (request, h) {
  try {
    const Candle = request.server.plugins.mongoose.connection.model("Candle");
    const symbol = request.params.symbol;

    const candles = await Candle.find({
      $and: [{ exchange }, { symbol }, { interval }]
    })
      .limit(1000)
      .sort({ open_time: -1 });

    return (candles || []).reverse();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
exports.update = async function (request, h) {};
exports.delete = async function (request, h) {};

exports.getObserverStatus = async function (request, h) {
  try {
    const Candle = request.server.plugins.mongoose.connection.model("Candle");
    const options = request.route.realm.pluginOptions;
    const pairs = options.pairs.filter(pair =>
      request.query.symbol ? pair === request.query.symbol : true
    );
    const candles = await Promise.all(
      pairs.map(symbol =>
        Candle.findOne(
          { $and: [{ exchange }, { symbol }, { interval }] },
          {
            _id: 0,
            symbol: 1,
            open_time: 1,
            close_time: 1,
            close_price: 1,
            change: 1
          }
        )
          .hint("exchange_1_symbol_1_interval_1_open_time_-1")
          .sort({ open_time: -1 })
      )
    ).then(result =>
      result
        .filter(notNull => notNull)
        .sort((a, b) => orderAlphabetically((a || {}).symbol, (b || {}).symbol))
    );
    return candles;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};

exports.deleteOldCandles = async function (request, h) {
  try {
    const Candle = request.server.plugins.mongoose.connection.model("Candle");
    const symbol = request.query.symbol;

    await Candle.deleteMany({
      $and: [
        { close_time: { $lt: new Date().getTime() - milliseconds.week } },
        { interval },
        ...(symbol ? [{ symbol }] : [])
      ]
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};

exports.broadcast = async function (request, h) {
  try {
    const candle = request.payload;

    request.server.publish(`/candles/${candle.symbol}`, candle);
    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.getPastDayCandles = async function (request, h) {
  try {
    const Candle = request.server.plugins.mongoose.connection.model("Candle");
    const open_time = new Date().setUTCMinutes(0, 0, 0) - milliseconds.day;
    const candles = await Candle.find(
      { open_time },
      {
        open_time: true,
        open_price: true,
        symbol: true
      }
    ).then(r => r.map(c => c.toJSON()).map(({ _id, ...c } = {}) => c));
    return candles;
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.persist = async function (request, h) {
  try {
    const getAsync = request.server.plugins.redis.getAsync;
    const setAsync = request.server.plugins.redis.setAsync;
    const delAsync = request.server.plugins.redis.delAsync;
    const rpushAsync = request.server.plugins.redis.rpushAsync;
    const llenAsync = request.server.plugins.redis.llenAsync;
    const lpopAsync = request.server.plugins.redis.lpopAsync;

    const CandleModel =
      request.server.plugins.mongoose.connection.model("Candle");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const candle = request.payload;

    request.server.publish(`/candles/${candle.symbol}`, candle);
    request.server.publish(`/markets/${candle.symbol}`, {
      exchange: candle.exchange,
      symbol: candle.symbol,
      last_price: candle.close_price,
      last_update: new Date(candle.event_time).getTime()
    });

    const last_signals_process_date = await getAsync(
      `${candle.symbol}_last_signals_process_date`
    );
    const last_positions_process_date = await getAsync(
      `${candle.symbol}_last_positions_process_date`
    );

    const candles_persist_lock = await getAsync(
      `${candle.symbol}_candles_persist_lock`
    );

    const has_open_signal = getBooleanValue(
      await getAsync(`${candle.symbol}_has_open_signal`)
    );

    const processSignals = async c => {
      await MarketModel.updateOne(
        { $and: [{ exchange: c.exchange }, { symbol: c.symbol }] },
        { $set: { last_price: c.close_price } },
        { upsert: true }
      );
      await signals_processor_microservice.post(`?symbol=${c.symbol}`);
    };

    if (
      Date.now() - (last_signals_process_date || 0) > signals_interval * 2 &&
      !!candles_persist_lock
    ) {
      await delAsync(`${candle.symbol}_candles_persist_lock`);
    }

    if (
      Date.now() - (last_signals_process_date || 0) > signals_interval &&
      !candles_persist_lock
    ) {
      await setAsync(`${candle.symbol}_candles_persist_lock`, true);
      await setAsync(`${candle.symbol}_last_signals_process_date`, Date.now());

      const length = await llenAsync(`${candle.symbol}_candles`);
      const candles =
        (await lpopAsync([`${candle.symbol}_candles`, length])) || [];
      candles.push(JSON.stringify(candle));
      const toUpdate = Object.values(
        candles.reduce((acc, candle) => {
          const parsed = JSON.parse(candle);
          return { ...acc, [parsed.id]: parsed };
        }, {})
      );

      if (toUpdate.length) {
        await CandleModel.bulkWrite(
          toUpdate.map(value => ({
            updateOne: {
              filter: { id: value.id },
              update: { $set: value },
              upsert: true
            }
          })),
          { ordered: false }
        );

        await candles_processor_microservice.post(
          `?symbol=${candle.symbol}`,
          toUpdate.map(c => c.id)
        );
      }
      await delAsync(`${candle.symbol}_candles_persist_lock`);

      if (
        Date.now() - (last_positions_process_date || 0) > positions_interval &&
        !candles_persist_lock
      ) {
        await positions_processor_microservice.post(`?symbol=${candle.symbol}`);
        await setAsync(
          `${candle.symbol}_last_positions_process_date`,
          Date.now()
        );
      }

      await processSignals(candle);
    } else {
      try {
        await rpushAsync(`${candle.symbol}_candles`, JSON.stringify(candle));
      } catch (error) {
        console.error(error.code);
        if (error.code === "WRONGTYPE") {
          await delAsync(`${candle.symbol}_candles`);
        } else {
          throw error;
        }
      }
    }

    if (has_open_signal) {
      await processSignals(candle);
    }

    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};

exports.getCandlesFromBinance = async function (request, h) {
  try {
    const { symbol, force } = request.query;
    const CandleModel =
      request.server.plugins.mongoose.connection.model("Candle");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    if (!getBooleanValue(force)) {
      const count = await CandleModel.countDocuments({
        $and: [
          { exchange },
          { symbol },
          { interval },
          { open_time: { $gte: Date.now() - getTimeDiff(160, interval) } }
        ]
      });

      if (count >= 150) {
        return h.response();
      }
    }

    const query = new URLSearchParams({
      symbol,
      interval,
      startTime: Date.now() - getTimeDiff(160, interval)
    }).toString();

    const { data } = await binance.get(`/api/v3/klines?${query}`);

    if (Array.isArray(data) && !!data.length) {
      const processed = buildCandles({
        candles: data,
        exchange,
        symbol,
        interval
      });

      await CandleModel.deleteMany({
        $and: [
          { exchange },
          { symbol },
          { interval },
          { open_time: { $gte: Date.now() - getTimeDiff(160, interval) } }
        ]
      });
      await CandleModel.insertMany(processed);

      const marketExists = await MarketModel.exists({
        $and: [{ exchange }, { symbol }]
      });

      if (!marketExists) {
        await MarketModel.create({
          symbol,
          last_price: processed[processed.length - 1].close_price
        });
      }

      if (candles_processor_microservice_url) {
        await candles_processor_microservice.post(
          `?symbol=${symbol}`,
          processed.slice(-10).map(c => c.id)
        );
      }
    }

    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
