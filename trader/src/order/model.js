"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema(
  {
    symbol: { type: String },
    orderId: { type: Number },
    orderListId: { type: Number },
    clientOrderId: { type: String },
    price: { type: String },
    origQty: { type: String },
    executedQty: { type: String },
    cummulativeQuoteQty: { type: String },
    commissionAmount: { type: String },
    commissionAsset: { type: String },
    status: { type: String },
    timeInForce: { type: String },
    type: { type: String },
    side: { type: String },
    stopPrice: { type: String },
    icebergQty: { type: String },
    time: { type: Number },
    origQuoteOrderQty: { type: String },
  },
  { timestamps: true }
);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Order", OrderSchema);
