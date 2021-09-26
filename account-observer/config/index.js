const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  api_url: process.env.API_URL,
  host: process.env.CANDLES_PROCESSOR_HOST || "localhost",
  port: +process.env.CANDLES_PROCESSOR_PORT || 8080,
  quote_asset: process.env.QUOTE_ASSET
};
