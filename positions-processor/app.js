const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const { getChange, toSymbolPrecision } = require("@crypto-signals/utils");
const strategies = require("./src/strategies");

const init = async () => {
  const server = Hapi.server({
    port: config.port,
    host: config.host
  });
  await server.register([
    {
      plugin: require("./db"),
      options: { db_uri: config.db_uri }
    }
  ]);

  server.route({
    path: "/",
    method: "POST",
    handler: async (request, h) => {
      try {
        const { symbol } = request.query;
        // sell strategy
        const strategy = strategies[config.strategy](
          request.server.plugins.mongoose.connection
        );

        const PositionModel =
          request.server.plugins.mongoose.connection.model("Position");

        const results = await strategy.process(symbol);

        if ((results || []).length) {
          for (const result of results) {
            const { position, candle, sell_trigger } = result ?? {};
            try {
              if (position) {
                const profit = toSymbolPrecision(
                  candle.close_price * position.buy_amount -
                    position.buy_price * position.buy_amount,
                  candle.symbol
                );

                const sell_price = toSymbolPrecision(
                  candle.close_price,
                  candle.symbol
                );

                await PositionModel.findOneAndUpdate(
                  { _id: position._id },
                  {
                    $set: {
                      sell_price,
                      close_date: new Date(),
                      close_time: Date.now(),
                      status: "closed",
                      change: getChange(candle.close_price, position.buy_price),
                      sell_trigger,
                      profit,
                      sell_candle: candle
                    }
                  },
                  { new: true }
                );
              }
            } catch (error) {
              await PositionModel.findByIdAndUpdate(position._id, {
                $set: { status: "open" }
              });
              throw error;
            }
          }
        }

        return h.response();
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
