const axios = require("axios");
const { binance, api, trader } = require("@crypto-signals/http");
const config = require("../config");

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

module.exports = {
  binance,
  api,
  trader,
  signals_performance_microservice,
  signals_processor_microservice,
  positions_processor_microservice,
  candles_processor_microservice
};
