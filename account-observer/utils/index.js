function parseOrder(order) {
  return {
    symbol: order.s,
    orderId: order.i,
    orderListId: order.g,
    clientOrderId: order.c,
    price: order.p,
    origQty: order.q,
    executedQty: order.z,
    cummulativeQuoteQty: order.Z,
    commissionAmount: order.n,
    commissionAsset: order.N,
    status: order.X,
    timeInForce: order.f,
    type: order.o,
    side: order.S,
    stopPrice: order.P,
    time: order.O,
    eventTime: order.E,
    transactTime: order.T
  };
}

function parseAccountUpdate(update) {
  const [usdt] = (update.B || []).filter(b => (b || {}).a === "USDT");
  if (usdt) {
    return +usdt.f;
  }
  return null;
}

module.exports = {
  parseOrder,
  parseAccountUpdate
};
