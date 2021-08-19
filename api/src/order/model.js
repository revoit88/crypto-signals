"use strict";
const mongoose = require("mongoose");
const { OrderModel } = require("@crypto-signals/utils/models");

const OrderSchema = OrderModel(mongoose);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Order", OrderSchema);
