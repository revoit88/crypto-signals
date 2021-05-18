const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  exchange: process.env.EXCHANGE,
  host: process.env.SIGNALS_PERFORMANCE_HOST || "localhost",
  port: +process.env.SIGNALS_PERFORMANCE_PORT || 8080
};
