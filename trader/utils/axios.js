const { getBinanceInstance, getAPIInstance } = require("@crypto-signals/utils");

const binance = getBinanceInstance(process.env);
const api = getAPIInstance(process.env);

module.exports = { binance, api };
