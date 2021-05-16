const { db_uri, exchange } = require("@crypto-signals/config");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  db_uri,
  exchange,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8080
};
