const ws = require("ws");
const { binance } = require("../axios");
const Mongoose = require("mongoose");
const { parseOrder, parseAccountUpdate } = require("../utils");
const { milliseconds } = require("@crypto-signals/utils");
const { quote_asset } = require("@crypto-signals/config");

module.exports = class Observer {
  /**
   *
   * @param {Mongoose.Connection} db Database connection
   */
  constructor(db) {
    this.database = db;
  }

  order_events = {};

  async init() {
    try {
      console.log(
        `Observer for spot account started at ${new Date().toUTCString()}.`
      );

      const Account = this.database.model("Account");
      const OrderModel = this.database.model("Order");

      const account = await Account.findOne({ id: "production" });

      if (
        account.spot_account_listen_key &&
        Date.now() - account.last_spot_account_listen_key_update >
          milliseconds.hour
      ) {
        console.log("Deleting listen key.");
        await binance.deleteListenKey(account.spot_account_listen_key);
      }

      let spot_account_listen_key;
      try {
        spot_account_listen_key = await binance.createListenKey();
      } catch (error) {
        console.error(error);
        spot_account_listen_key = await binance.createListenKey();
      }

      if (!spot_account_listen_key) {
        throw new Error("No listen key");
      }

      await Account.findOneAndUpdate(
        { id: "production" },
        {
          $set: {
            spot_account_listen_key,
            last_spot_account_listen_key_update: Date.now()
          }
        }
      );

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

            if (parsedOrder.orderId && parsedOrder.symbol) {
              try {
                await OrderModel.findOneAndUpdate(
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
                await OrderModel.findOneAndUpdate(
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
              await Account.findOneAndUpdate(
                { id: "production" },
                { $set: { balance: update } },
                { new: true }
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
