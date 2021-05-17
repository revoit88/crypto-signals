const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
module.exports = {
  symbol: process.env.SYMBOL,
  interval: process.env.INTERVAL,
  api_url: process.env.API_URL,
  api_token: process.env.API_TOKEN,
  exchange: process.env.EXCHANGE
};
