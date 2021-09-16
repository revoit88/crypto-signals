const axios = require("axios");
const {
  getBinanceInstance,
  getAPIInstance,
  getTraderInstance
} = require("@crypto-signals/utils");
const config = require("@crypto-signals/config");

function createMicroServiceInstance(baseURL) {
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${config.microservice_token}`
    }
  });
}

const signals_processor_microservice = createMicroServiceInstance(
  config.signals_processor_microservice_url
);

const positions_processor_microservice = createMicroServiceInstance(
  config.positions_processor_microservice_url
);

const candles_processor_microservice = createMicroServiceInstance(
  config.candles_processor_microservice_url
);

const binance = getBinanceInstance(process.env);
const api = getAPIInstance(process.env);
const trader = getTraderInstance(process.env);

module.exports = {
  binance,
  api,
  trader,
  signals_processor_microservice,
  positions_processor_microservice,
  candles_processor_microservice
};
