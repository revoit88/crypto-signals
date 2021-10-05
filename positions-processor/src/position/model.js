"use strict";

const mongoose = require("mongoose");
const { PositionModel } = require("@crypto-signals/utils/models");
const { api_url, environment } = require("@crypto-signals/config");
const { api } = require("../../axios");

const PositionSchema = PositionModel(mongoose);

function broadcastPositionUpdate(position) {
  const update = this.getUpdate();
  if (
    update["$set"].status === "closed" &&
    api_url &&
    environment === "production"
  ) {
    api
      .broadcast("positions", {
        exchange: position.exchange,
        symbol: position.symbol,
        price: position.sell_price,
        type: "exit",
        _id: position._id.toString()
      })
      .catch(error => {
        console.log("Exit position broadcast error.");
        if (error) {
          console.error(error);
        }
      });
  }
}

PositionSchema.post("findOneAndUpdate", broadcastPositionUpdate);

/**
 *
 * @param {mongoose.Connection} db
 */
module.exports = db => db.model("Position", PositionSchema);
