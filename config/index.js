const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  iron_secret: process.env.IRON_SECRET,
  binance_api_url: process.env.BINANCE_API_URL,
  binance_api_key: process.env.BINANCE_API_KEY,
  binance_api_secret: process.env.BINANCE_API_SECRET,
  microservice_token: process.env.MICROSERVICE_TOKEN,
  trader_url: process.env.TRADER_URL,
  api_url: process.env.API_URL,
  signals_performance_microservice_url: process.env.SIGNALS_PERFORMANCE_URL,
  signals_processor_microservice_url: process.env.SIGNALS_PROCESSOR_URL,
  positions_processor_microservice_url: process.env.POSITIONS_PROCESSOR_URL,
  candles_processor_microservice_url: process.env.CANDLES_PROCESSOR_URL
};
