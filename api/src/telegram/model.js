"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TelegramSchema = new Schema(
  {
    chat_id: { type: Number, required: true },
    user_name: { type: String, required: true },
    markets: { type: [String], default: [] }
  },
  { timestamps: true }
);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Telegram", TelegramSchema);
