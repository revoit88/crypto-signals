const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  exchange: process.env.EXCHANGE,
  db_uri: process.env.DB_URI,
  host: process.env.DISCORD_HOST || "localhost",
  port: +process.env.DISCORD_PORT || 8080,
  bottom_detector_webhook_url: process.env.BOTTOM_DETECTOR_WEBHOOK_URL,
  trend_webhook_url: process.env.TREND_WEBHOOK_URL
};
