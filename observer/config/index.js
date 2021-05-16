const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  symbol: process.env.SYMBOL,
  api_token: process.env.API_TOKEN
};
