"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MarketSchema = new Schema(
  {
    exchange: {
      type: String,
      required: true,
      enum: ["binance", "kucoin"],
      default: "binance"
    },
    symbol: { type: String },
    last_price: { type: Number },
    trader_lock: { type: Boolean },
    last_trader_lock_update: { type: Number },
    trading: { type: Boolean, default: false },
    broadcast_signals: { type: Boolean, default: true },
    send_to_profit_sharing: { type: Boolean, default: false },
    use_main_account: { type: Boolean, default: true }
  },
  { timestamps: true }
);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Market", MarketSchema);
