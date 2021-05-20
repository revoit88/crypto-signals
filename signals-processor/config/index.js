const dotenv = require("dotenv");
const path = require("path");
const { milliseconds } = require("@crypto-signals/utils");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  environment: process.env.NODE_ENV,
  host: process.env.SIGNALS_PROCESSOR_HOST || "localhost",
  port: +process.env.SIGNALS_PROCESSOR_PORT || 8080,
  strategy: (process.env.SIGNALS_PROCESSOR_STRATEGY || "")
    .split(",")
    .map(v => v.trim()),
  signal_hours_lookup: +process.env.SIGNAL_HOURS_LOOKUP * milliseconds.hour,
  last_position_hours_lookup:
    +process.env.LAST_POSITION_HOURS_LOOKUP * milliseconds.hour,
  position_minimum_buy_amount: +process.env.POSITION_MINIMUM_BUY_AMOUNT,
  position_trailing_stop_loss: +process.env.POSITION_TRAILING_STOP_LOSS,
  position_arm_trailing_stop_loss: +process.env.POSITION_ARM_TRAILING_STOP_LOSS,
  position_stop_loss: +process.env.POSITION_STOP_LOSS,
  position_take_profit: +process.env.POSITION_TAKE_PROFIT,
  position_percentage_size: +process.env.POSITION_PERCENTAGE_SIZE,
  position_max_stop_loss: +process.env.POSITION_MAX_STOP_LOSS
};
