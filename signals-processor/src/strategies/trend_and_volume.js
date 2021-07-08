const { toSymbolPrecision } = require("@crypto-signals/utils");
/**
 *
 * @param {Candle[]} candles
 */
module.exports = (candles, last_signal, last_open_position) => {
  const [previousCandle = {}, currentCandle = {}] = candles.slice(-2);

  const volume = currentCandle.obv > currentCandle.obv_ema;

  const volatile = currentCandle.ch_atr > currentCandle.ch_atr_ema;

  const highest_price = Math.max(
    0,
    ...[
      (last_signal || {}).price,
      last_open_position?.buy_price,
      last_open_position?.sell_price
    ].filter(notFalsy => notFalsy)
  );

  if (
    !!highest_price &&
    currentCandle.close_price > highest_price - currentCandle.atr * 3
  ) {
    return false;
  }

  const macd =
    currentCandle.macd > currentCandle.macd_signal &&
    (currentCandle.macd > 0 || currentCandle.macd_histogram > 0);

  const di =
    currentCandle.plus_di > 25 &&
    currentCandle.plus_di > currentCandle.minus_di;

  const trending =
    previousCandle.trend === 1 &&
    previousCandle.mama > previousCandle.fama &&
    currentCandle.trend === 1 &&
    currentCandle.mama > currentCandle.fama &&
    previousCandle.volume_trend === 1 &&
    currentCandle.volume_trend === 1;

  const notPump = !(currentCandle.is_pump || previousCandle.is_pump);

  return volume && volatile && trending && di && macd && notPump
    ? {
        exchange: currentCandle.exchange,
        symbol: currentCandle.symbol,
        price: toSymbolPrecision(
          currentCandle.close_price,
          currentCandle.symbol
        ),
        date: new Date(currentCandle.event_time || currentCandle.open_time),
        trigger_time: new Date(
          currentCandle.event_time || currentCandle.open_time
        ).getTime(),
        interval: currentCandle.interval,
        trigger: "trend_and_volume"
      }
    : false;
};
