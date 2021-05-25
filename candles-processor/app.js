const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const { getTimeDiff, benchmark } = require("@crypto-signals/utils");
const { getIndicatorsValues, getOHLCValues } = require("./utils");

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
        const CandleModel =
          request.server.plugins.mongoose.connection.model("Candle");
        const { symbol } = request.query;
        const candlesToUpdate = request.payload;

        const toUpdate = await benchmark(
          () =>
            CandleModel.find({
              id: { $in: candlesToUpdate }
            }).sort({ open_time: 1 }),
          `${symbol} - toUpdate find`
        );

        for (const candle of toUpdate) {
          const candles = await benchmark(
            () =>
              CandleModel.find({
                $and: [
                  { symbol },
                  {
                    open_time: {
                      $gte: candle.open_time - getTimeDiff(155, config.interval)
                    }
                  },
                  { open_time: { $lte: candle.open_time } }
                ]
              })
                .hint("symbol_1_open_time_1")
                .sort({ open_time: 1 })
                .then(found => found.map(c => c.toJSON())),
            `${symbol} - find candles`
          );

          if (candles.length >= 150) {
            const ohlc = getOHLCValues(candles);
            const indicators = await benchmark(
              () => getIndicatorsValues(ohlc, candles),
              `${symbol} - get indicators`
            );

            await benchmark(
              () =>
                CandleModel.updateOne({ id: candle.id }, { $set: indicators }),
              `${symbol} - updateOne`
            );
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
