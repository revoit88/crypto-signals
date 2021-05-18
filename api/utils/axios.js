const axios = require("axios");
const {
  getBinanceInstance,
  getAPIInstance,
  getTraderInstance
} = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");

const signals_performance_microservice = axios.create({
  baseURL: config.signals_performance_microservice_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const signals_processor_microservice = axios.create({
  baseURL: config.signals_processor_microservice_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const positions_processor_microservice = axios.create({
  baseURL: config.positions_processor_microservice_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const candles_processor_microservice = axios.create({
  baseURL: config.candles_processor_microservice_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const binance = getBinanceInstance(config);
const api = getAPIInstance(config);
const trader = getTraderInstance(config);

module.exports = {
  binance,
  api,
  trader,
  signals_performance_microservice,
  signals_processor_microservice,
  positions_processor_microservice,
  candles_processor_microservice
};
