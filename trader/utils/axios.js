const {
  getBinanceInstance,
  getAPIInstance
} = require("@crypto-signals/config");
const config = require("@crypto-signals/config");

const binance = getBinanceInstance(config);
const api = getAPIInstance(config);

module.exports = { binance, api };
