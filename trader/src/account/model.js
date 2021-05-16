"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AccountSchema = new Schema(
  {
    total_balance: { type: Number },
    balance: { type: Number },
    type: { type: String },
    create_order_after: { type: Number }
  },
  { timestamps: true }
);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Account", AccountSchema);
