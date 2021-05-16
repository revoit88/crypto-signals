"use strict";

const { api_url } = require("@crypto-signals/config");
const { api } = require("../../axios");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
  {
    id: { type: String },
    balance: { type: Number },
    total_balance: { type: Number },
    type: { type: String },
    last_order_error: { type: Number },
    spot_account_listen_key: { type: String },
    last_spot_account_listen_key_update: { type: Number, default: 0 }
  },
  { timestamps: true }
);

function broadcastAccountUpdate(account) {
  if (api_url) {
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
