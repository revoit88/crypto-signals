const ws = require("ws");
const { api } = require("../axios");

module.exports = class Observer {
  /**
   *
   * @param {String} exchange Exchange
   * @param {String} symbol Symbol
   * @param {String} interval Interval
   */
  constructor(exchange, symbol, interval) {
    this.exchange = exchange;
    this.symbol = symbol.split(",");
    this.interval = interval;
  }

  async init() {
    try {
      console.log(
        `Observer for ${this.exchange} started at ${new Date().toUTCString()}.`
      );

      this.client = new ws(
        `wss://stream.binance.com:9443/stream?streams=${this.symbol
          .map(v => `${v}@kline_${this.interval}`)
          .join("/")}`
      );

      this.client.on("open", () => {
        console.log(
          `${new Date().toISOString()} | ${this.exchange} | Connection open.`
        );
        this.client.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: this.symbol.map(
              v => `${String(v).toLowerCase()}@kline_${this.interval}`
            ),
            id: process.pid
          }),
          error => {
            if (error) {
              throw error;
            }
          }
        );
      });

      this.client.on("ping", () => {
        this.client.pong();
      });

      this.client.on("message", async data => {
        try {
          const message = (JSON.parse(data) || {}).data;
          if (message?.e === "kline") {
            const k = message.k;
            await api.persist({
              id: `${this.exchange}_${message.s}_${k.i}_${k.t}`,
              symbol: message.s,
              event_time: message.E || Date.now(),
              open_time: k.t,
              close_time: k.T,
              interval: k.i,
              open_price: +k.o,
              close_price: +k.c,
              high_price: +k.h,
              low_price: +k.l,
              base_asset_volume: +k.v,
              quote_asset_volume: +k.q,
              date: new Date(k.t).toISOString(),
              exchange: this.exchange
            });
          }
        } catch (error) {
          throw error;
        }
      });

      this.client.on("error", () => {
        console.log(`${new Date().toISOString()} | ERROR`);
        process.exit();
      });

      this.client.on("close", async (...args) => {
        console.log(
          `${new Date().toISOString()} | Stream for ${this.exchange} closed.`
        );
        console.log(args);
        await this.init();
      });
    } catch (error) {
      throw error;
    }
  }
};
