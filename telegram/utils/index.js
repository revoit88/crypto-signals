const Mongoose = require("mongoose");

const castToObjectId = id =>
  typeof id === "string" ? Mongoose.Types.ObjectId(id) : id;

const getPriceAsString = price => {
  const isExponential = Number(price).toString().includes("e");
  return isExponential ? Number(price).toFixed(8) : Number(price).toString();
};

module.exports = { castToObjectId, getPriceAsString };
