const {
  db_uri,
  api_url,
  exchange,
  redis_uri,
  iron_secret,
  signals_performance_microservice_url,
  signals_processor_microservice_url,
  positions_processor_microservice_url,
  candles_processor_microservice_url,
  microservice_token
} = require("@crypto-signals/config");
const dotenv = require("dotenv");
const { pairs } = require("@crypto-signals/utils");
dotenv.config();
module.exports = {
  db_uri,
  telegram_api_url: process.env.TELEGRAM_API_URL,
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 8080,
  allowed_pairs: pairs.map(p => p.symbol),
  candle_minutes: 60,
  iron_secret,
  telegram_token: process.env.TELEGRAM_TOKEN,
  zignaly_url: process.env.ZIGNALY_URL,
  zignaly_signaler_key: process.env.ZIGNALY_SIGNALER_KEY,
  zignaly_copytrading_key: process.env.ZIGNALY_COPYTRADING_KEY,
  zignaly_copytrading_key_2: process.env.ZIGNALY_COPYTRADING_KEY_2,
  environment: process.env.NODE_ENV,
  microservice_token,
  api_url,
  exchange,
  position_percentage_size: process.env.POSITION_PERCENTAGE_SIZE,
  redis_uri,
  signals_interval: +process.env.PROCESS_SIGNALS_INTERVAL,
  positions_interval: +process.env.PROCESS_POSITIONS_INTERVAL,
  signals_performance_microservice_url,
  signals_processor_microservice_url,
  positions_processor_microservice_url,
  candles_processor_microservice_url
};
