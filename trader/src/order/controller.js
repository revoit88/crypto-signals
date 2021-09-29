const Boom = require("@hapi/boom");
const { binance, api } = require("../../utils/axios");
const {
  toSymbolStepPrecision,
  milliseconds
} = require("@crypto-signals/utils");
const {
  exchange,
  minimum_order_size,
  quote_asset
} = require("@crypto-signals/config");
const qs = require("querystring");

const MAX_REQUESTS = 48; // limit 50

async function checkHeaders(headers, model) {
  if (Number(headers["x-mbx-order-count-10s"]) >= MAX_REQUESTS) {
    await model.findOneAndUpdate(
      { id: "production" },
      { $set: { create_order_after: Date.now() + 1e4 } }
    );
  }
  return;
}

function getError(error) {
  return typeof (error || {}).toJSON === "function" ? error.toJSON() : error;
}

async function getOrderFromDbOrBinance(request, buy_order) {
  const OrderModel = request.server.plugins.mongoose.connection.model("Order");
  let order;
  try {
    order = await OrderModel.findOne({ clientOrderId: buy_order.clientOrderId })
      .hint("clientOrderId_1")
      .lean();
    if (!order) {
      throw new Error("Order does not exist in database.");
    }
  } catch (error) {
    request.logger.error(error);
    const query = qs.stringify({
      orderId: buy_order.orderId,
      symbol: buy_order.symbol
    });
    try {
      const { data } = await binance.get(`/api/v3/order?${query}`);

      if (data.orderId) {
        order = data;
      }
    } catch (error_2) {
      request.logger.error(error_2.toJSON());
    }
  }

  return order;
}

exports.getOrder = async function (request, h) {
  try {
    const query = qs.stringify(request.query);
    const { data } = await binance.get(`/api/v3/order?${query}`);
    if (!!data.orderId) {
      return data;
    }
    throw data;
  } catch (error) {
    request.server.logger.error(getError(error));
    try {
      const query = qs.stringify(request.query);
      const { data } = await binance.get(`/api/v3/order?${query}`);
      if (!!data.orderId) {
        return data;
      }
      throw data;
    } catch (error_2) {
      request.server.logger.error(getError(error_2));
      return Boom.internal();
    }
  }
};

exports.createOrder = async function (request, h) {
  const stopPrice = (request.query || {}).stopPrice;
  const signalId = request.query.signal;

  const SignalModel =
    request.server.plugins.mongoose.connection.model("Signal");
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  const AccountModel =
    request.server.plugins.mongoose.connection.model("Account");

  const account = await AccountModel.findOne({ id: "production" }).hint("id_1");

  if (Date.now() < account.create_order_after) {
    return h.response();
  }

  const market = await MarketModel.findOne({
    $and: [{ exchange }, { symbol: request.query.symbol }]
  }).hint("exchange_1_symbol_1");

  if (!!market.trader_lock) {
    return h.response();
  } else {
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: true, last_trader_lock_update: Date.now() } }
    );
  }

  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      ["stopPrice", "signal"].includes(key)
        ? acc
        : { ...acc, [key]: request.query[key] },
    {}
  );

  try {
    const query = qs.stringify({ ...newQuery, stopPrice });
    const { data, headers } = await binance.post(`/api/v3/order?${query}`);

    await checkHeaders(headers, AccountModel);

    if (!!(data || {}).orderId) {
      await SignalModel.findOneAndUpdate(
        { id: signalId },
        { $set: { buy_order: data } }
      );
    }
  } catch (error) {
    if (
      ((((error || {}).response || {}).data || {}).msg || "") ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          ...newQuery,
          price: stopPrice,
          type: "LIMIT"
        });
        const { data, headers } = await binance.post(`/api/v3/order?${query}`);

        await checkHeaders(headers, AccountModel);

        if (!!(data || {}).orderId) {
          await SignalModel.findOneAndUpdate(
            { id: signalId },
            { $set: { buy_order: data } }
          );
        }
      } catch (error_2) {
        request.server.logger.error(getError(error_2));
      }
    } else {
      request.server.logger.error(getError(error));
    }
  } finally {
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }
};

exports.cancelBuyOrder = async function (request, h) {
  const signalId = request.query.signal;
  const SignalModel =
    request.server.plugins.mongoose.connection.model("Signal");
  try {
    const signal = await SignalModel.findOne({ id: signalId }).hint("id_1");

    if (!!signal.trader_lock || !(signal.buy_order || {}).orderId) {
      return h.response();
    } else {
      await SignalModel.findOneAndUpdate(
        { id: signalId },
        { $set: { trader_lock: true } }
      );
    }

    const order = await getOrderFromDbOrBinance(request, signal.buy_order);

    if (!["FILLED", "CANCELED"].includes(order.status)) {
      const query = qs.stringify({
        symbol: order.symbol,
        orderId: order.orderId
      });
      const { data: cancelled_order } = await binance.delete(
        `/api/v3/order?${query}`
      );
      await SignalModel.findOneAndUpdate(
        { id: signalId },
        { $set: { buy_order: cancelled_order } }
      );
    }
  } catch (error) {
    request.server.logger.error(getError(error));
  } finally {
    await SignalModel.findOneAndUpdate(
      { id: signalId },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }
};

const getLastBuyOrder = async ({ symbol, startTime }) => {
  try {
    const query = qs.stringify({ symbol, startTime });
    const { data: allOrders } = await binance.get(`/api/v3/allOrders?${query}`);
    return Array.isArray(allOrders)
      ? allOrders.filter(order => order.side === "BUY").slice(-1)
      : [];
  } catch (error) {
    throw error;
  }
};

exports.updateOrder = async function (request, h) {
  const stopPrice = (request.query || {}).stopPrice;
  const signalId = request.query.signal;

  const SignalModel =
    request.server.plugins.mongoose.connection.model("Signal");
  const PositionModel =
    request.server.plugins.mongoose.connection.model("Position");
  const AccountModel =
    request.server.plugins.mongoose.connection.model("Account");

  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");

  const account = await AccountModel.findOne({ id: "production" });

  if (Date.now() < account.create_order_after) {
    return h.response();
  }

  const signal = await SignalModel.findOne({ id: signalId }).hint("id_1");
  const market = await MarketModel.findOne({
    $and: [{ exchange }, { symbol: request.query.symbol }]
  }).hint("exchange_1_symbol_1");

  if (!!signal.trader_lock || !!market.trader_lock) {
    return h.response();
  } else {
    await SignalModel.findOneAndUpdate(
      { id: signalId },
      { $set: { trader_lock: true, last_tsb_update: Date.now() } }
    );
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: true, last_trader_lock_update: Date.now() } }
    );
  }

  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      ["stopPrice", "signal"].includes(key)
        ? acc
        : { ...acc, [key]: request.query[key] },
    {}
  );

  try {
    if ((signal.buy_order || {}).orderId) {
      const closed_position = await PositionModel.exists({
        $and: [{ signal: signal._id }, { filled_on_update: false }]
      });

      const order = await getOrderFromDbOrBinance(request, signal.buy_order);

      if (
        ["FILLED", "PARTIALLY_FILLED"].includes(order.status) &&
        !closed_position
      ) {
        api
          .post("/positions", {
            signal: signalId,
            buy_order: order
          })
          .catch(error => request.logger.error(error));
      }
      if (["NEW", "PARTIALLY_FILLED"].includes(order.status)) {
        const delete_query = qs.stringify({
          symbol: request.query.symbol,
          orderId: signal.buy_order.orderId
        });
        const { data } = await binance.delete(`/api/v3/order?${delete_query}`);
        await SignalModel.findOneAndUpdate(
          { id: signalId },
          { $set: { buy_order: data, last_tsb_update: Date.now() } }
        );
      }
    }
  } catch (error) {
    if (
      ((((error || {}).response || {}).data || {}).msg || "") ===
      "Unknown order sent."
    ) {
      try {
        const [last_order] = await getLastBuyOrder({
          symbol: request.query.symbol,
          startTime:
            (signal.buy_order || {}).transactTime ||
            Date.now() - milliseconds.minute * 30
        });

        if (
          ["FILLED", "PARTIALLY_FILLED"].includes((last_order || {}).status) ||
          ((last_order || {}).status === "CANCELED" &&
            Number((last_order || {}).executedQty) > 0)
        ) {
          await SignalModel.findOneAndUpdate(
            { id: signalId },
            { $set: { trader_lock: false } }
          );
          await MarketModel.findOneAndUpdate(
            { $and: [{ exchange }, { symbol: request.query.symbol }] },
            { $set: { trader_lock: false } }
          );
          return h.response();
        }

        if (
          (last_order || {}).orderId &&
          (last_order || {}).status !== "CANCELED"
        ) {
          const delete_query = qs.stringify({
            symbol: request.query.symbol,
            orderId: last_order.orderId
          });
          const { data } = await binance.delete(
            `/api/v3/order?${delete_query}`
          );
          await SignalModel.findOneAndUpdate(
            { id: signalId },
            { $set: { buy_order: data, last_tsb_update: Date.now() } }
          );
        }
      } catch (error_2) {
        request.server.logger.error(getError(error_2));
      }
    } else {
      request.server.logger.error(getError(error));
    }
  }
  try {
    const query = qs.stringify({ ...newQuery, stopPrice });
    const { data, headers } = await binance.post(`/api/v3/order?${query}`);

    await checkHeaders(headers, AccountModel);

    if (data.orderId) {
      await SignalModel.findOneAndUpdate(
        { id: signalId },
        { $set: { buy_order: data } }
      );
    }
  } catch (error) {
    if (
      ((((error || {}).response || {}).data || {}).msg || "") ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          ...newQuery,
          price: stopPrice,
          type: "LIMIT"
        });
        const { data, headers } = await binance.post(`/api/v3/order?${query}`);

        await checkHeaders(headers, AccountModel);

        if ((data || {}).orderId) {
          await SignalModel.findOneAndUpdate(
            { id: signalId },
            { $set: { buy_order: data } }
          );
        }
      } catch (error_2) {
        request.server.logger.error(getError(error_2));
      }
    } else {
      request.server.logger.error(getError(error));
    }
  } finally {
    await SignalModel.findOneAndUpdate(
      { id: signalId },
      { $set: { trader_lock: false } }
    );
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }
};

exports.createMarketOrder = async function (request, h) {
  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      ["position"].includes(key) ? acc : { ...acc, [key]: request.query[key] },
    {}
  );
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  const PositionModel =
    request.server.plugins.mongoose.connection.model("Position");

  const AccountModel =
    request.server.plugins.mongoose.connection.model("Account");

  const account = await AccountModel.findOne({ id: "production" }).lean();

  if (Date.now() < account.create_order_after) {
    return h.response();
  }

  const positionId = request.query.position;

  const position = await PositionModel.findOne({ id: positionId }).lean();

  if (!!position.trader_lock) {
    return h.response();
  } else {
    await PositionModel.findOneAndUpdate(
      { id: positionId },
      { $set: { trader_lock: true } }
    );
  }

  const symbol_market = await MarketModel.findOne({
    $and: [{ exchange }, { symbol: position.symbol }]
  })
    .hint("exchange_1_symbol_1")
    .lean();

  const buy_order = await getOrderFromDbOrBinance(request, position.buy_order);

  if (!Reflect.has(buy_order || {}, "executedQty")) {
    await PositionModel.findOneAndUpdate(
      { id: positionId },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }

  if (
    Number((buy_order || {}).executedQty) * symbol_market.last_price <=
    minimum_order_size
  ) {
    await PositionModel.findOneAndUpdate(
      { id: positionId },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }

  try {
    const quantity_to_sell =
      position.symbol.replace(quote_asset, "") === buy_order.commissionAsset
        ? +buy_order.executedQty - +buy_order.commissionAmount
        : buy_order.executedQty;

    const query = qs.stringify({
      ...newQuery,
      type: "MARKET",
      side: "SELL",
      quantity: toSymbolStepPrecision(quantity_to_sell, position.symbol)
    });
    const { data, headers } = await binance.post(`/api/v3/order?${query}`);

    await checkHeaders(headers, AccountModel);

    if (data.orderId) {
      await PositionModel.findOneAndUpdate(
        { id: positionId },
        { $set: { sell_order: data } }
      );
    }
  } catch (error) {
    request.server.logger.error(getError(error));
  } finally {
    await PositionModel.findOneAndUpdate(
      { id: positionId },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }
};

exports.createMarketBuyOrder = async function (request, h) {
  const positionId = request.query.position;

  const PositionModel =
    request.server.plugins.mongoose.connection.model("Position");
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  const AccountModel =
    request.server.plugins.mongoose.connection.model("Account");

  const account = await AccountModel.findOne({ id: "production" }).hint("id_1");

  if (Date.now() < account.create_order_after) {
    return h.response();
  }

  const market = await MarketModel.findOne({
    $and: [{ exchange }, { symbol: request.query.symbol }]
  }).hint("exchange_1_symbol_1");

  if (!!market.trader_lock) {
    return h.response();
  } else {
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: true, last_trader_lock_update: Date.now() } }
    );
  }

  try {
    const query = qs.stringify({
      symbol: request.query.symbol,
      side: "BUY",
      type: "MARKET",
      quoteOrderQty: request.query.amount
    });
    const { data, headers } = await binance.post(`/api/v3/order?${query}`);

    await checkHeaders(headers, AccountModel);

    if (!!(data || {}).orderId) {
      await PositionModel.findOneAndUpdate(
        { id: positionId },
        { $set: { buy_order: data } }
      );
    }
  } catch (error) {
    request.server.logger.error(getError(error));
  } finally {
    await MarketModel.findOneAndUpdate(
      { $and: [{ exchange }, { symbol: request.query.symbol }] },
      { $set: { trader_lock: false } }
    );
    return h.response();
  }
};
