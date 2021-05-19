const { getAPIInstance, getTraderInstance } = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");
const qs = require("querystring");

const api = getAPIInstance(config);
const trader = getTraderInstance(config);

const createMarketBuyOrder = async ({ symbol, position, amount }) => {
  try {
    const tradeQuery = qs.stringify({ symbol, position, amount });
    const { data } = await trader.post(`/order/market/buy?${tradeQuery}`);
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

module.exports = { trader: { createMarketBuyOrder }, api: { broadcast } };
