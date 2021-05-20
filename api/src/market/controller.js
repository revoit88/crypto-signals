const Boom = require("@hapi/boom");
const { milliseconds } = require("@crypto-signals/utils");
const { exchange } = require("@crypto-signals/config");
const { castToObjectId } = require("../../utils");

exports.updateById = async function (request, h) {
  try {
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const exists = await MarketModel.exists({
      _id: castToObjectId(request.params.id)
    });

    if (!exists) {
      return Boom.notFound();
    }
    await MarketModel.findByIdAndUpdate(castToObjectId(request.params.id), {
      $set: request.payload
    });
    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.broadcast = async function (request, h) {
  const market = request.payload;
  try {
    request.server.publish("/markets", market);
    request.server.publish(`/markets/${market.symbol}`, market);
    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.getMarkets = async function (request, h) {
  const Market = request.server.plugins.mongoose.connection.model("Market");
  // const exchange= request.query.exchange;
  // const symbol = request.query.symbol;
  //TO DO FIX WHEN NEEDED
  try {
    const markets = await Market.find({ exchange });
    return markets.map(market => ({
      _id: market._id,
      broadcast_signals: market.broadcast_signals,
      send_to_profit_sharing: market.send_to_profit_sharing,
      use_main_account: market.use_main_account,
      trading: market.trading,
      exchange: market.exchange,
      symbol: market.symbol,
      last_price: market.last_price,
      last_update: new Date(market.updatedAt).getTime()
    }));
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.updateMarketLocks = async function (request, h) {
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  try {
    const locked_markets = await MarketModel.find({
      $and: [
        { trader_lock: true },
        {
          last_trader_lock_update: {
            $lt: Date.now() - milliseconds.minute
          }
        }
      ]
    });

    if (!!locked_markets.length) {
      await MarketModel.updateMany(
        { symbol: { $in: locked_markets.map(m => m.symbol) } },
        { $set: { trader_lock: false } }
      );
    }

    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.persist = async function (request, h) {
  try {
    const getAsync = request.server.plugins.redis.getAsync;
    const setAsync = request.server.plugins.redis.setAsync;
    const delAsync = request.server.plugins.redis.delAsync;
    const rpushAsync = request.server.plugins.redis.rpushAsync;
    const llenAsync = request.server.plugins.redis.llenAsync;
    const lpopAsync = request.server.plugins.redis.lpopAsync;

    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const market = request.payload;

    request.server.publish("/markets", market);
    request.server.publish(`/markets/${market.symbol}`, market);

    const last_markets_persist_date = await getAsync(
      "last_markets_persist_date"
    );

    const markets_persist_lock = await getAsync("markets_persist_lock");

    if (
      Date.now() - (last_markets_persist_date || 0) > milliseconds.minute * 2 &&
      !!markets_persist_lock
    ) {
      await delAsync("markets_persist_lock");
    }

    if (
      Date.now() - (last_markets_persist_date || 0) > milliseconds.minute &&
      !markets_persist_lock
    ) {
      await setAsync("markets_persist_lock", true);
      await setAsync("last_markets_persist_date", Date.now());
      const length = await llenAsync("markets");
      const markets = await lpopAsync(["markets", length]);
      const toUpdate = (markets || []).reduce((acc, market) => {
        const parsed = JSON.parse(market);
        return { ...acc, [`${parsed.exchange}_${parsed.symbol}`]: parsed };
      }, {});

      if (Object.keys(toUpdate).length) {
        await MarketModel.bulkWrite(
          Object.keys(toUpdate).map(key => {
            const [exchange, symbol] = key.split("_");
            return {
              updateOne: {
                filter: { $and: [{ exchange }, { symbol }] },
                update: { $set: toUpdate[key] },
                upsert: true
              }
            };
          }),
          { ordered: false }
        );
      }
      await delAsync("markets_persist_lock");
    } else {
      await rpushAsync("markets", JSON.stringify(market));
    }
    return h.response();
  } catch (error) {
    console.error(error);
    return Boom.internal();
  }
};
