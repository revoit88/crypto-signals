const dotenv = require("dotenv");
const path = require("path");
const { milliseconds } = require("@crypto-signals/utils");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  host: process.env.SIGNALS_PROCESSOR_HOST || "localhost",
  port: +process.env.SIGNALS_PROCESSOR_PORT || 8080,
  strategy: (process.env.SIGNALS_PROCESSOR_STRATEGY || "").split(",").map(v => v.trim()),
  signal_hours_lookup: +process.env.SIGNAL_HOURS_LOOKUP * milliseconds.hour,
  last_position_hours_lookup:
    +process.env.LAST_POSITION_HOURS_LOOKUP * milliseconds.hour
};


