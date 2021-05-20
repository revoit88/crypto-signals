const axios = require("axios");
const pairs = require("./pairs");

const init = async () => {
  for (const pair of pairs) {
    await axios.post(
      `http://localhost:8080/candles/binance?symbol=${pair.symbol}`
    );
  }
};

init();
