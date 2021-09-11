const { Telegraf } = require("telegraf");
const Mongoose = require("mongoose");
const express = require("express");
const app = express();
const config = require("./config");
const bot = new Telegraf(config.bot_token);
const { castToObjectId, getPriceAsString } = require("./utils");

app.use(bot.webhookCallback("/new-message"));
bot.telegram.setWebhook(config.webhook_url);
bot.telegram.webhookReply = true;

app.use(express.json());

app.use(async (req, res, next) => {
  const connection = await Mongoose.createConnection(config.db_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).asPromise();
  require("./src/position/model")(connection);
  req.app.mongoose = connection;
  next();
});

app.use((req, res, next) => {
  if (req.headers.authorization !== `Bearer ${config.microservice_token}`) {
    return res.status(403).send();
  }
  next();
});

app.post("/signals/broadcast", async (req, res) => {
  try {
    const channel_id = config.channel_id;
    const position_id = req.body._id;
    const signal_type = req.body.type;

    if (!channel_id) {
      throw new Error("Channel ID is not defined");
    }
    if (!position_id) {
      throw new Error("Position ID is not defined");
    }
    if (!signal_type) {
      throw new Error("Signal Type is not defined");
    }
    if (signal_type !== "entry" && signal_type !== "exit") {
      throw new Error("Signal Type is not valid");
    }
    const PositionModel = req.app.mongoose.model("Position");

    const position = await PositionModel.findById(
      castToObjectId(position_id)
    ).lean();

    if (!position) {
      throw new Error(`Position '${position_id}' does not exist`);
    }

    const getMessage = (signal_type, position) => {
      const price =
        position[`${signal_type === "entry" ? "buy" : "sell"}_price`];
      return `Signal type: ${String(signal_type).toUpperCase()}
Pair: ${String(position.symbol).replace("BTC", "/BTC")}
Price: ₿${getPriceAsString(price)}
`.concat(signal_type === "exit" ? `Estimated profit: ${position.change}%` : "");
    };

    if (!!position.broadcast) {
      const message = await bot.telegram.sendMessage(
        channel_id,
        getMessage(signal_type, position),
        ...(signal_type === "exit" &&
        !!position.entry_signal_telegram_message_id
          ? [{ reply_to_message_id: position.entry_signal_telegram_message_id }]
          : [])
      );

      if (signal_type === "entry") {
        // edit position and set entry message id
        await PositionModel.findByIdAndUpdate(castToObjectId(position_id), {
          $set: { entry_signal_telegram_message_id: message.message_id }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }

  return res.send();
});

app.listen(config.port || 3000, () => {
  console.log(`Telegram bot running on port ${config.port || 3000}!`);
});
