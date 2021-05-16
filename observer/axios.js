const axios = require("axios");
const { api_url } = require("@crypto-signals/config");
const config = require("./config");

/**
 * @type {axios.AxiosInstance}
 */
const API = axios.create({
  baseURL: api_url,
  headers: {
    Authorization: `Bearer ${config.api_token}`
  }
});

const persist = async value => {
  try {
    if (api_url) {
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
