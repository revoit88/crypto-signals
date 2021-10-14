const Boom = require("@hapi/boom");
const { startOfMonth, endOfMonth, subWeeks } = require("date-fns");
const { zonedTimeToUtc } = require("date-fns-tz");
const { castToObjectId } = require("../../utils");
const { strategy, quote_asset, interval } = require("@crypto-signals/config");

exports.create = async function (request, h) {
  try {
    const { start_time } = request.query;

    const Position =
      request.server.plugins.mongoose.connection.model("Position");
    const Report = request.server.plugins.mongoose.connection.model("Report");

    const last_week = subWeeks(new Date(+start_time || Date.now()), 1);

    const start = zonedTimeToUtc(startOfMonth(last_week), "UTC").getTime();

    const end = zonedTimeToUtc(endOfMonth(last_week), "UTC").getTime();

    const exists = await Report.exists({
      $and: [{ start_time: start, end_time: end }]
    });

    if (exists) {
      return h.response();
    }

    await Position.deleteMany({
      $and: [
        { status: "closed" },
        { $or: [{ broadcast: false }, { broadcast: { $exists: false } }] },
        { close_time: { $gte: start } },
        { close_time: { $lte: end } }
      ]
    });

    const positions = await Position.find(
      {
        $and: [
          { status: "closed" },
          { broadcast: true },
          { close_time: { $gte: start } },
          { close_time: { $lte: end } }
        ]
      },
      { change: 1 }
    ).lean();

    const processed = {
      year: last_week.getFullYear(),
      month: last_week.getMonth() + 1,
      start_time: start,
      end_time: end,
      total_trades: positions.length,
      total_wins: positions.filter(p => p.change > 0).length,
      average_change: +Number(
        positions.reduce((a, c) => a + c.change, 0) / positions.length || 0
      ).toFixed(2),
      strategy: String(`${strategy}_${quote_asset}_${interval}`).toLowerCase()
    };

    await Report.create(processed);

    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
exports.downloadReport = async function (request, h) {};

exports.getReports = async function (request, h) {
  try {
    const Report = request.server.plugins.mongoose.connection.model("Report");
    const limit = +request.query.limit;

    const reports = await Report.find({})
      .sort({ start_time: -1 })
      .limit(limit)
      .lean();

    return reports;
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.getReportPositions = async function (request, h) {
  try {
    const ReportModel =
      request.server.plugins.mongoose.connection.model("Report");
    const PositionModel =
      request.server.plugins.mongoose.connection.model("Position");
    const id = request.params.id;
    const limit = +request.query.limit ?? 0;
    const offset = +request.query.offset ?? 0;
    const symbol = request.query.symbol;
    const report = await ReportModel.findById(castToObjectId(id)).lean();

    const count = await PositionModel.countDocuments({
      $and: [
        { status: "closed" },
        { close_time: { $gte: report.start_time } },
        { close_time: { $lte: report.end_time } },
        ...(symbol ? [{ symbol }] : [])
      ]
    });

    const positions = await PositionModel.find({
      $and: [
        { status: "closed" },
        { close_time: { $gte: report.start_time } },
        { close_time: { $lte: report.end_time } },
        ...(symbol ? [{ symbol }] : [])
      ]
    })
      .select({
        symbol: true,
        open_time: true,
        close_time: true,
        buy_price: true,
        sell_price: true,
        change: true
      })
      .sort({ open_time: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return h.response(positions).header("x-total-count", count);
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
