const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const { milliseconds, getChange } = require("@crypto-signals/utils");

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
        const candles = request.payload;
        const SignalModel =
          request.server.plugins.mongoose.connection.model("Signal");

        const day = milliseconds.day;
        const threeDays = day * 3;
        const week = milliseconds.week;
        const month = day * 30;
        const now = Date.now();
        const ninetyDays = month * 3;

        const days = [
          [day, 1],
          [threeDays, 3],
          [week, 7],
          [month, 30],
          [ninetyDays, 90]
        ];

        const signals = await SignalModel.find(
          {
            $and: [
              { symbol: symbol },
              { status: "closed" },
              { close_time: { $gt: now - ninetyDays } },
              { close_time: { $lt: now } }
            ]
          },
          {
            close_time: 1,
            price: 1,
            ...days.reduce(
              (acc, [_, prop]) => ({
                ...acc,
                [`high${prop}d`]: 1,
                [`low${prop}d`]: 1
              }),
              {}
            )
          }
        ).hint("symbol_1_status_1_close_time_-1");

        if (!signals.length) {
          return h.response();
        }

        const updates = signals
          .map(signal => {
            const toUpdate = candles.reduce((acc, candle) => {
              const change = getChange(candle.close_price, signal.price);

              return {
                ...acc,
                ...days.reduce((daysAcc, [time, prop]) => {
                  return signal.close_time + time > now &&
                    change > signal[`high${prop}d`] &&
                    change > (acc[`high${prop}d`] ?? 0)
                    ? { ...daysAcc, [`high${prop}d`]: change }
                    : daysAcc;
                }, {}),
                ...days.reduce((daysAcc, [time, prop]) => {
                  return signal.close_time + time > now &&
                    change < signal[`low${prop}d`] &&
                    change < (acc[`low${prop}d`] ?? 0)
                    ? { ...daysAcc, [`low${prop}d`]: change }
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
