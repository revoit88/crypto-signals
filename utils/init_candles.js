const axios = require("axios");
const { pairs } = require("./index");

class Queue {
  constructor(items = []) {
    this.items = items.slice();
    this.current_items = [];
    this.concurrency = 5;
  }

  init() {
    this.enqueue(this.concurrency);
  }

  enqueue(length = 1) {
    if (this.items.length) {
      const force = process.env.FORCE;
      const new_items = this.items.slice(0, length);
      this.items = this.items.slice(length);
      for (const item of new_items) {
        console.log("current pair: ", item);
        axios
          .post(
            `${process.env.API_URL}/candles/binance?symbol=${item}${
              force ? "&force=true" : ""
            }`,
            {},
            { headers: { Authorization: `Bearer ${process.env.TOKEN}` } }
          )
          .then(() => {
            this.enqueue();
          });
      }
    }
  }

  denqueue(symbol) {
    this.items = this.items.filter(item => item.symbol !== symbol);
  }
}

// const init = async () => {
//   const force = process.env.FORCE;
//   for (const pair of pairs) {
//     console.log("current pair: ", pair.symbol);
//     await axios.post(
//       `${process.env.API_URL}/candles/binance?symbol=${pair.symbol}${
//         force ? "&force=true" : ""
//       }`,
//       {},
//       { headers: { Authorization: `Bearer ${process.env.TOKEN}` } }
//     );
//   }
// };
new Queue(pairs.map(p => p.symbol)).init();
// init();
