const {
  db_uri,
  redis_uri,
  exchange,
  interval
} = require("@crypto-signals/config");
const { milliseconds } = require("@crypto-signals/utils");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  db_uri,
  redis_uri,
  exchange,
  interval,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8080,
  strategy: (process.env.STRATEGY || "").split(",").map(v => v.trim()),
  signal_hours_lookup: +process.env.SIGNAL_HOURS_LOOKUP * milliseconds.hour,
  last_position_hours_lookup:
    +process.env.LAST_POSITION_HOURS_LOOKUP * milliseconds.hour
};
