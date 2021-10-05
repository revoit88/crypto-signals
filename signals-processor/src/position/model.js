"use strict";

const mongoose = require("mongoose");
const { PositionModel } = require("@crypto-signals/utils/models");
const { api_url, environment } = require("@crypto-signals/config");
const { api } = require("../../axios");

const PositionSchema = PositionModel(mongoose);

function broadcastEntryPosition(position) {
  if (!!api_url && environment === "production") {
    api
      .broadcast("positions", {
        exchange: position.exchange,
        symbol: position.symbol,
        price: position.buy_price,
        type: "entry",
        _id: position._id.toString(),
        time: position.open_time
      })
      .catch(error => {
        console.log("Entry position broadcast error.");
        if (error) {
          console.error(error);
        }
      });
  }
}

PositionSchema.post("save", broadcastEntryPosition);
/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Position", PositionSchema);
