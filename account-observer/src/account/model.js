"use strict";

const mongoose = require("mongoose");
const { AccountModel } = require("@crypto-signals/utils/models");

const AccountSchema = AccountModel(mongoose);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Account", AccountSchema);
