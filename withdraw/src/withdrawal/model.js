"use strict";

const mongoose = require("mongoose");
const { WithdrawalModel } = require("@crypto-signals/utils/models");

const WithdrawalSchema = WithdrawalModel(mongoose);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Withdrawal", WithdrawalSchema);
