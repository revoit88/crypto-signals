"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
  {
    id: { type: String },
    balance: { type: Number },
    total_balance: { type: Number },
    type: { type: String },
    last_order_error: { type: Number }
  },
  { timestamps: true }
);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Account", AccountSchema);
