"use strict";

const Mongoose = require("mongoose");
const { db_uri } = require("@crypto-signals/config");

Mongoose.set("useFindAndModify", false);

module.exports = async () => {
  try {
    const db = await Mongoose.createConnection(db_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 25
    });

    require("../src/account/model")(db);
    require("../src/order/model")(db);
    console.log("imported all models");
    return db;
  } catch (error) {
    throw error;
  }
};
