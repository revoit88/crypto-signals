const Boom = require("@hapi/boom");
const { binance } = require("../../utils/axios");
const qs = require("querystring");

exports.getOrderById = async function (request, h) {
  try {
    const { clientOrderId } = request.params;
    const OrderModel =
      request.server.plugins.mongoose.connection.model("Order");
    const order = await OrderModel.findOne({ clientOrderId })
      .hint("clientOrderId_1")
      .lean();
    return order;
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.createOrder = async function (request, h) {
  const stopPriceUpper = (request.query || {}).stopPriceUpper;

  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      key === "stopPriceUpper" ? acc : { ...acc, [key]: request.query[key] },
    {}
  );

  try {
    const query = qs.stringify(newQuery);
    const { data } = await binance.post(`/api/v3/order?${query}`);
    return data;
  } catch (error) {
    console.error(
      `${new Date().toISOString()}|${request.query.symbol} | ${JSON.stringify(
        ((error || {}).response || {}).data
      )}`
    );
    if (
      (((error || {}).response || {}).data || {}).msg ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          ...newQuery,
          stopPrice: stopPriceUpper,
          type: "TAKE_PROFIT_LIMIT"
        });
        const { data } = await binance.post(`/api/v3/order?${query}`);
        return data;
      } catch (error_2) {
        console.error(
          `${new Date().toISOString()}|${
            request.query.symbol
          } | ${JSON.stringify(((error_2 || {}).response || {}).data)}`
        );
        return Boom.internal();
      }
    } else {
      console.error(error);
      return Boom.internal();
    }
  }
};

exports.cancelOrder = async function (request, h) {
  try {
    const query = qs.stringify(request.query);
    const { data } = await binance.delete(`/api/v3/order?${query}`);
    return data;
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};

const getLastBuyOrder = async query => {
  try {
    const query = qs.stringify({
      symbol: query.symbol,
      orderId: query.orderId
    });
    const { data: order } = await binance.get(`/api/v3/order?${query}`);
    const allOrdersQuery = qs.stringify({
      symbol: query.symbol,
      limit: 20,
      startTime: order.time
    });
    const { data: allOrders } = await binance.get(`/api/v3/allOrders?${query}`);
  } catch (error) {
    throw error;
  }
};

exports.updateOrder = async function (request, h) {
  const stopPriceUpper = (request.query || {}).stopPriceUpper;

  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      ["stopPriceUpper", "orderId"].includes(key)
        ? acc
        : { ...acc, [key]: request.query[key] },
    {}
  );

  try {
    const delete_query = qs.stringify({
      symbol: request.query.symbol,
      ...(request.query.origClientOrderId && {
        origClientOrderId: request.query.origClientOrderId
      }),
      ...(request.query.orderId && { orderId: request.query.orderId })
    });
    await binance.delete(`/api/v3/order?${delete_query}`);
  } catch (error) {
    console.error(((error || {}).response || {}).data);
    if (
      console.error(((error || {}).response || {}).data).msg ===
      "Unknown order sent."
    ) {
      try {
        const last_order = await getLastBuyOrder(request.query);
        return last_order;
      } catch (error_2) {
        console.error(((error_2 || {}).response || {}).data);
        return Boom.internal();
      }
    }
    return Boom.internal();
  }
  try {
    const query = qs.stringify(newQuery);
    const { data } = await binance.post(`/api/v3/order?${query}`);
    return data;
  } catch (error) {
    console.error(((error || {}).response || {}).data);
    if (
      (((error || {}).response || {}).data || {}).msg ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          ...newQuery,
          stopPrice: stopPriceUpper,
          type: "TAKE_PROFIT_LIMIT"
        });
        const { data } = await binance.post(`/api/v3/order?${query}`);
        return data;
      } catch (error) {
        console.error(((error || {}).response || {}).data);
        return Boom.internal();
      }
    } else {
      console.error(error);
      return Boom.internal();
    }
  }
};

exports.createTrailingStopLossOrder = async function (request, h) {
  try {
    const Market = request.server.plugins.mongoose.connection.model("Market");
    const symbol_market = await Market.findOne({
      symbol: request.query.symbol
    });

    if (request.query.quantity * symbol_market.last_price < 10) {
      return h.response();
    }

    const query = qs.stringify(request.query);
    const { data } = await binance.post(`/api/v3/order?${query}`);
    return data;
  } catch (error) {
    console.error(((error || {}).response || {}).data);
    if (
      (((error || {}).response || {}).data || {}).msg ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          type: "MARKET",
          side: "SELL",
          symbol: request.query.symbol,
          quantity: request.query.quantity
        });
        const { data } = await binance.post(`/api/v3/order?${query}`);
        return data;
      } catch (error_2) {
        console.error(((error_2 || {}).response || {}).data);
        return Boom.internal();
      }
    } else {
      console.error(error);
      return Boom.internal();
    }
  }
};

exports.updateTrailingStopLossOrder = async function (request, h) {
  const newQuery = Object.keys(request.query).reduce(
    (acc, key) =>
      ["orderId"].includes(key) ? acc : { ...acc, [key]: request.query[key] },
    {}
  );
  const Market = request.server.plugins.mongoose.connection.model("Market");
  const symbol_market = await Market.findOne({
    symbol: request.query.symbol
  });

  if (request.query.quantity * symbol_market.last_price < 10) {
    return h.response();
  }

  try {
    const delete_query = qs.stringify({
      symbol: request.query.symbol,
      ...(request.query.origClientOrderId && {
        origClientOrderId: request.query.origClientOrderId
      }),
      ...(request.query.orderId && { orderId: request.query.orderId })
    });
    await binance.delete(`/api/v3/order?${delete_query}`);
  } catch (error) {
    console.error(((error || {}).response || {}).data);
    return Boom.internal();
  }
  try {
    const query = qs.stringify(newQuery);
    const { data } = await binance.post(`/api/v3/order?${query}`);
    return data;
  } catch (error) {
    console.error(((error || {}).response || {}).data);
    if (
      (((error || {}).response || {}).data || {}).msg ===
      "Stop price would trigger immediately."
    ) {
      try {
        const query = qs.stringify({
          type: "MARKET",
          side: "SELL",
          symbol: request.query.symbol,
          quantity: request.query.quantity
        });
        const { data } = await binance.post(`/api/v3/order?${query}`);
        return data;
      } catch (error) {
        console.error(((error || {}).response || {}).data);
        return Boom.internal();
      }
    } else {
      console.error(error);
      return Boom.internal();
    }
  }
};

exports.broadcast = async function (request, h) {
  const order = request.payload;
  try {
    request.server.publish("/orders", order);
    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
