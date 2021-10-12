const ws = require("ws");
const { binance } = require("../axios");
const Mongoose = require("mongoose");
const { parseOrder, parseAccountUpdate } = require("../utils");
const { pairs, milliseconds } = require("@crypto-signals/utils");
const { quote_asset, environment } = require("@crypto-signals/config");

module.exports = class Observer {
  /**
   *
   * @param {Mongoose.Connection} db Database connection
   */
  constructor(db) {
    this.database = db;
    this.allowed_pairs = pairs.map(v => v.symbol);
    this.listenKeyKeepAliveInterval = null;
  }

  startListenKeyKeepAliveInterval() {
    this.listenKeyKeepAliveInterval = setInterval(async () => {
      const account = await this.database
        .model("Account")
        .findOne({ id: environment })
        .select({ spot_account_listen_key: true })
        .lean();

      await binance.listenKeyKeepAlive(account.spot_account_listen_key);
    }, milliseconds.minute * 30);
  }

  stopListenKeyKeepAliveInterval() {
    clearInterval(this.listenKeyKeepAliveInterval);
  }

  async updateBalance() {
    const balance = await binance.getAccountBalance(quote_asset);
    await this.database
      .model("Account")
      .updateOne({ id: environment }, { $set: { balance } });
  }

  async getListenKey() {
    const account = await this.database
      .model("Account")
      .findOne({ id: environment })
      .select({ spot_account_listen_key: true })
      .lean();
    let spot_account_listen_key;

    try {
      spot_account_listen_key = await binance.createListenKey();
    } catch (error) {
      console.error(error);
      spot_account_listen_key = await binance.createListenKey();
    }

    if (!spot_account_listen_key) {
      throw new Error("No listen key returned from binance.");
    }

    if (account.spot_account_listen_key !== spot_account_listen_key) {
      console.log("Using new listen key.");
    }

    await this.database
      .model("Account")
      .updateOne({ id: environment }, { $set: { spot_account_listen_key } });

    this.startListenKeyKeepAliveInterval();

    return spot_account_listen_key;
  }

  async init() {
    try {
      await this.updateBalance();
      let spot_account_listen_key = await this.getListenKey();

      this.client = new ws(
        `wss://stream.binance.com:9443/stream?streams=${spot_account_listen_key}`
      );

      this.client.on("open", () => {
        console.log(
          `${new Date().toISOString()} | Spot Account Observer | Connection open.`
        );
      });

      this.client.on("ping", () => {
        this.client.pong();
      });

      this.client.on("message", async data => {
        try {
          const parsedData = JSON.parse(data);
          const message = parsedData.data;
          if (message.e === "executionReport") {
            const parsedOrder = parseOrder(message);
            const validPair = this.allowed_pairs.some(
              v => v === parsedOrder.symbol
            );

            if (parsedOrder.orderId && validPair) {
              try {
                await this.database.model("Order").findOneAndUpdate(
                  {
                    $and: [
                      { orderId: { $eq: parsedOrder.orderId } },
                      { symbol: { $eq: parsedOrder.symbol } }
                    ]
                  },
                  { $set: parsedOrder },
                  { upsert: true }
                );
              } catch (error) {
                console.error(error);
                await this.database.model("Order").findOneAndUpdate(
                  {
                    $and: [
                      { orderId: { $eq: parsedOrder.orderId } },
                      { symbol: { $eq: parsedOrder.symbol } }
                    ]
                  },
                  { $set: parsedOrder },
                  { upsert: true }
                );
              }
            }
          }
          if (message.e === "outboundAccountPosition") {
            const update = parseAccountUpdate(message, quote_asset);
            if (update) {
              await this.database
                .model("Account")
                .findOneAndUpdate(
                  { id: "production" },
                  { $set: { balance: update } }
                );
            }
          }
        } catch (error) {
          throw error;
        }
      });

      this.client.on("error", () => {
        console.log(
          `${new Date().toISOString()} | Spot Orders Observer | ERROR`
        );
        process.exit();
      });

      this.client.on("close", async (...args) => {
        console.log(
          `${new Date().toISOString()} | Spot Orders Observer Stream closed.`
        );
        console.log(args);
        await this.init();
      });
    } catch (error) {
      throw error;
    }
  }
};
