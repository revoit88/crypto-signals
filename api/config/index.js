const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const { pairs } = require("@crypto-signals/utils");

module.exports = {
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  telegram_api_url: process.env.TELEGRAM_API_URL,
  host: process.env.API_HOST || "localhost",
  port: +process.env.API_PORT || 8080,
  allowed_pairs: pairs.map(p => p.symbol),
  telegram_token: process.env.TELEGRAM_TOKEN,
  zignaly_url: process.env.ZIGNALY_URL,
  zignaly_signaler_key: process.env.ZIGNALY_SIGNALER_KEY,
  zignaly_copytrading_key: process.env.ZIGNALY_COPYTRADING_KEY,
  zignaly_copytrading_key_2: process.env.ZIGNALY_COPYTRADING_KEY_2,
  environment: process.env.NODE_ENV,
  position_percentage_size: process.env.POSITION_PERCENTAGE_SIZE,
  signals_interval: +process.env.PROCESS_SIGNALS_INTERVAL,
  positions_interval: +process.env.PROCESS_POSITIONS_INTERVAL,
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
