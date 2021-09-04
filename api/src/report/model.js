"use strict";

const mongoose = require("mongoose");
const { ReportModel } = require("@crypto-signals/utils/models");

const ReportSchema = ReportModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Report", ReportSchema);
