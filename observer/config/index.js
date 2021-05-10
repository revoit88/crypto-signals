const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  symbol: process.env.SYMBOL,
  interval: process.env.INTERVAL,
  api_url: process.env.API_URL,
  api_token: process.env.API_TOKEN,
  exchange: process.env.EXCHANGE
};
