const axios = require("axios");
const config = require("./config");

/**
 * @type {axios.AxiosInstance}
 */
const API = axios.create({
  baseURL: config.api_url,
  headers: {
    Authorization: `Bearer ${config.api_token}`
  }
});

const persist = async value => {
  try {
    if (config.api_url) {
      await API.post(`/candles/persist`, value);
    }
  } catch (error) {
    throw ((error || {}).response || {}).data;
  }
};

module.exports = {
  api: {
    persist,
    post: API.post
  }
};
