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

function getTelegramBotRequest(position, config) {
  return axios.post(`${config.telegram_bot_url}/signals/broadcast`, position, {
    headers: {
      Authorization: `Bearer ${config.microservice_token}`
    }
  });
}

module.exports = {
  validateNumber,
  castToObjectId,
  replaceObjectKeys,
  getTelegramBotRequest
};
