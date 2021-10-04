"use strict";

const Redis = require("redis");
const { promisify } = require("util");

module.exports = {
  name: "redis",
  version: "1.0.0",
  register: async function (server, options) {
    try {
      const db = Redis.createClient({ url: options.redis_uri });
      const pubSub = db.duplicate({ url: options.redis_uri });
      const getAsync = promisify(db.get).bind(db);
      const setAsync = promisify(db.set).bind(db);
      const delAsync = promisify(db.del).bind(db);
      const rpushAsync = promisify(db.rpush).bind(db);
      const llenAsync = promisify(db.llen).bind(db);
      const lpopAsync = promisify(db.lpop).bind(db);

      await delAsync("markets");
      await delAsync("candles");

      console.log("redis started");
      server.expose("getAsync", getAsync);
      server.expose("setAsync", setAsync);
      server.expose("delAsync", delAsync);
      server.expose("rpushAsync", rpushAsync);
      server.expose("llenAsync", llenAsync);
      server.expose("lpopAsync", lpopAsync);
      server.expose("pubSub", pubSub);
    } catch (error) {
      throw error;
    }
  }
};
