const Boom = require("@hapi/boom");
const axios = require("axios");
const { milliseconds, getTimeDiff } = require("@crypto-signals/utils");
const {
  exchange,
  quote_asset,
  interval,
  cmc_api_key,
  cmc_api_url
} = require("@crypto-signals/config");
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

exports.updateTradedMarkets = async function (request, h) {
  const MarketModel =
    request.server.plugins.mongoose.connection.model("Market");
  const CandleModel =
    request.server.plugins.mongoose.connection.model("Candle");
  try {
    const all_markets = await MarketModel.find({}).lean();
    const cmc_promise = axios.get(
      `${cmc_api_url}/v1/cryptocurrency/listings/latest?limit=300`,
      { headers: { "X-CMC_PRO_API_KEY": cmc_api_key } }
    );

    const coingecko_promise = axios.get(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD&order=market_cap_desc&per_page=250&page=1&sparkline=false`
    );

    const { data: cmc_response } = await cmc_promise;
    const { data: coingecko_response } = await coingecko_promise;

    const grouped_response = cmc_response.data
      .map(item => ({
        symbol: item.symbol,
        rank: item.cmc_rank
      }))
      .concat(
        coingecko_response.map(item => ({
          symbol: String(item.symbol).toUpperCase(),
          rank: item.market_cap_rank
        }))
      )
      .sort((a, b) => a.rank - b.rank)
      .reduce((a, c) => {
        const exists = a.indexOf(c.symbol) !== -1;
        return exists ? a : a.concat(c.symbol);
      }, []);

    const markets = all_markets.map(m => m.symbol);
    const ds = {
      MIOTA: "IOTA",
      XVG: "BQX"
    };
    const getSymbol = symbol => ds[symbol] || symbol;
    const all_symbols = grouped_response.map(
      item => `${getSymbol(item)}${quote_asset}`
    );

    let pairs_to_trade = [];

    for (const current_symbol of all_symbols) {
      if (pairs_to_trade.length < 150) {
        const candle_count = await CandleModel.countDocuments({
          $and: [
            { symbol: current_symbol },
            { open_time: { $gte: Date.now() - getTimeDiff(155, interval) } }
          ]
        });
        if (markets.includes(current_symbol) && candle_count >= 150) {
          pairs_to_trade = [...new Set(pairs_to_trade.concat(current_symbol))];
        }
      }
    }

    const updates = all_markets.reduce((acc, market) => {
      const send =
        pairs_to_trade.includes(market.symbol) && !market.broadcast_signals;
      const dont_send =
        !pairs_to_trade.includes(market.symbol) && market.broadcast_signals;
      if (send || dont_send) {
        return acc.concat({
          updateOne: {
            filter: { symbol: market.symbol },
            update: {
              $set: { broadcast_signals: !!send, use_main_account: !!send }
            }
          }
        });
      }
      return acc;
    }, []);

    if (updates.length) {
      await MarketModel.bulkWrite(updates, { ordered: false });
    }

    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
