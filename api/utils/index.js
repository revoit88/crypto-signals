const Mongoose = require("mongoose");
const axios = require("axios");

const validateNumber = n => n === null || (typeof n === "number" && !isNaN(n));

const castToObjectId = id =>
  typeof id === "string" ? Mongoose.Types.ObjectId(id) : id;

function replaceObjectKeys(obj) {
  if (typeof obj === "object" && obj !== null && Object.keys(obj).length) {
    return Object.keys(obj).reduce((acc, key) => {
      return {
        ...acc,
        [String(key).replace(/\./g, "[dot]")]: replaceObjectKeys(obj[key])
      };
    }, {});
  }

  return obj;
}

module.exports = {
  validateNumber,
  castToObjectId,
  replaceObjectKeys
};
