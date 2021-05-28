const axios = require("axios");
const pairs = require("./pairs");

const init = async () => {
  const force = process.env.FORCE;
  for (const pair of pairs) {
    console.log("current pair: ", pair.symbol);
    await axios.post(
      `${process.env.API_URL}/candles/binance?symbol=${pair.symbol}${
        force ? "&force=true" : ""
      }`,
      {},
      { headers: { Authorization: `Bearer ${process.env.TOKEN}` } }
    );
  }
};

init();
