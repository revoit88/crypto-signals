module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      chat_id: { type: Number, required: true },
      user_name: { type: String, required: true },
      markets: { type: [String], default: [] }
    },
    { timestamps: true, ...config }
  );
};
