const Boom = require("@hapi/boom");
const { binance } = require("../../utils/axios");
const { nz } = require("@crypto-signals/utils");
const {
  minimum_order_size,
  quote_asset,
  reserved_amount
} = require("@crypto-signals/config");
const qs = require("querystring");

exports.dca = async function (request, h) {
  try {
    const PositionModel =
      request.server.plugins.mongoose.connection.model("Position");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");
    const accountPromise = binance.get("/api/v3/account");

    const { data: account } = await accountPromise;

    const positions = await PositionModel.find(
      { $and: [{ status: "open" }, { buy_order: { $exists: true } }] },
      { "buy_order.cummulativeQuoteQty": 1 }
    ).lean();

    const market = await MarketModel.findOne(
      { symbol: `BTC${quote_asset}` },
      { last_price: true }
    ).lean();

    const totalQuoteAssetInPositions = positions.reduce((acc, position) => {
      return acc + nz(+position.buy_order.cummulativeQuoteQty);
    }, 0);

    const [asset] = account.balances.filter(item => item.asset === quote_asset);
    const total_asset = +asset.free + totalQuoteAssetInPositions;
    const amount_to_dca = total_asset - reserved_amount;

    if (
      total_asset > reserved_amount &&
      amount_to_dca > minimum_order_size * 1.1
    ) {
      const query = qs.stringify({
        symbol: `BTC${quote_asset}`,
        side: "BUY",
        type: "MARKET",
        quoteOrderQty: amount_to_dca
      });
      const { data } = await binance.post(`/api/v3/order?${query}`);

      if (!!(data || {}).orderId) {
        console.log(
          `[${new Date().toISOString()}] DCA | Bought $${amount_to_dca} worth of BTC @ ${
            market.last_price
          }`
        );
      }
    }
    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};
