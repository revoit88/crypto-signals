"use strict";

const mongoose = require("mongoose");
const { CandleModel } = require("@crypto-signals/utils/models");

const CandleSchema = CandleModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Candle", CandleSchema);
