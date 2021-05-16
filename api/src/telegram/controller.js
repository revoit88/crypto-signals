const Boom = require("@hapi/boom");
const { orderAlphabetically } = require("@crypto-signals/utils");

exports.createChat = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );

    const exists = await Telegram.exists({ chat_id: request.payload.chat_id });

    if (!exists) {
      await Telegram.create(request.payload);
    }

    return { ok: true };
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.deleteChat = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );

    const { chat_id } = request.params;

    // await Telegram.deleteOne({ chat_id });

    return { ok: true };
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.addMarkets = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );
    const allowed_markets = request.route.realm.pluginOptions.pairs.map(p =>
      p.replace("USDT", "")
    );
    const { chat_id } = request.params;
    const markets = request.payload.filter(m => allowed_markets.includes(m));
    const include_all = (request.payload || []).includes("ALL");

    const chat = await Telegram.findOne({ chat_id }, { markets: true });

    const updated = await Telegram.findByIdAndUpdate(
      chat._id,
      {
        $set: {
          markets: [
            ...new Set(
              chat.markets
                .concat((markets || []).filter(m => m !== "ALL"))
                .concat(include_all ? allowed_markets : [])
            )
          ]
        }
      },
      { new: true }
    );
    return (updated.markets || []).sort(orderAlphabetically);
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.deleteMarkets = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );
    const { chat_id } = request.params;
    const { markets } = request.query;
    const exclude_all = Array.isArray(markets)
      ? (markets || []).includes("ALL")
      : markets === "ALL";

    const chat = await Telegram.findOne({ chat_id }, { markets: true });

    const updated = await Telegram.findByIdAndUpdate(
      chat._id,
      {
        $set: {
          markets: chat.markets.filter(market =>
            exclude_all ? false : !markets.includes(market)
          )
        }
      },
      { new: true }
    );
    return (updated.markets || []).sort(orderAlphabetically);
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.getMarkets = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );

    const { chat_id } = request.params;

    const chat = await Telegram.findOne({ chat_id }, { markets: true });

    return ((chat || {}).markets || []).sort(orderAlphabetically);
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.getAvailableMarkets = async function (request, h) {
  try {
    const Telegram = request.server.plugins.mongoose.connection.model(
      "Telegram"
    );
    const allowed_markets = request.route.realm.pluginOptions.pairs.map(p =>
      p.replace("USDT", "")
    );

    const { chat_id } = request.params;

    const chat = await Telegram.findOne({ chat_id }, { markets: true });

    return allowed_markets
      .filter(market => !((chat || {}).markets || []).includes(market))
      .sort(orderAlphabetically);
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
