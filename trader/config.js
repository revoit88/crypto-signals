const {
  db_uri,
  api_url,
  iron_secret,
  exchange
} = require("@crypto-signals/config");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  db_uri,
  api_url,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8081,
  iron_secret,
  environment: process.env.NODE_ENV,
  exchange
};
