const { db_uri, exchange, interval } = require("@crypto-signals/config");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  db_uri,
  exchange,
  interval,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8080,
  strategy: process.env.STRATEGY,
  microservice_token: process.env.MICROSERVICE_TOKEN,
  trader_url: process.env.TRADER_URL,
  api_url: process.env.API_URL
};
