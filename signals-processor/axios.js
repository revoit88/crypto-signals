const { getTraderInstance } = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");
const qs = require("querystring");

const trader = getTraderInstance(config);

const createMarketSellOrder = async ({ symbol, position }) => {
  try {
    const tradeQuery = qs.stringify({ symbol, position });
    const { data } = await trader.post(`/order/market?${tradeQuery}`);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = { trader: { createMarketSellOrder } };
