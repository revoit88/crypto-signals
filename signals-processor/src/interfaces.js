/**
 * Candle Interface
 * @typedef {Object} CandleI
 * @property {String} id - id in format {symbol}\_{interval}\_{open_time}
 * @property {String} symbol - pair (example BTCUSDT)
 * @property {Number} open_time - open time
 * @property {Number} close_time - close time
 * @property {String} interval - interval
 * @property {Number} open_price - open price
 * @property {Number} close_price - close price
 * @property {Number} high_price - highest price
 * @property {Number} low_price - lowest price
 * @property {("up"|"down"|"side")} direction - direction
 * @property {Number} base_asset_volume - base asset volume
 * @property {Number} number_of_trades - number of trades within the candle interval
 * @property {Boolean} is_closed - is this candle closed?
 * @property {Number} quote_asset_volume - quoted asset volume
 * @property {String} date - Date in UTC String format
 * @property {Number} rsi - Relative Strength Signal Indicator value
 * @property {Number} will_r - Williams %R Indicator value
 * @property {Number} ema - Exponential Moving Average Indicator value
 * @property {Number} macd - Moving Average Convergence/Divergence Indicator value
 * @property {Number} macd_signal - Moving Average Convergence/Divergence signal value
 * @property {Number} macd_histogram - Moving Average Convergence/Divergence histogram value
 * @property {Number} bbands_lower - Bollinger Bands lower band value
 * @property {Number} bbands_middle - Bollinger Bands middle band value
 * @property {Number} bbands_upper - Bollinger Bands upper band value
 * @property {Number} bbands_percent_b - Bollinger Bands %b value
 * @property {Number} bbands_bandwith - Bollinger Bands bandwith value
 * @property {Number} bbands_deviation - Bollinger Bands deviation value
 * @property {Number} bbands_deviation_percent - Bollinger Bands deviation percentage value
 * @property {Number} stoch_rsi_k - Stochastic RSI %K value
 * @property {Number} stoch_rsi_d - Stochastic RSI %D value
 * @property {Number} stoch_k - Stochastic Oscillator %K value
 * @property {Number} stoch_d - Stochastic Oscillator %D value
 * @property {Number} ema_7 - 7 Candles Exponential Moving Average
 * @property {Number} ema_25 - 25 Candles Exponential Moving Average
 * @property {Number} ema_100 - 100 Candles Exponential Moving Average
 * @property {Number} atr - Average  True Range
 * @property {Number} atr_sma - 28 Periods SMA of the ATR
 * @property {Number} volume_sma - 28 Periods SMA of the asset volume
 * @property {Number} mama - mama average
 * @property {Number} fama - fama average
 * @property {Number} parabolic_sar - Parabolic SAR
 * @property {Number} adx - ADX
 * @property {Number} plus_di - Plus Directional Index
 * @property {Number} minus_di - Minus Directional Index
 * @property {Number} trend - Current Trend
 * @property {Number} trend_up - Trend Up
 * @property {Number} trend_down - Trend Down
 * @property {Number} obv - On Balance Volume
 * @property {Number} obv_ema - On Balance Volume EMA
 * @property {("up"|"down"|"side")} bbands_direction - Bollinger Bands direction value
 * @property {SignalI[]} signals Signals triggered in the current candle
 * @property {Number} event_time candle time
 *
 */

/**
 * @typedef {CandleI}
 */
exports.Candle = {};

/**
 * Signal
 * @typedef {Object} SignalI
 * @property {String} id - id in format {symbol}\_{interval}\_{candle_open_time}
 * @property {String} symbol - pair (example BTCUSDT)
 * @property {String} interval - candle interval where the signal was generated
 * @property {String} date - Date in UTC String format
 * @property {String} trigger - Signal trigger
 * @property {Number} price - price of the asset at the time the signal was generated
 * @property {Number} drop_price - open price of the candle that started the downtrend
 * @property {Number} trigger_time - time in miliseconds when the signal was triggered
 * @property {Number} close_time - time in miliseconds when the signal was closed
 * @property {Number} trigger_time - time in miliseconds when the signal was triggered
 * @property {Number} close_date - Close date in UTC String format
 * @property {Number} trailing_stop_buy - Trailing stop buy
 * @property {("buy"|"sell")} type signal type
 * @property {("open"|"closed")} status signal status
 */

/**
 * @typedef {SignalI}
 */
exports.Signal = {};

/**
 * OHLC
 * @typedef {Object} OHLC
 * @property {Number[]} open Array of open prices, in ascending order
 * @property {Number[]} close Array of close prices, in ascending order
 * @property {Number[]} high Array of high prices, in ascending order
 * @property {Number[]} low Array of low prices, in ascending order
 * @property {Number[]} volume Array of asset volume, in ascending order
 * @property {Number[]} hl2 Array of (high + low) / 2, in ascending order
 */
exports.OHLC = {};

/**
 * Position
 * @typedef {Object} PositionI
 * @property {String} id - id in format {symbol}\_{interval}\_{candle_open_time}
 * @property {String} symbol - pair (example BTCUSDT)
 * @property {String} date - Date in UTC String format
 * @property {String} sell_date - Date in UTC String format
 * @property {Number} open_time - time in miliseconds when the position was taken
 * @property {Number} close_time - time in miliseconds when the position was sold
 * @property {Number} change - price change
 * @property {Number} cost - total cost of the position at the moment it was taken
 * @property {Number} buy_price - price of the asset at the time the position was taken
 * @property {Number} sell_price - price of the asset at the time the position was sold
 * @property {Number} buy_amount - amount of the asset
 * @property {Number} take_profit - price where position should be sold with profit
 * @property {Number} stop_loss - price where the position should be sold with loss
 * @property {Number} arm_trailing_stop_loss - price where the trailing stop loss should be armed
 * @property {Number} trailing_stop_loss - price where the position should be sold with profit
 * @property {Boolean} trailing_stop_loss_armed - trailing stop loss is armed
 * @property {("open"|"closed")} status - position state
 * @property {String} error_code - error code
 */
exports.PositionI = {};
