"use strict";

const mongoose = require("mongoose");
const { PositionModel } = require("@crypto-signals/utils/models");

const PositionSchema = PositionModel(mongoose);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Position", PositionSchema);
