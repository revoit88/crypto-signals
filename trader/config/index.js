const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  api_url: process.env.API_URL,
  exchange: process.env.EXCHANGE,
  host: process.env.TRADER_HOST || "localhost",
  port: +process.env.TRADER_PORT || 8080,
  environment: process.env.NODE_ENV,
  iron_secret: process.env.IRON_SECRET
};
