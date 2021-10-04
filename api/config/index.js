const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const { pairs, milliseconds } = require("@crypto-signals/utils");

module.exports = {
  exchange: process.env.EXCHANGE,
  interval: process.env.INTERVAL,
  db_uri: process.env.DB_URI,
  redis_uri: process.env.REDIS_URI,
  host: process.env.API_HOST || "localhost",
  port: +process.env.API_PORT || 8080,
  allowed_pairs: pairs.map(p => p.symbol),
  environment: process.env.NODE_ENV,
  signals_interval:
    +process.env.PROCESS_SIGNALS_INTERVAL * milliseconds.seconds,
  positions_interval:
    +process.env.PROCESS_POSITIONS_INTERVAL * milliseconds.seconds,
  iron_secret: process.env.IRON_SECRET,
  binance_api_url: process.env.BINANCE_API_URL,
  binance_api_key: process.env.BINANCE_API_KEY,
  binance_api_secret: process.env.BINANCE_API_SECRET,
  microservice_token: process.env.MICROSERVICE_TOKEN,
  api_url: process.env.API_URL,
  signals_processor_microservice_url: process.env.SIGNALS_PROCESSOR_URL,
  positions_processor_microservice_url: process.env.POSITIONS_PROCESSOR_URL,
  candles_processor_microservice_url: process.env.CANDLES_PROCESSOR_URL,
  quote_asset: process.env.QUOTE_ASSET,
  cmc_api_url: process.env.CMC_API_URL,
  cmc_api_key: process.env.CMC_API_KEY,
  redis_positions_channel: process.env.REDIS_POSITIONS_CHANNEL
};
