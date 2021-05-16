const { trader } = require("@crypto-signals/http");
const qs = require("querystring");

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
