module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      id: { type: String },
      balance: { type: Number },
      total_balance: { type: Number },
      type: { type: String },
      last_order_error: { type: Number },
      spot_account_listen_key: { type: String },
      last_spot_account_listen_key_update: { type: Number, default: 0 },
      create_order_after: { type: Number }
    },
    { timestamps: true, ...config }
  );
};
