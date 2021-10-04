const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const { toFixedDecimal } = require("@crypto-signals/utils");
const axios = require("axios");
const { startOfISOWeek, endOfISOWeek, format } = require("date-fns");

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

  server.route([
    {
      path: "/last-week-report",
      method: "POST",
      handler: async (request, h) => {
        try {
          const PositionModel =
            request.server.plugins.mongoose.connection.model("Position");
          const date = new Date().getTime() - 36e5 * 24;
          const startOfWeek = startOfISOWeek(date);
          const endOfWeek = endOfISOWeek(date);

          const positions = await PositionModel.find({
            $and: [
              { exchange: config.exchange },
              { status: "closed" },
              { close_time: { $gte: startOfWeek.getTime() } },
              { close_time: { $lte: endOfWeek.getTime() } }
            ]
          })
            .select({ change: 1 })
            .lean();

          const winningSignals = positions.filter(p => p.change > 0).length;
          const totalProfit = positions.reduce(
            (a, c) => a + (c?.change ?? 0),
            0
          );
          const averageProfit =
            toFixedDecimal(totalProfit / positions.length, 2) || 0;
          const content = `
          **Weekly Report (${format(startOfWeek, "dd/MM/yyyy")} - ${format(
            endOfWeek,
            "dd/MM/yyyy"
          )})**
Total Signals: ${positions.length}
Total Wins: ${winningSignals}
Average Profit Per Signal: ${averageProfit}%
          `;

          await axios.post(config.bottom_detector_webhook_url, { content });
          return h.response();
        } catch (error) {
          console.error(error);
          return Boom.internal();
        }
      }
    }
  ]);

  const pubsub = server.plugins.redis.pubSub;

  pubsub.on("subscribe", function (channel) {
    console.log(`[Discord] Subscribed to channel: ${channel}`);
  });
  pubsub.on("message", async function (channel, data) {
    if (channel === `${config.quote_asset}_${config.redis_positions_channel}`) {
      const signal = JSON.parse(data);

      const content = `=== **New Signal** ===
Type: ${String(signal.type).toUpperCase()}
Pair: ${String(signal.symbol).replace(
        config.quote_asset,
        `/${config.quote_asset}`
      )}
Average ${signal.type === "entry" ? "Entry" : "Exit"} Price: ${
        config.currency_symbol
      } ${signal.price}`;

      await axios.post(config.webhook_url, { content });
    }
  });

  pubsub.subscribe(
    `${config.quote_asset}_${config.redis_positions_channel}`,
    function () {}
  );

  await server.start();
  console.log(`[Discord] Server running on port ${config.port}`);
};

init();
