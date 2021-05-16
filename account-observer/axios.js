const { binance, api } = require("@crypto-signals/http");
const qs = require("querystring");

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
