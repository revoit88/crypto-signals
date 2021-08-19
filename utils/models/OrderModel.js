module.exports = (mongoose, config = {}) => {
  return new mongoose.Schema(
    {
      symbol: { type: String },
      orderId: { type: Number },
      orderListId: { type: Number },
      clientOrderId: { type: String },
      price: { type: String },
      origQty: { type: String },
      executedQty: { type: String },
      cummulativeQuoteQty: { type: String },
      commissionAmount: { type: String },
      commissionAsset: { type: String },
      status: { type: String },
      timeInForce: { type: String },
      type: { type: String },
      side: { type: String },
      stopPrice: { type: String },
      icebergQty: { type: String },
      time: { type: Number },
      origQuoteOrderQty: { type: String },
      eventTime: { type: Number },
      transactTime: { type: Number }
    },
    { timestamps: true, ...config }
  );
};
