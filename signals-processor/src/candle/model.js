"use strict";

const mongoose = require("mongoose");
const {
  pairs,
  validateNumber,
  candle_intervals
} = require("@crypto-signals/utils");
const Schema = mongoose.Schema;

const CandleSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      validate: value =>
        String(value).match(
          new RegExp(
            `^(binance|kucoin)_.+_(${candle_intervals.join("|")})_\\d+$`
          )
        )
    },
    exchange: {
      type: String,
      required: true,
      enum: ["binance", "kucoin"],
      default: "binance"
    },
    symbol: {
      type: String,
      required: true,
      validate: value => pairs.map(p => p.symbol).includes(value)
    },
    open_time: {
      type: Number,
      required: true,
      validate: validateNumber
    },
    close_time: { type: Number, required: true, validate: validateNumber },
    interval: {
      type: String,
      required: true,
      validate: value => candle_intervals.includes(value)
    },
    open_price: { type: Number, required: true, validate: validateNumber },
    close_price: { type: Number, required: true, validate: validateNumber },
    high_price: { type: Number, required: true, validate: validateNumber },
    low_price: { type: Number, required: true, validate: validateNumber },
    base_asset_volume: {
      type: Number,
      required: true,
      validate: validateNumber
    },
    quote_asset_volume: {
      type: Number,
      required: true,
      validate: validateNumber
    },
    amplitude: { type: Number, validate: validateNumber },
    change: { type: Number, validate: validateNumber },
    rsi: { type: Number, validate: validateNumber },
    will_r: { type: Number, validate: validateNumber },
    ema: { type: Number, validate: validateNumber },
    bbands_upper: { type: Number, validate: validateNumber },
    bbands_middle: { type: Number, validate: validateNumber },
    bbands_lower: { type: Number, validate: validateNumber },
    bbands_direction: { type: String, enum: ["up", "down", "side"] },
    macd: { type: Number, validate: validateNumber },
    macd_signal: { type: Number, validate: validateNumber },
    macd_histogram: { type: Number, validate: validateNumber },
    parabolic_sar: { type: Number, validate: validateNumber },
    date: { type: String, required: true },
    mama: { type: Number, validate: validateNumber },
    fama: { type: Number, validate: validateNumber },
    atr: { type: Number, validate: validateNumber },
    atr_stop: { type: Number, validate: validateNumber },
    atr_sma: { type: Number, validate: validateNumber },
    ema_7: { type: Number, validate: validateNumber },
    ema_25: { type: Number, validate: validateNumber },
    ema_100: { type: Number, validate: validateNumber },
    volume_sma: { type: Number, validate: validateNumber },
    event_time: { type: Number, validate: validateNumber },
    is_test: { type: Boolean, default: false },
    stoch_rsi_k: { type: Number, validate: validateNumber },
    stoch_rsi_d: { type: Number, validate: validateNumber },
    trend: { type: Number, enum: [1, -1], validate: validateNumber },
    trend_up: { type: Number, validate: validateNumber },
    trend_down: { type: Number, validate: validateNumber },
    adx: { type: Number, validate: validateNumber },
    plus_di: { type: Number, validate: validateNumber },
    minus_di: { type: Number, validate: validateNumber },
    obv: { type: Number, validate: validateNumber },
    obv_ema: { type: Number, validate: validateNumber },
    sma_50: { type: Number, validate: validateNumber },
    sma_100: { type: Number, validate: validateNumber },
    sma_200: { type: Number, validate: validateNumber },
    ch_atr: { type: Number, validate: validateNumber },
    ch_atr_ema: { type: Number, validate: validateNumber },
    is_pump: { type: Boolean, default: false },
    is_dump: { type: Boolean, default: false }
  },
  { timestamps: true }
);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Candle", CandleSchema);
