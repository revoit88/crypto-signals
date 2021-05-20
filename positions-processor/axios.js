const { getAPIInstance, getTraderInstance } = require("@crypto-signals/utils");
const qs = require("querystring");

const api = getAPIInstance(process.env);
const trader = getTraderInstance(process.env);

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
