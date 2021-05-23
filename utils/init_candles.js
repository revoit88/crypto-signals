const axios = require("axios");
const pairs = require("./pairs");

const init = async () => {
  for (const pair of pairs) {
    console.log("current pair: ", pair.symbol);
    await axios.post(
      `${process.env.API_URL}/candles/binance?symbol=${pair.symbol}`,
      {},
      { headers: { Authorization: `Bearer ${process.env.TOKEN}` } }
    );
  }
};

init();
