const Mongoose = require("mongoose");
const Redis = require("redis");
const express = require("express");
const app = express();
const axios = require("axios");
const config = require("./config");
const { castToObjectId } = require("./utils");
const { getPriceAsString } = require("@crypto-signals/utils");

if (!config.telegram_api_url) {
  throw new Error("Telegram API URL is not defined");
}
if (!config.bot_token) {
  throw new Error("Bot Token is not defined");
}
if (!config.channel_id) {
  throw new Error("Channel ID is not defined");
}

async function sendMessage(text, reply_to_message_id) {
  const { data } = await axios.post(
    `${config.telegram_api_url}${config.bot_token}/sendMessage`,
    {
      chat_id: config.channel_id,
      text,
      ...(reply_to_message_id && { reply_to_message_id })
    }
  );
  return data;
}

Mongoose.createConnection(
  config.db_uri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err, connection) => {
    if (err) {
      throw err;
    }

    require("./src/position/model")(connection);

    app.locals.db = connection;

    const pubSub = Redis.createClient({ url: config.redis_uri });

    pubSub.on("subscribe", function (channel) {
      console.log(`[Telegram] Subscribed to channel: ${channel}`);
    });

    pubSub.on("message", async function (channel, data) {
      if (
        channel === `${config.quote_asset}_${config.redis_positions_channel}`
      ) {
        const signal = JSON.parse(data);
        try {
          const position_id = signal?._id;
          const signal_type = signal?.type;

          if (!signal_type) {
            throw new Error("Signal Type is not defined");
          }
          if (signal_type !== "entry" && signal_type !== "exit") {
            throw new Error("Signal Type is not valid");
          }
          const PositionModel = connection.model("Position");

          const position = await PositionModel.findById(
            castToObjectId(position_id)
          ).lean();

          if (!position) {
            throw new Error(`Position '${position_id}' does not exist`);
          }

          const getMessage = (signal_type, position) => {
            const price =
              position[`${signal_type === "entry" ? "buy" : "sell"}_price`];
            return `Signal Type: ${String(signal_type).toUpperCase()}
Pair: ${String(position.symbol).replace(
              config.quote_asset,
              `/${config.quote_asset}`
            )}
Price: ${config.currency_symbol}${getPriceAsString(price)}`;
          };

          if (!!position.broadcast) {
            const message = await sendMessage(
              getMessage(signal_type, position),
              position.entry_signal_telegram_message_id
            );

            if (signal_type === "entry") {
              // edit position and set entry message id
              await PositionModel.findByIdAndUpdate(
                castToObjectId(position_id),
                {
                  $set: { entry_signal_telegram_message_id: message.message_id }
                }
              );
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    });

    pubSub.subscribe(
      `${config.quote_asset}_${config.redis_positions_channel}`,
      function () {}
    );

    app.use(express.json());

    app.use((req, res, next) => {
      if (req.headers.authorization !== `Bearer ${config.microservice_token}`) {
        return res.status(403).send();
      }
      next();
    });

    // send message
    app.post("/message/broadcast", async (req, res) => {
      try {
        const message = req.body.message;
        if (!message) {
          throw new Error("No message to broadcast");
        }

        await sendMessage(message);
      } catch (error) {
        console.error(error);
      }

      return res.send();
    });

    // monthly report message

    // donations

    app.listen(config.port || 3000, () => {
      console.log(`Telegram bot running on port ${config.port || 3000}!`);
    });
  }
);
