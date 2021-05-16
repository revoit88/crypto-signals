const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");

const binance = axios.create({
  baseURL: config.binance_api_url,
  headers: {
    "X-MBX-APIKEY": config.binance_api_key
  }
});

const trader = axios.create({
  baseURL: config.trader_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const api = axios.create({
  baseURL: config.api_url,
  headers: {
    Authorization: `Bearer ${config.microservice_token}`
  }
});

const getSignature = query => {
  return crypto
    .createHmac("sha256", config.binance_api_secret)
    .update(query)
    .digest("hex");
};

const secureEndpoints = [
  "/api/v3/order",
  "/api/v3/allOrders",
  "/api/v3/account",
  "/wapi/v3/withdraw.html",
  "/wapi/v3/withdrawHistory.html",
  "/sapi/v1/asset/dust"
];

binance.interceptors.request.use(
  config => {
    const [base, query] = String(config.url).split("?");
    const timestamp = Date.now();
    const requiresSignature = secureEndpoints.some(
      endpoint => endpoint === base
    );
    if (requiresSignature) {
      const newQuery = `timestamp=${timestamp}&recvWindow=15000`.concat(
        query ? `&${query}` : ""
      );
      config.url = `${base}?${newQuery}&signature=${getSignature(newQuery)}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

module.exports = { binance, trader, api };
