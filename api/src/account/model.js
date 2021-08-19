"use strict";

const { api_url, environment } = require("../../config");
const { api } = require("../../utils/axios");
const mongoose = require("mongoose");
const { AccountModel } = require("@crypto-signals/utils/models");

const AccountSchema = AccountModel(mongoose);

function broadcastAccountUpdate(account) {
  if (api_url && environment !== "test") {
    api
      .post("/account/broadcast", {
        balance: account.balance,
        total_balance: account.total_balance,
        time: Date.now(),
        id: account.id
      })
      .catch(error => {
        console.log("Account update broadcast error.");
        console.error(error);
      });
  }
}

AccountSchema.post("findOneAndUpdate", broadcastAccountUpdate);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Account", AccountSchema);
