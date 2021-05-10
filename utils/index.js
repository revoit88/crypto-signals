const pairs = require("./pairs.json");

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

module.exports = {
  pairs,
  milliseconds,
  splitArray,
  nz,
  cloneObject,
  toFixedDecimal,
  toSymbolPrecision,
  toSymbolStepPrecision,
  capValue
};
