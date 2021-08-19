"use strict";

const Mongoose = require("mongoose");

module.exports = {
  name: "mongoose",
  version: "1.0.0",
  register: async function (server, options) {
    try {
      const db = await Mongoose.createConnection(options.db_uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      });

      require("./src/position/model")(db);
      console.log("imported all models");
      server.expose("connection", db);
    } catch (error) {
      throw error;
    }
  }
};
