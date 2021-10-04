const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: process.env.TELEGRAM_PORT,
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  bot_token: process.env.BOT_TOKEN,
  telegram_api_url: process.env.TELEGRAM_API_URL,
  channel_id: +process.env.CHANNEL_ID,
  microservice_token: process.env.MICROSERVICE_TOKEN,
  quote_asset: process.env.QUOTE_ASSET,
  redis_positions_channel: process.env.REDIS_POSITIONS_CHANNEL,
  currency_symbol: process.env.CURRENCY_SYMBOL
};
