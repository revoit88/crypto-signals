"use strict";

const Redis = require("redis");

module.exports = {
  name: "redis",
  version: "1.0.0",
  register: async function (server, options) {
    try {
      const pubSub = Redis.createClient({ url: options.redis_uri });
      console.log("redis started");
      server.expose("pubSub", pubSub);
    } catch (error) {
      throw error;
    }
  }
};
