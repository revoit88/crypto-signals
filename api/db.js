"use strict";

const Mongoose = require("mongoose");

module.exports = {
  name: "mongoose",
  version: "1.0.0",
  register: async function (server, options) {
    Mongoose.set("useFindAndModify", false);

    try {
      const db = await Mongoose.createConnection(options.db_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 25
      });

      require("./src/candle/model")(db);
      require("./src/signal/model")(db);
      require("./src/position/model")(db);
      require("./src/telegram/model")(db);
      require("./src/account/model")(db);
      require("./src/market/model")(db);
      require("./src/log/model")(db);
      require("./src/order/model")(db);
      console.log("imported all models");
      server.expose("connection", db);
    } catch (error) {
      throw error;
    }
  }
};
