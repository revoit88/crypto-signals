const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  db_uri: process.env.DB_URI,
  api_url: process.env.API_URL,
  exchange: process.env.EXCHANGE,
  host: process.env.TRADER_HOST || "localhost",
  port: +process.env.TRADER_PORT || 8080,
  environment: process.env.NODE_ENV,
  iron_secret: process.env.IRON_SECRET,
  minimum_order_size: +process.env.BINANCE_MINIMUM_ORDER_SIZE,
  quote_asset: process.env.QUOTE_ASSET,
  reserved_amount: +process.env.RESERVED_AMOUNT,
  default_buy_order_type: process.env.DEFAULT_BUY_ORDER_TYPE ?? "MARKET",
  default_sell_order_type: process.env.DEFAULT_SELL_ORDER_TYPE ?? "MARKET",
  default_buy_amount: +process.env.DEFAULT_BUY_AMOUNT
};
