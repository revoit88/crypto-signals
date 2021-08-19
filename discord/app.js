const Hapi = require("@hapi/hapi");
const Boom = require("@hapi/boom");
const config = require("@crypto-signals/config");
const { toFixedDecimal } = require("@crypto-signals/utils");
const { castToObjectId } = require("./utils");
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
Total Profit: ${totalProfit}%
Average Profit Per Signal: ${averageProfit}%
          `;

          await axios.post(config.bottom_detector_webhook_url, { content });
          return h.response();
        } catch (error) {
          console.error(error);
          return Boom.internal();
        }
      }
    },
    {
      path: "/position-closed",
      method: "POST",
      handler: async (request, h) => {
        try {
          const PositionModel =
            request.server.plugins.mongoose.connection.model("Position");

          const id = request.query.id;

          const position = await PositionModel.findOne({
            _id: castToObjectId(id)
          }).lean();

          if (position?.change < 0) {
            return h.response();
          }

          const content = `**New profit generated on pair ${position.symbol}**
Profit: ${position.change}%
Entry Date: ${format(new Date(position.open_time), "dd/MM/yyyy HH:mm")}
Exit Date:${format(new Date(position.close_time), "dd/MM/yyyy HH:mm")}
Entry Price: ${position.buy_price}
Exit Price: ${position.sell_price}
          `;

          await axios.post(config.trend_webhook_url, { content });

          return h.response();
        } catch (error) {
          console.error(error);
          return Boom.internal();
        }
      }
    }
  ]);

  await server.start();
  console.log(`Server running on port ${config.port}`);
};

init();
