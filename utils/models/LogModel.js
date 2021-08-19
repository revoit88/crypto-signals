module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {},
    { timestamps: true, strict: false, ...config }
  );
};
