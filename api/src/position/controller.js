const Boom = require("@hapi/boom");
const axios = require("axios");
const {
  zignaly_url,
  zignaly_provider_key,
  environment
} = require("@crypto-signals/config");
const { castToObjectId } = require("../../utils");
const {
  orderAlphabetically,
  toSymbolPrecision
} = require("@crypto-signals/utils");

exports.create = async function (request, h) {
  try {
    const SignalModel =
      request.server.plugins.mongoose.connection.model("Signal");
    const PositionModel =
      request.server.plugins.mongoose.connection.model("Position");
    const AccountModel =
      request.server.plugins.mongoose.connection.model("Account");

    const account = await AccountModel.findOne({ id: "production" });
    const signal = await SignalModel.findOne({ id: request.payload.signal });
    const buy_order = request.payload.buy_order;

    const STOP_LOSS = 6;
    const ARM_TRAILING_STOP_LOSS = 3;
    const TRAILING_STOP_LOSS = 2;
    const TAKE_PROFIT = 100;

    await PositionModel.create({
      id: `${signal.symbol}_${signal.trigger}_${Date.now()}`,
      symbol: signal.symbol,
      open_time: Date.now(),
      date: new Date(),
      cost: +buy_order.cummulativeQuoteQty,
      buy_price: +buy_order.price,
      buy_amount: +buy_order.executedQty,
      take_profit: toSymbolPrecision(
        +buy_order.price * (1 + TAKE_PROFIT / 100),
        signal.symbol
      ),
      stop_loss: toSymbolPrecision(
        +buy_order.price * (1 - STOP_LOSS / 100),
        signal.symbol
      ),
      arm_trailing_stop_loss: toSymbolPrecision(
        +buy_order.price * (1 + ARM_TRAILING_STOP_LOSS / 100),
        signal.symbol
      ),
      trigger: signal.trigger,
      signal: signal._id,
      buy_order,
      is_test: false,
      account_id: account._id,
      filled_on_update: true,
      configuration: {
        take_profit: TAKE_PROFIT,
        stop_loss: STOP_LOSS,
        arm_trailing_stop_loss: ARM_TRAILING_STOP_LOSS,
        trailing_stop_loss: TRAILING_STOP_LOSS
      }
    });

    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
exports.find = async function (request, h) {};
exports.findById = async function (request, h) {
  try {
    const Position =
      request.server.plugins.mongoose.connection.model("Position");
    const id = request.params.id;

    const position = await Position.findById(castToObjectId(id));

    if (!position) {
      return Boom.notFound("Document not found");
    }

    return position;
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
exports.update = async function (request, h) {};
exports.delete = async function (request, h) {};

exports.profitReport = async function (request, h) {
  try {
    const Position =
      request.server.plugins.mongoose.connection.model("Position");

    const symbol = request.query.symbol;

    const options = request.route.realm.pluginOptions;

    const result = await Position.aggregate([
      { $match: { symbol: { $in: options.pairs } } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
            symbol: "$symbol"
          },
          profit: { $sum: "$profit" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    const result1 = result.reduce((acc, current) => {
      return {
        ...acc,
        [current._id.symbol]: (acc[current._id.symbol] || []).concat({
          month: current._id.month,
          year: current._id.year,
          profit: Number(Number(current.profit).toFixed(2))
        })
      };
    }, {});

    const result2 = Object.keys(result1)
      .sort((a, b) => orderAlphabetically(a, b))
      .map(symbol => ({ symbol, data: result1[symbol] }));

    return result2;
  } catch (error) {
    return Boom.internal();
  }
};

exports.findOpenPositions = async function (request, h) {
  try {
    const Position =
      request.server.plugins.mongoose.connection.model("Position");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const querySymbols = (request.query.symbol || "")
      .split(",")
      .filter(notEmpty => notEmpty);

    const positions = await Position.find({
      $and: [
        { status: "open" },
        ...(querySymbols.length ? [{ symbol: { $in: querySymbols } }] : [])
      ]
    }).then(result => result.map(p => p.toJSON()));

    const { kucoin_positions, binance_positions } = positions.reduce(
      (acc, position) => ({
        ...acc,
        [`${position.exchange}_positions`]:
          acc[`${position.exchange}_positions`].concat(position)
      }),
      { kucoin_positions: [], binance_positions: [] }
    );

    const markets = await MarketModel.find({
      $or: [
        {
          $and: [
            { exchange: "binance" },
            { symbol: { $in: binance_positions.map(s => s.symbol) } }
          ]
        },
        {
          $and: [
            { exchange: "kucoin" },
            { symbol: { $in: kucoin_positions.map(s => s.symbol) } }
          ]
        }
      ]
    });

    return positions.map(p => {
      const market = markets.find(
        market => market.symbol === p.symbol && market.exchange === p.exchange
      );
      return {
        _id: p._id,
        price: p.buy_price,
        exchange: p.exchange,
        symbol: p.symbol,
        time: p.open_time,
        last_market_price: market.last_price,
        last_market_price_update: new Date(market.updatedAt).getTime(),
        trailing_stop_loss_armed: p.trailing_stop_loss_armed,
        stop_loss: p.stop_loss,
        trailing_stop_loss: p.trailing_stop_loss
      };
    });
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.broadcast = async function (request, h) {
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  const position = request.payload;
  try {
    request.server.publish("/positions", position);

    const market = await MarketModel.findOne({
      $and: [{ exchange: position.exchange }, { symbol: position.symbol }]
    }).hint("exchange_1_symbol_1");

    if (position.type === "exit") {
      request.logger.info(
        `${new Date().toISOString()} | SELL | ${position.exchange}@${
          position.symbol
        } @ ${position.price} | ${position.signal}`
      );

      if (environment === "production") {
        //broadcast sell signal
        const promises = []
          .concat({
            key: zignaly_provider_key,
            exchange: "zignaly"
          })
          .map(async to => {
            try {
              await axios.post(zignaly_url, {
                key: to.key,
                exchange: to.exchange,
                type: "exit",
                pair: position.symbol,
                orderType: "market",
                price: position.price,
                signalId: position.signal
              });
            } catch (error) {
              request.logger.error(error.toJSON());
            }
          });

        await Promise.all(promises);
      }
    }

    if (position.type === "entry" && market.broadcast_signals) {
      request.logger.info(
        `${new Date().toISOString()} | BUY | ${position.exchange}@${
          position.symbol
        } @ ${position.price} | ${position.signal}`
      );

      if (environment === "production") {
        // send to zignaly
        const promises = []
          .concat(
            !!zignaly_provider_key
              ? [
                  {
                    key: zignaly_provider_key,
                    exchange: "zignaly"
                  }
                ]
              : []
          )
          .map(async to => {
            try {
              await axios.post(zignaly_url, {
                key: to.key,
                exchange: to.exchange,
                type: "entry",
                pair: position.symbol,
                price: position.price,
                signalId: position.signal,
                orderType: "market",
                buyTTL: 600
              });
            } catch (error) {
              request.logger.error(error.toJSON());
            }
          })
          // add signals promises for other services eg cryptohopper, 3commas
          .concat([]);

        await Promise.all(promises);
      }
    }

    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.getDaylyReport = async function (request, h) {
  try {
    const { symbol, start_time, end_time } = request.query;
    const Position =
      request.server.plugins.mongoose.connection.model("Position");
    const symbols = symbol ? symbol.split(",") : [];

    const positions = await Position.aggregate([
      { $match: { status: "closed" } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$close_date" },
            month: { $month: "$close_date" },
            year: { $year: "$close_date" }
          },
          total: { $sum: 1 },
          positions: { $push: "$$ROOT" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const processed = positions.map(item => ({
      year: item._id.year,
      month: item._id.month,
      day: item._id.day,
      total: item.total,
      total_profit: Number(
        Number(
          item.positions.reduce((acc, current) => acc + current.profit, 0)
        ).toFixed(2)
      )
    }));

    return processed;
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.getWeeklyReport = async function (request, h) {
  try {
    const { symbol, start_time, end_time } = request.query;
    const Position =
      request.server.plugins.mongoose.connection.model("Position");
    const symbols = symbol ? symbol.split(",") : [];

    const positions = await Position.aggregate([
      { $match: { status: "closed" } },
      {
        $group: {
          _id: {
            week: { $week: "$close_date" },
            month: { $month: "$close_date" },
            year: { $year: "$close_date" }
          },
          total: { $sum: 1 },
          positions: { $push: "$$ROOT" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    const processed = positions.map(item => ({
      year: item._id.year,
      month: item._id.month,
      week: item._id.week,
      total: item.total,
      total_profit: Number(
        Number(
          item.positions.reduce((acc, current) => acc + current.profit, 0)
        ).toFixed(2)
      )
    }));

    return processed;
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
