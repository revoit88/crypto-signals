module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      id: { type: String, required: true },
      coin: { type: String, required: true },
      address: { type: String, required: true },
      amount: { type: Number, required: true },
      fee: { type: Number }
    },
    { timestamps: true, ...config }
  );
};
