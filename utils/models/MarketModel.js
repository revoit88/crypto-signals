module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      symbol: { type: String },
      exchange: {
        type: String,
        required: true,
        enum: ["binance", "kucoin"],
        default: "binance"
      },
      last_price: { type: Number },
      trader_lock: { type: Boolean },
      last_trader_lock_update: { type: Number },
      trading: { type: Boolean, default: false },
      broadcast_signals: { type: Boolean, default: false },
      send_to_profit_sharing: { type: Boolean, default: false },
      use_main_account: { type: Boolean, default: false }
    },
    { timestamps: true, ...config }
  );
};
