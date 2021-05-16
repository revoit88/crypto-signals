"use strict";

const { api_url, environment } = require("../../config");
const { api } = require("../../utils/axios");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
  {
    total_balance: { type: Number },
    balance: { type: Number },
    type: { type: String },
    id: { type: String },
    spot_account_listen_key: { type: String },
    last_spot_account_listen_key_update: { type: Number, default: 0 }
  },
  { timestamps: true }
);

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
