const { getBinanceInstance, getAPIInstance } = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");

const binance = getBinanceInstance(config);
const api = getAPIInstance(config);

module.exports = { binance, api };
