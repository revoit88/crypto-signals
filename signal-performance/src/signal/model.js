"use strict";

const mongoose = require("mongoose");
const { validateNumber, pairs } = require("@crypto-signals/utils");

const Schema = mongoose.Schema;

const SignalSchema = new Schema(
  {
    id: { type: String, required: true },
    time: { type: Number, required: true, validate: validateNumber },
    trigger_time: { type: Number, required: true, validate: validateNumber },
    close_time: { type: Number, validate: validateNumber },
    exchange: {
      type: String,
      required: true,
      enum: ["binance", "kucoin"],
      default: "binance"
    },
    symbol: {
      type: String,
      required: true,
      validate: value => pairs.includes(value)
    },
    interval: {
      type: String,
      required: true,
      validate: value => ["1d", "4h", "1h", "1m"].includes(value)
    },
    price: { type: Number, required: true, validate: validateNumber },
    type: { type: String, required: true, enum: ["buy", "sell"] },
    date: { type: Date, required: true },
    close_date: { type: Date },
    drop_price: { type: Number, required: true, validate: validateNumber },
    trigger: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },
    trailing_stop_buy: {
      type: Number,
      required: true,
      validate: validateNumber
    },
    open_candle: { type: Object },
    close_candle: { type: Object },
    drop_percent: { type: Number, validate: validateNumber },
    position: { type: mongoose.Types.ObjectId, ref: "Position" },
    is_test: { type: Boolean, default: false },
    high1d: { type: Number, default: 0 },
    high3d: { type: Number, default: 0 },
    high7d: { type: Number, default: 0 },
    high30d: { type: Number, default: 0 },
    high90d: { type: Number, default: 0 },
    low1d: { type: Number, default: 0 },
    low3d: { type: Number, default: 0 },
    low7d: { type: Number, default: 0 },
    low30d: { type: Number, default: 0 },
    low90d: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = db => db.model("Signal", SignalSchema);
