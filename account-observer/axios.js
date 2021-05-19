const { getAPIInstance, getBinanceInstance } = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");
const qs = require("querystring");

const api = getAPIInstance(config);
const binance = getBinanceInstance(config);

const createListenKey = async () => {
  try {
    const { data } = await binance.post("/api/v3/userDataStream");

    if (data.listenKey) {
      return data.listenKey;
    }

    return null;
  } catch (error) {
    throw error;
  }
};

const deleteListenKey = async listenKey => {
  try {
    const query = qs.stringify({ listenKey });
    await binance.delete(`/api/v3/userDataStream?${query}`);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = { binance: { createListenKey, deleteListenKey }, api };
