const Mongoose = require("mongoose");
const { Candle, OHLC } = require("./src/interfaces");
const strategies = require("./src/strategies");
const { toSymbolPrecision } = require("@crypto-signals/utils");
const config = require("./config");

/**
 *
 * @param {Candle} currentCandle Current candle
 * @param {Candle[]} previousCandles Previous Candles
 * @returns {SignalI[]} Buy signals
 */
const calculateBuySignal = (candles, last_signal, last_position) => {
  const signals = config.strategy
    .reduce((acc, key) => {
      const result = strategies[key](candles, last_signal, last_position);
      return acc.concat(result);
    }, [])
    .filter(v => !!v);

  if (signals.length) {
    return signals.map(s => ({
      time: new Date().getTime(),
      type: "buy",
      ...s
    }));
  }
  return [];
};

const castToObjectId = id =>
  typeof id === "string" ? Mongoose.Types.ObjectId(id) : id;

/**
 *
 * @param {Candle} current_candle
 * @returns {Number} Trailing Stop Buy
 */
const getTSB = candle => {
  return toSymbolPrecision(candle.close_price, candle.symbol);
};

const getPlainCandle = obj =>
  Object.keys(obj).reduce(
    (o, key) => ({
      ...o,
      ...(!["signals", "_id", "__v", "createdAt", "updatedAt"].includes(key)
        ? { [key]: obj[key] }
        : {})
    }),
    {}
  );

module.exports = {
  calculateBuySignal,
  castToObjectId,
  getTSB,
  getPlainCandle
};
