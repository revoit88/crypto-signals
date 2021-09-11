const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  port: process.env.TELEGRAM_PORT,
  db_uri: process.env.DB_URI,
  bot_token: process.env.BOT_TOKEN,
  webhook_url: process.env.WEBHOOK_URL,
  channel_id: +process.env.CHANNEL_ID,
  microservice_token: process.env.MICROSERVICE_TOKEN
};
