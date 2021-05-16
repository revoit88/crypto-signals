const {
  db_uri,
  redis_uri,
  exchange,
  interval
} = require("@crypto-signals/config");
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  db_uri,
  redis_uri,
  exchange,
  interval,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8080
};
