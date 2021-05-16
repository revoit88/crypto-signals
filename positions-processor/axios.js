const { trader, api } = require("@crypto-signals/http");
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

const broadcast = async (route, value) => {
  try {
    await api.post(`/${route}/broadcast`, value);
  } catch (error) {
    throw ((error || {}).response || {}).data;
  }
};

module.exports = { trader: { createMarketSellOrder }, api: { broadcast } };
