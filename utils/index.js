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

const candle_intervals = ["1d", "4h", "1h", "15m", "1m"];

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
 * @param {Object} env
 * @returns {axios.AxiosInstance} Instance
 */
function getAPIInstance(env) {
  return axios.create({
    baseURL: env.API_URL,
    headers: {
      Authorization: `Bearer ${env.MICROSERVICE_TOKEN}`
    }
  });
}

/**
 *
 * @param {Object} env
 * @returns {axios.AxiosInstance} Instance
 */
function getTraderInstance(env) {
  return axios.create({
    baseURL: env.TRADER_URL,
    headers: { Authorization: `Bearer ${env.MICROSERVICE_TOKEN}` }
  });
}

/**
 *
 * @param {Object} env
 * @returns {axios.AxiosInstance} Instance
 */
function getBinanceInstance(env) {
  const binance = axios.create({
    baseURL: env.BINANCE_API_URL,
    headers: { "X-MBX-APIKEY": env.BINANCE_API_KEY }
  });

  const getSignature = query => {
    return crypto
      .createHmac("sha256", env.BINANCE_API_SECRET)
      .update(query)
      .digest("hex");
  };

  const secureEndpoints = [
    "/api/v3/order",
    "/api/v3/allOrders",
    "/api/v3/account",
    "/wapi/v3/withdraw.html",
    "/wapi/v3/withdrawHistory.html",
    "/sapi/v1/asset/dust",
    "/sapi/v1/capital/withdraw/apply",
    "/sapi/v1/capital/withdraw/history"
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

  return binance;
}

function getBooleanValue(value) {
  return typeof value === "boolean"
    ? value
    : typeof value === "string"
    ? value === "true"
    : false;
}

function buildCandles({ candles, exchange, symbol, interval }) {
  return candles.reduce(
    (acc, current) =>
      acc.concat({
        exchange,
        symbol,
        interval,
        id: `${exchange}_${symbol}_${interval}_${cloneObject(current[0])}`,
        event_time: Number(cloneObject(current[0])),
        open_time: Number(cloneObject(current[0])),
        close_time: Number(cloneObject(current[6])),
        open_price: Number(cloneObject(current[1])),
        close_price: Number(cloneObject(current[4])),
        high_price: Number(cloneObject(current[2])),
        low_price: Number(cloneObject(current[3])),
        base_asset_volume: Number(cloneObject(current[5])),
        number_of_trades: Number(cloneObject(current[8])),
        is_closed: new Date().getTime() > Number(cloneObject(current[6])),
        quote_asset_volume: Number(cloneObject(current[7])),
        date: new Date(Number(cloneObject(current[0]))).toISOString()
      }),
    []
  );
}

const benchmark = (fn, text) => {
  return new Promise(async (resolve, reject) => {
    console.time(text);
    let result = fn();
    if (result instanceof Promise) {
      result = await result;
    }
    console.timeEnd(text);
    return resolve(result);
  });
};

module.exports = {
  pairs,
  milliseconds,
  candle_intervals,
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
  getBinanceInstance,
  getBooleanValue,
  buildCandles,
  benchmark
};
