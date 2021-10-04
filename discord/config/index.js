const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  exchange: process.env.EXCHANGE,
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  host: process.env.DISCORD_HOST || "localhost",
  port: +process.env.DISCORD_PORT || 8080,
  quote_asset: process.env.QUOTE_ASSET,
  redis_positions_channel: process.env.REDIS_POSITIONS_CHANNEL,
  webhook_url: process.env.DISCORD_WEBHOOK_URL,
  currency_symbol: process.env.CURRENCY_SYMBOL ?? "₿" // server text editor won't let me input the bitcoin symbol
};
