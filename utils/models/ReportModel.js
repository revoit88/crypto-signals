const { validateNumber } = require("../");

module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      year: { type: Number, validate: validateNumber },
      month: { type: Number, validate: validateNumber },
      start_time: { type: Number, validate: validateNumber },
      end_time: { type: Number, validate: validateNumber },
      total_trades: { type: Number, validate: validateNumber },
      total_wins: { type: Number, validate: validateNumber },
      average_change: { type: Number, validate: validateNumber },
      strategy: { type: String }
    },
    { timestamps: true, ...config }
  );
};
