"use strict";

const mongoose = require("mongoose");
const { LogModel } = require("@crypto-signals/utils/models");

const LogSchema = LogModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Log", LogSchema);
