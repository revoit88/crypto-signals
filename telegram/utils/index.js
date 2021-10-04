const Mongoose = require("mongoose");

const castToObjectId = id =>
  typeof id === "string" ? Mongoose.Types.ObjectId(id) : id;

module.exports = { castToObjectId };
