const Mongoose = require("mongoose");
const tulind = require("tulind");
const mesa = require("./mesa");
const { Candle, OHLC } = require("./src/interfaces");
const {
  nz,
  toSymbolPrecision,
  toFixedDecimal,
  cloneObject,
  milliseconds
} = require("@crypto-signals/utils");

const truncateDecimals = v => Number(Number(v).toFixed(4));
const validateValue = value =>
  typeof value === "undefined" ? null : truncateDecimals(value);

/**
 *
 * @param {Candle[]} array
 * @returns {OHLC} result
 */
const getOHLCValues = array => {
  /**
   *
   * @param {Object} ohlc Object containing Open, High, Low, Close values
   * @returns {Boolean} `true` for error, `false` if all values are ok
   */
  const assertResult = ohlc => {
    return Object.keys(ohlc).some(key => {
      return ohlc[key].some(v => typeof v !== "number");
    });
  };

  const ohlc = array.reduce(
    (
      acc,
      { open_price, close_price, high_price, low_price, base_asset_volume }
    ) => {
      return {
        open: acc.open.concat(open_price),
        high: acc.high.concat(high_price),
        low: acc.low.concat(low_price),
        close: acc.close.concat(close_price),
        volume: acc.volume.concat(base_asset_volume),
        hl2: acc.hl2.concat((high_price + low_price) / 2)
      };
    },
    {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
      hl2: []
    }
  );

  const error = assertResult(ohlc);
  if (error) {
    throw "INVALID OHLC VALUES";
  }
  return ohlc;
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Relative Strength Signal value
 */
const getRSI = data => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.rsi.indicator(data, [14], async (err, [res]) => {
      if (err) {
        return reject(err);
      }
      const stoch = await getStochRSI(res);
      return resolve({ rsi: validateValue(res[res.length - 1]), ...stoch });
    });
  });
};
const getBollingerBands = (data, last_price) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.bbands.indicator(data, [20, 2], (err, res) => {
      if (err) {
        return reject(err);
      }

      const getDirection = (array, index) => {
        if (array[1][index - 1] > array[1][index]) {
          return "down";
        }
        if (array[1][index - 1] < array[1][index]) {
          return "up";
        }
        return "side";
      };

      const x = res[0].map((i, index) => ({
        bbands_lower: validateValue(i),
        bbands_middle: validateValue(res[1][index]),
        bbands_upper: validateValue(res[2][index]),
        bbands_percent_b: validateValue((last_price - i) / (res[2][index] - i)),
        bbands_bandwith: validateValue((res[2][index] - i) / res[1][index]),
        bbands_deviation: validateValue((res[2][index] - res[1][index]) / 2),
        bbands_deviation_percent: validateValue(
          ((res[2][index] - res[1][index]) / res[1][index]) * 100
        ),
        bbands_direction: getDirection(res, index)
      }));
      return resolve(x.pop());
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Williams %R value
 */
const getWilliamsR = data => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.willr.indicator(data, [14], (err, [res]) => {
      if (err) {
        return reject(err);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Exponential Moving Average value
 */
const getEMA = (data, period = 5, all = false) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.ema.indicator(data, [period], (err, [res]) => {
      if (err) {
        return reject(err);
      }
      if (all) {
        return resolve(res);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Simple Moving Average value
 */
const getSMA = (data, periods = 28) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.sma.indicator(data, [periods], (err, [res]) => {
      if (err) {
        return reject(err);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Average True Range value
 */
const getATR = (data, periods = 14, return_sma = true) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.atr.indicator(data, [periods], async (err, [res]) => {
      if (err) {
        return reject(err);
      }
      if (!return_sma) {
        return resolve(validateValue(res.pop()));
      }
      const sma = await getSMA([res], 28);
      return resolve({ atr: validateValue(res.pop()), atr_sma: sma });
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Average True Range value
 */
const getTR = (data, all = false) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.tr.indicator(data, [], async (err, [res]) => {
      if (err) {
        return reject(err);
      }
      if (all) {
        return resolve(res);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} On Balance Volume value
 */
const getOBV = (data, return_sma = true) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.obv.indicator(data, [], async (err, [res]) => {
      if (err) {
        return reject(err);
      }
      if (!return_sma) {
        return resolve(validateValue(res.pop()));
      }
      const ema = await getEMA([res], 28);
      return resolve({ obv: validateValue(res.pop()), obv_ema: ema });
    });
  });
};

/**
 *
 * @param {Array<Number[]>} data
 * @returns {Promise<Number>} Parabolic SAR value
 */
const getParabolicSAR = data => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.psar.indicator(data, [0.02, 0.2], (err, [res]) => {
      if (err) {
        return reject(err);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

const getMACD = data => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.macd.indicator(data, [12, 26, 9], (err, res) => {
      if (err) {
        return reject(err);
      }
      const x = res[0].map((i, index) => ({
        macd: validateValue(i),
        macd_signal: validateValue(res[1][index]),
        macd_histogram: validateValue(res[2][index])
      }));
      return resolve(x.pop());
    });
  });
};

const getStochRSI = data => {
  return new Promise(async (resolve, reject) => {
    if (!data.length) {
      return resolve(null);
    }
    tulind.indicators.stoch.indicator(
      [data, data, data],
      [14, 3, 3],
      (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve({
          stoch_rsi_k: validateValue(res[0].pop()),
          stoch_rsi_d: validateValue(res[1].pop())
        });
      }
    );
  });
};

const getStochasticOscillator = data => {
  return new Promise(async (resolve, reject) => {
    if (!data.length) {
      return resolve(null);
    }
    tulind.indicators.stoch.indicator(data, [14, 3, 3], (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve({
        stoch_k: validateValue(res[0].pop()),
        stoch_d: validateValue(res[1].pop())
      });
    });
  });
};

const getADX = (data, periods = 14) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.adx.indicator(data, [periods], (err, [res]) => {
      if (err) {
        return reject(err);
      }
      return resolve(validateValue(res.pop()));
    });
  });
};

const getDI = (data, periods = 14) => {
  return new Promise(async (resolve, reject) => {
    tulind.indicators.di.indicator(data, [periods], (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve({
        plus_di: validateValue(res[0].pop()),
        minus_di: validateValue(res[1].pop())
      });
    });
  });
};

const getDMI = (data, periods = 14) => {
  return new Promise(async (resolve, reject) => {
    try {
      const adx = await getADX(data, periods);
      const di = await getDI(data, periods);
      return resolve({ adx, ...di });
    } catch (error) {
      console.error(error);
      return reject(error);
    }
  });
};

/**
 *
 * @param {Candle[]} candles
 * @param {OHLC} ohlc
 */
const getSupertrend = async (candles, ohlc) => {
  if (candles.length === 1) {
    return {};
  }
  const { high, low, close, hl2 } = ohlc;

  const factor = 3;
  const pd = 7;

  const atr = await getATR([high, low, close], pd, false);

  const up = hl2[hl2.length - 1] - factor * atr;
  const dn = hl2[hl2.length - 1] + factor * atr;

  const trend_up =
    close[close.length - 2] > candles[candles.length - 2]?.trend_up
      ? Math.max(up, candles[candles.length - 2]?.trend_up)
      : up;

  const trend_down =
    close[close.length - 2] < candles[candles.length - 2]?.trend_down
      ? Math.min(dn, candles[candles.length - 2]?.trend_down)
      : dn;

  const trend =
    close[close.length - 1] > candles[candles.length - 2]?.trend_down
      ? 1
      : close[close.length - 2] < candles[candles.length - 2]?.trend_up
      ? -1
      : nz(candles[candles.length - 2]?.trend, 1);

  return { trend, trend_up, trend_down };
};

const getCumulativeIndicator = async ({ candles, ohlc, fn, getter }) => {
  const [result] = await candles
    .reduce(async (p_acc, candle, index, array) => {
      const acc = await p_acc;
      const sliced_candles = array.slice(0, index + 1).map(sliced => ({
        ...sliced,
        ...getter(acc.find(v => v.id === sliced.id) || {})
      }));
      const sliced_ohlc = Object.entries(ohlc).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value.slice(0, index + 1) }),
        {}
      );

      const value = await fn(sliced_candles, sliced_ohlc);
      return acc.concat({ ...candle, ...value });
    }, Promise.resolve([]))
    .then(r => r.slice(-1));
  return result;
};

/**
 *
 * @param {Candle[]} candles
 * @param {OHLC} ohlc
 */
const getATRStop = async (candles, ohlc) => {
  if (candles.length === 1) {
    return {};
  }
  const { high, low, close } = ohlc;

  const parseValue = value => {
    return toSymbolPrecision(value, candles[0].symbol);
  };

  const factor = 3;
  const pd = 5;

  const atr = await getATR([high, low, close], pd, false);
  const loss = atr * factor;

  const [previous_candle] = candles.slice(-2);
  const [previous_close, current_close] = close.slice(-2);

  let atr_stop = 0;

  if (
    current_close > parseValue(nz(previous_candle.atr_stop)) &&
    previous_close > parseValue(nz(previous_candle.atr_stop))
  ) {
    atr_stop = parseValue(
      Math.max(nz(previous_candle.atr_stop), current_close - loss)
    );
  } else if (
    current_close < parseValue(nz(previous_candle.atr_stop)) &&
    previous_close < parseValue(nz(previous_candle.atr_stop))
  ) {
    atr_stop = parseValue(
      Math.min(nz(previous_candle.atr_stop), current_close + loss)
    );
  } else if (current_close > parseValue(nz(previous_candle.atr_stop))) {
    atr_stop = parseValue(current_close - loss);
  } else {
    atr_stop = parseValue(current_close + loss);
  }

  return { atr_stop };
};

/**
 *
 * @param {Candle[]} candles
 * @param {OHLC} ohlc
 */
const getCHATR = async (candles, ohlc) => {
  if (candles.length === 1) {
    return {};
  }

  const { high, low, close } = ohlc;

  const tr = await getTR([high, low, close], true);
  const tr_ema = await getEMA([tr], 19, true);
  const atrp = tr_ema
    .map((t, i) => [t, close[i]])
    .map(([t, c]) => (t / c) * 100);
  const avg = await getEMA([atrp], 28);

  return {
    ch_atr_ema: toFixedDecimal(nz(avg)),
    ch_atr: toFixedDecimal(nz(atrp[atrp.length - 1]))
  };
};

const promisify = (key, fn, args) => {
  return new Promise(async resolve => {
    return resolve({ [key]: await fn(...args) });
  });
};

/**
 *
 * @param {OHLC} ohlc Values
 * @param {Candle[]} candles candles
 */
const getIndicatorsValues = (ohlc, candles) => {
  const { high, close, low, volume, hl2 } = ohlc;
  const [previous_candle, current_candle] = cloneObject(candles.slice(-2));
  return new Promise(async resolve => {
    const promises = [
      // getRSI([close]),
      // promisify("rsi", getRSI, [[close]]),
      // promisify("will_r", getWilliamsR, [[high, low, close]]),
      // promisify("ema_7", getEMA, [[close], 7]),
      // promisify("ema_25", getEMA, [[close], 25]),
      // promisify("ema_100", getEMA, [[close], 100]),
      // promisify("sma", getSMA, [[close]]),
      // promisify("atr_sma", getSMA, [
      //   [await getATR([high, low, close], true)],
      //   28
      // ]),
      getATR([high, low, close]),
      getOBV([close, volume]),
      promisify("volume_sma", getSMA, [[volume], 28]),
      // promisify("sma_50", getSMA, [[close], 50]),
      // promisify("sma_100", getSMA, [[close], 100]),
      // promisify("sma_200", getSMA, [[close], 200]),
      // promisify("parabolic_sar", getParabolicSAR, [[high, low]]),
      getDMI([high, low, close]),
      // getStochRSI(await getRSI([close], true)),
      // getStochasticOscillator([high, close, low]),
      getBollingerBands([close], current_candle.close_price),
      getMACD([close]),
      ...(!previous_candle.trend && !current_candle.trend
        ? [
            getCumulativeIndicator({
              candles,
              ohlc,
              getter: ({ trend, trend_up, trend_down } = {}) => ({
                trend,
                trend_up,
                trend_down
              }),
              fn: getSupertrend
            })
          ]
        : [getSupertrend(candles, ohlc)]),
      ...(!previous_candle.atr_stop && !current_candle.atr_stop
        ? [
            getCumulativeIndicator({
              candles,
              ohlc,
              getter: ({ atr_stop } = {}) => ({ atr_stop }),
              fn: getATRStop
            })
          ]
        : [getATRStop(candles, ohlc)]),

      getCHATR(candles, ohlc)
    ];

    const p = await Promise.all(promises);
    const result = p.reduce((acc, v) => ({ ...acc, ...v }), {});
    return resolve({
      ...result,
      ...mesa(hl2)
      // ...(await getMACD([close]))
    });
  });
};

/**
 *
 * @param {Number} open_price candle open price
 * @param {Number} close_price candle close price
 */
const getCandleDirection = (open_price, close_price) => {
  if (close_price > open_price) {
    return "up";
  }
  if (close_price < open_price) {
    return "down";
  }
  return "side";
};

/**
 *
 * @returns {Candle[]} array of candles without indicators values
 */
const buildCandlesData = ({ candles, symbol, interval }) => {
  console.log("Building candles data");

  if (exchange === "kucoin") {
    return candles.reduce(
      (acc, current) =>
        acc.concat({
          exchange,
          symbol,
          interval,
          id: `${exchange}_${symbol}_${interval}_${cloneObject(
            current[0] * 1e3
          )}`,
          event_time: Number(cloneObject(current[0] * 1e3)),
          open_time: Number(cloneObject(current[0] * 1e3)),
          close_time: Number(
            cloneObject(
              current[0] * 1e3 +
                milliseconds.minute * 59 +
                milliseconds.seconds * 59
            )
          ),
          open_price: Number(cloneObject(current[1])),
          close_price: Number(cloneObject(current[2])),
          high_price: Number(cloneObject(current[3])),
          low_price: Number(cloneObject(current[4])),
          base_asset_volume: Number(cloneObject(current[5])),
          quote_asset_volume: Number(cloneObject(current[6])),
          date: new Date(Number(cloneObject(current[0] * 1e3))),
          direction: getCandleDirection(
            Number(cloneObject(current[1])),
            Number(cloneObject(current[2]))
          )
        }),
      []
    );
  }

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
        date: new Date(Number(cloneObject(current[0])))
      }),
    []
  );
};

const castToObjectId = id =>
  typeof id === "string" ? Mongoose.Types.ObjectId(id) : id;

module.exports = {
  getOHLCValues,
  getIndicatorsValues,
  buildCandlesData,
  castToObjectId,
  getCandleDirection,
  getSupertrend,
  getATRStop,
  getCHATR
};
