"use strict";
const mongoose = require("mongoose");
const { TelegramModel } = require("@crypto-signals/utils/models");

const TelegramSchema = TelegramModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Telegram", TelegramSchema);
