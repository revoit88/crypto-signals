"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LogSchema = new Schema({}, { timestamps: true, strict: false });
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Log", LogSchema);
