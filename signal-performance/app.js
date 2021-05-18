const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("./config");
const { milliseconds, getChange } = require("@crypto-signals/utils");

const init = async () => {
  const server = Hapi.server({
    port: config.port,
    host: config.host
  });
  await server.register([
    {
      plugin: require("./db"),
      options: {
        db_uri: config.db_uri
      }
    }
  ]);

  server.route({
    path: "/",
    method: "POST",
    handler: async (request, h) => {
      try {
        const { symbol } = request.query;
        const candles = request.payload;
        const SignalModel =
          request.server.plugins.mongoose.connection.model("Signal");

        const day = milliseconds.day;
        const threeDays = day * 3;
        const week = milliseconds.week;
        const month = day * 30;
        const now = Date.now();

        const signals = await SignalModel.find(
          {
            $and: [
              { exchange: config.exchange },
              { symbol: symbol },
              { status: "closed" },
              { close_time: { $gt: now - month } },
              { close_time: { $lt: now } }
            ]
          },
          {
            close_time: 1,
            price: 1,
            high1d: 1,
            high3d: 1,
            high7d: 1,
            high30: 1,
            low1d: 1,
            low3d: 1,
            low7d: 1,
            low30d: 1
          }
        ).hint("exchange_1_symbol_1_status_1_close_time_-1");

        if (!signals.length) {
          return h.response();
        }

        const updates = signals
          .map(signal => {
            const days = [
              [day, "1d"],
              [threeDays, "3d"],
              [week, "7d"],
              [month, "30d"]
            ];

            const toUpdate = candles.reduce((acc, candle) => {
              const change = getChange(candle.close_price, signal.price);

              return {
                ...acc,
                ...days.reduce((daysAcc, [time, prop]) => {
                  return signal.close_time + time > now &&
                    change > signal[`high${prop}`] &&
                    change > (acc[`high${prop}`] ?? 0)
                    ? { ...daysAcc, [`high${prop}`]: change }
                    : daysAcc;
                }, {}),
                ...days.reduce((daysAcc, [time, prop]) => {
                  return signal.close_time + time > now &&
                    change < signal[`low${prop}`] &&
                    change < (acc[`low${prop}`] ?? 0)
                    ? { ...daysAcc, [`low${prop}`]: change }
                    : daysAcc;
                }, {})
              };
            }, {});

            if (!!Object.keys(toUpdate).length) {
              return {
                updateOne: {
                  filter: { _id: signal._id },
                  update: { $set: toUpdate }
                }
              };
            }
            return null;
          })
          .filter(notNull => notNull);

        if (!updates.length) {
          return h.response();
        }

        await SignalModel.bulkWrite(updates, { ordered: false });
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