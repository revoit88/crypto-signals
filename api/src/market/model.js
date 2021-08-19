"use strict";

const mongoose = require("mongoose");
const { MarketModel } = require("@crypto-signals/utils/models");

const MarketSchema = MarketModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Market", MarketSchema);
