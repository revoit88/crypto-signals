const Boom = require("@hapi/boom");
const { castToObjectId } = require("../../utils");

exports.create = async function (request, h) {
  try {
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const symbol = request.query.symbol;

    const signals = Array.isArray(request.payload)
      ? request.payload
      : [request.payload];

    const existing_signals = await Signal.find({
      id: { $in: signals.map(s => s.id) }
    });

    const [to_update, to_create] = signals.reduce(
      (acc, signal) => {
        const found = existing_signals.some(s => s.id === signal.id);
        return [
          acc[0].concat(found ? signal : []),
          acc[1].concat(found ? [] : signal)
        ];
      },
      [[], []]
    );

    console.log(
      `${symbol} | Signals: ${signals.length} | to create: ${to_create.length} | to update: ${to_update.length}`
    );

    if (to_create.length) {
      await Signal.insertMany(to_create);
    }
    if (to_update.length) {
      await Promise.all(
        to_update.map(({ id, ...signal }) =>
          Signal.findOneAndUpdate({ id }, { $set: { ...signal } })
        )
      );
    }

    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};

exports.find = async function (request, h) {
  try {
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const {
      exchange = "binance",
      symbol,
      limit = 100,
      offset = 0,
      start_time,
      end_time
    } = request.query;

    let right_bound = end_time || Date.now();

    // don't show signals from the past two hours
    if (right_bound > Date.now() - 36e5 * 2) {
      right_bound = right_bound - 36e5 * 2;
    }

    const query = {
      $and: []
        .concat(exchange ? [{ exchange }] : [])
        .concat(symbol ? [{ symbol }] : [])
        .concat({ status: "closed" })
        .concat(start_time ? [{ close_time: { $gt: start_time } }] : [])
        .concat(right_bound ? [{ close_time: { $lt: right_bound } }] : [])
    };

    const count = await Signal.countDocuments(query);

    const signals = await Signal.find(query, {
      _id: false,
      symbol: true,
      price: true,
      close_time: true,
      high1d: true,
      high3d: true,
      high7d: true,
      low1d: true,
      low3d: true,
      low7d: true
    })
      .sort({ close_time: -1 })
      .skip(offset)
      .limit(limit);

    return h.response(signals).header("x-total-count", count);
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
exports.findById = async function (request, h) {
  try {
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const id = request.params.id;

    const signal = await Signal.findById(castToObjectId(id));

    if (!signal) {
      return Boom.notFound("Document not found");
    }

    return signal;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
exports.update = async function (request, h) {};
exports.delete = async function (request, h) {};

exports.broadcast = async function (request, h) {
  try {
    const broadcast = request.server.plugins.wss.broadcast;
    broadcast(request.payload);
    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.getReport = async function (request, h) {
  try {
    const { symbol, start_time, end_time } = request.query;
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const symbols = symbol ? symbol.split(",") : [];

    const signals = await Signal.aggregate([
      ...(symbols.length ? [{ $match: { symbol: { $in: symbols } } }] : []),
      {
        $lookup: {
          from: "positions",
          localField: "position",
          foreignField: "_id",
          as: "signal_position"
        }
      },
      {
        $unwind: {
          path: "$signal_position",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          close_date: true,
          _id: false,
          symbol: true,
          position_change: "$signal_position.change",
          position_status: "$signal_position.status"
        }
      },
      {
        $match: { position_status: "closed" }
      },
      {
        $group: {
          _id: {
            month: { $month: "$close_date" },
            year: { $year: "$close_date" }
          },
          total: { $sum: 1 },
          signals: { $push: "$$ROOT" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]);

    const processed = signals.map(item => ({
      year: item._id.year,
      month: item._id.month,
      total: (item.signals || []).length,
      profit: (item.signals || []).filter(s => s.position_change > 0).length,
      loss: (item.signals || []).filter(s => s.position_change < 0).length,
      total_roi: Number(
        Number(
          (item.signals || []).reduce(
            (acc, current) => acc + current.position_change,
            0
          )
        ).toFixed(2)
      )
    }));

    return processed;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  /*


  

  */
};

exports.getMonthlyReport = async function (request, h) {
  try {
    const { symbol, start_time, end_time } = request.query;
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const symbols = symbol ? symbol.split(",") : [];

    const signals = await Signal.aggregate([
      ...(symbols.length ? [{ $match: { symbol: { $in: symbols } } }] : []),
      {
        $group: {
          _id: {
            month: { $month: "$close_date" },
            year: { $year: "$close_date" }
          },
          total: { $sum: 1 },
          signals: { $push: "$$ROOT" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // return signals;

    const processed = signals.map(item => ({
      year: item._id.year,
      month: item._id.month,
      total: item.total,
      average_roi: Number(
        Number(
          item.signals.reduce(
            (acc, current) => acc + current.high1d + current.low1d,
            0
          ) / item.total
        ).toFixed(2)
      )
      // profit: (item.signals || []).filter(s => s.position_change > 0).length,
      // loss: (item.signals || []).filter(s => s.position_change < 0).length,
      // total_roi: Number(
      //   Number(
      //     (item.signals || []).reduce(
      //       (acc, current) => acc + current.position_change,
      //       0
      //     )
      //   ).toFixed(2)
      // )
    }));

    return processed;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  /*


  

  */
};

exports.getDaylyReport = async function (request, h) {
  try {
    const { symbol, start_time, end_time } = request.query;
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const symbols = symbol ? symbol.split(",") : [];

    const signals = await Signal.aggregate([
      ...(symbols.length ? [{ $match: { symbol: { $in: symbols } } }] : []),
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$close_date" },
            month: { $month: "$close_date" },
            year: { $year: "$close_date" }
          },
          total: { $sum: 1 },
          signals: { $push: "$$ROOT" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const processed = signals.map(item => ({
      year: item._id.year,
      month: item._id.month,
      day: item._id.day,
      total: item.total,
      average_roi: Number(
        Number(
          item.signals.reduce(
            (acc, current) => acc + current.high1d + current.low1d,
            0
          ) / item.total
        ).toFixed(2)
      )
    }));

    return processed;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }

  /*


  

  */
};

exports.findOpenSignals = async function (request, h) {
  try {
    const Signal = request.server.plugins.mongoose.connection.model("Signal");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const signals = await Signal.find(
      { status: "open" },
      {
        exchange: true,
        symbol: true,
        trailing_stop_buy: true,
        trigger_time: true,
        drop_price: true
      }
    ).sort({ trigger_time: -1 });

    const { kucoin_signals, binance_signals } = signals.reduce(
      (acc, signal) => ({
        ...acc,
        [`${signal.exchange}_signals`]:
          acc[`${signal.exchange}_signals`].concat(signal)
      }),
      { kucoin_signals: [], binance_signals: [] }
    );

    const markets = await MarketModel.find({
      $or: [
        {
          $and: [
            { exchange: "binance" },
            { symbol: { $in: binance_signals.map(s => s.symbol) } }
          ]
        },
        {
          $and: [
            { exchange: "kucoin" },
            { symbol: { $in: kucoin_signals.map(s => s.symbol) } }
          ]
        }
      ]
    });

    return signals.map(signal => {
      const market = markets.find(
        m => m.exchange === signal.exchange && m.symbol === signal.symbol
      );
      return {
        _id: signal._id,
        exchange: signal.exchange,
        symbol: signal.symbol,
        drop_price: signal.drop_price,
        trailing_stop_buy: signal.trailing_stop_buy,
        time: signal.trigger_time,
        last_market_price: market.last_price,
        last_market_price_update: new Date(market.updatedAt).getTime()
      };
    });
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
