const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  api_url: process.env.API_URL,
  environment: process.env.NODE_ENV,
  db_uri: process.env.DB_URI,
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  host: process.env.POSITIONS_PROCESSOR_HOST || "localhost",
  port: +process.env.POSITIONS_PROCESSOR_PORT || 8080,
  strategy: process.env.STRATEGY
};
