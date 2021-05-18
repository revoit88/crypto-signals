const axios = require("axios");
const crypto = require("crypto");
const pairs = require("./pairs");

const milliseconds = {
  seconds: 1e3,
  minute: 6e4,
  hour: 36e5,
  day: 36e5 * 24,
  week: 36e5 * 24 * 7
};

/**
 *
 * @param {Array} array Initial array
 * @param {Array} remaining Array of items
 * @param {Number} number Number of items each array will have
 * @returns {Array[]} Array of arrays
 */
const splitArray = (array = [], remaining = [], number) => {
  const items = remaining.slice(0, number);
  if (remaining.length - number > 0) {
    return splitArray(array.concat([items]), remaining.slice(number), number);
  }
  return array.concat([items]);
};

const nz = (v, d) => (isNaN(v) ? d ?? 0 : v);

const cloneObject = obj => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

function toFixedDecimal(value, decimals) {
  return value ? +Number(value).toFixed(decimals || 2) : null;
}

function getSymbolPrecision(symbol, type) {
  return pairs.find(p => p.symbol === symbol)[type];
}

const getResult = (value, tick) => {
  return Math.trunc(Number(value / tick)) / Math.ceil(1 / tick);
};

/**
 * Returns the price fixed to the symbol's precision point
 * @param {Number} value Price
 * @param {String} symbol Symbol
 */
function toSymbolPrecision(value, symbol) {
  const tick = getSymbolPrecision(symbol, "priceTickSize");
  return getResult(value, tick);
}

function toSymbolStepPrecision(value, symbol) {
  const tick = getSymbolPrecision(symbol, "stepSize");
  return getResult(value, tick);
}

/**
 *
 * @param {number} currentValue
 * @param {number} capAtValue
 */
const capValue = (currentValue, capAtValue) => {
  return currentValue > capAtValue ? capAtValue : currentValue;
};

/**
 *
 * @param {Number} current Current value
 * @param {Number} from From value
 * @returns {Number} result
 */
function getChange(current, from) {
  return Number(Number((current * 100) / from - 100).toFixed(2));
}

function orderAlphabetically(string1 = "", string2 = "") {
  string1 = string1.toUpperCase();
  string2 = string2.toUpperCase();
  return string1 < string2 ? -1 : string1 > string2 ? 1 : 0;
}

const validateNumber = n => n === null || (typeof n === "number" && !isNaN(n));

function getPercentageOfValue(value, percent) {
  return Number(value * (percent / 100));
}

/**
 *
 * @param {Number} candles Candles offset
 * @param {"1d"|"4h"|"1h"|"5m"|"1m"} interval Candles interval
 * @returns {Number} Time offset
 */
function getTimeDiff(candles, interval) {
  let factor = 0;
  if (interval === "1d") {
    factor = milliseconds.day;
  }
  if (interval === "4h") {
    factor = milliseconds.hour * 4;
  }
  if (interval === "1h") {
    factor = milliseconds.hour;
  }
  if (interval === "5m") {
    factor = milliseconds.minute * 5;
  }
  if (interval === "1m") {
    factor = milliseconds.minute;
  }
  return factor * candles;
}

/**
 *
 * @param {Object} config
 * @returns {axios.AxiosInstance} Instance
 */
function getAPIInstance(config) {
  return axios.create({
    baseURL: config.api_url,
    headers: {
      Authorization: `Bearer ${config.microservice_token}`
    }
  });
}

/**
 *
 * @param {Object} config
 * @returns {axios.AxiosInstance} Instance
 */
function getTraderInstance(config) {
  return axios.create({
    baseURL: config.trader_url,
    headers: { Authorization: `Bearer ${config.microservice_token}` }
  });
}

/**
 *
 * @param {Object} config
 * @returns {axios.AxiosInstance} Instance
 */
function getBinanceInstance(config) {
  const binance = axios.create({
    baseURL: config.binance_api_url,
    headers: { "X-MBX-APIKEY": config.binance_api_key }
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
    cfg => {
      const [base, query] = String(cfg.url).split("?");
      const timestamp = Date.now();
      const requiresSignature = secureEndpoints.some(
        endpoint => endpoint === base
      );
      if (requiresSignature) {
        const newQuery = `timestamp=${timestamp}&recvWindow=15000`.concat(
          query ? `&${query}` : ""
        );
        cfg.url = `${base}?${newQuery}&signature=${getSignature(newQuery)}`;
      }
      return cfg;
    },
    error => Promise.reject(error)
  );

  return binance;
}

module.exports = {
  pairs,
  milliseconds,
  splitArray,
  nz,
  cloneObject,
  toFixedDecimal,
  toSymbolPrecision,
  toSymbolStepPrecision,
  capValue,
  getChange,
  orderAlphabetically,
  validateNumber,
  getPercentageOfValue,
  getTimeDiff,
  getAPIInstance,
  getTraderInstance,
  getBinanceInstance
};
