const Boom = require("@hapi/boom");
const { binance } = require("../../utils/axios");
const qs = require("querystring");
const {
  milliseconds,
  toSymbolStepPrecision,
  getChange
} = require("@crypto-signals/utils");
const { exchange, quote_asset } = require("@crypto-signals/config");

exports.getUpdatedBalance = async function (request, h) {
  try {
    const Account = request.server.plugins.mongoose.connection.model("Account");

    const Market = request.server.plugins.mongoose.connection.model("Market");

    const accountPromise = binance.get("/api/v3/account");

    const { data: account } = await accountPromise;

    const [asset] = account.balances.filter(item => item.asset === quote_asset);
    const balances = account.balances
      .reduce((acc, current) => {
        return +current.free || +current.locked ? acc.concat(current) : acc;
      }, [])
      .filter(item => item.asset !== quote_asset);

    const markets = await Market.find({
      $and: [
        { exchange },
        { symbol: { $in: balances.map(b => `${b.asset}${quote_asset}`) } }
      ]
    }).hint("exchange_1_symbol_1");

    const { total } = balances.reduce(
      (acc, item) => {
        const pairString = `${item.asset}${quote_asset}`;
        const market = markets.find(m => m.symbol === pairString);
        if (!market) {
          return acc;
        }
        const value = Number(
          Number(
            (+item.free + +item.locked) * (market || {}).last_price
          ).toFixed(8)
        );
        return {
          pairs: acc.pairs.concat({ symbol: pairString, value }),
          total: Number(Number(acc.total + value).toFixed(8))
        };
      },
      { pairs: [], total: 0 }
    );

    const totalAsset = +Number(+asset.free + +asset.locked + total).toFixed(8);

    await Account.findOneAndUpdate(
      { id: "production" },
      { $set: { total_balance: totalAsset, balance: Number(asset.free) } },
      { new: true }
    );

    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.cancelUnfilledOrders = async function (request, h) {
  try {
    const PositionModel =
      request.server.plugins.mongoose.connection.model("Position");
    const OrderModel =
      request.server.plugins.mongoose.connection.model("Order");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const orders = await OrderModel.find({
      $and: [
        { status: { $nin: ["FILLED", "CANCELED"] } },
        // remove this if need to cancel sell orders too
        // also add index without side
        { side: { $ne: "SELL" } },
        { time: { $lt: Date.now() - milliseconds.minute * 10 } },
        { time: { $gt: Date.now() - milliseconds.hour } }
      ]
    }).hint("status_1_side_1_time_-1");

    if (orders.length) {
      const positions = await PositionModel.find({
        "buy_order.orderId": { $in: orders.map(o => o.orderId) }
      })
        .hint("buy_order.orderId_1")
        .lean();

      const markets = await MarketModel.find({
        $and: [
          { exchange },
          { symbol: { $in: [...new Set(orders.map(o => o.symbol))] } }
        ]
      })
        .hint("exchange_1_symbol_1")
        .lean();

      for (const order of orders) {
        const position = positions.find(
          p => p?.buy_order?.orderId === order?.orderId
        );

        const market = markets.find(m => m.symbol === order.symbol);

        if (
          (!position ||
            // if need to cancel sell orders change this
            (position.buy_price < market.last_price &&
              getChange(market.last_price, position.buy_price) > 1)) &&
          !(order.clientOrderId || "").match(/web_/)
        ) {
          const tradeQuery = new URLSearchParams({
            symbol: order.symbol,
            orderId: order.orderId
          }).toString();

          try {
            await binance.delete(`/api/v3/order?${tradeQuery}`);
          } catch (error) {
            request.logger.error(error.toJSON());
          }
        }
      }
    }

    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.getExchangeInfoProcessed = async function (request, h) {
  try {
    const { data } = await binance.get("/api/v3/exchangeInfo");
    const request_quote_asset = request.query.quote_asset;

    const processed = data.symbols
      .filter(
        symbol =>
          !!symbol.isSpotTradingAllowed &&
          symbol.quoteAsset === (request_quote_asset ?? quote_asset) &&
          !!symbol.quoteOrderQtyMarketAllowed &&
          symbol.status === "TRADING"
      )
      .map(item => ({
        symbol: item.symbol,
        priceTickSize: item.filters.find(f => f.filterType === "PRICE_FILTER")
          .tickSize,
        stepSize: item.filters.find(f => f.filterType === "LOT_SIZE").stepSize
      }));

    return processed;
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.convertDust = async function (request, h) {
  try {
    const Market = request.server.plugins.mongoose.connection.model("Market");
    const accountPromise = binance.get("/api/v3/account");
    const markets = await Market.find({ exchange });

    const { data: account } = await accountPromise;

    const allowed_markets = request.route.realm.pluginOptions.pairs;

    const assets = account.balances
      .filter(item => !["USDT", "BNB", "NULS"].includes(item.asset))
      .filter(item => allowed_markets.includes(`${item.asset}USDT`))
      .filter(item => +item.free > 0)
      .reduce((acc, current) => {
        const pairString = `${current.asset}USDT`;
        const market = markets.find(m => m.symbol === pairString);
        const value = +current.free * (market || {}).last_price;
        const isDust = value < 10;
        return isDust ? acc.concat(current.asset) : acc;
      }, []);

    if (assets.length) {
      const assets_string = assets.map(asset => `asset=${asset}`).join("&");
      await binance.post(`/sapi/v1/asset/dust?${assets_string}`);
    }
    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.updateListenKey = async function (request, h) {
  try {
    const AccountModel =
      request.server.plugins.mongoose.connection.model("Account");
    const account = await AccountModel.findOne({ id: "production" })
      .hint("id_1")
      .lean();
    if (
      !!account.spot_account_listen_key &&
      account.last_spot_account_listen_key_update >
        Date.now() - milliseconds.hour
    ) {
      let keyExists = true;
      const query = new URLSearchParams({
        listenKey: account.spot_account_listen_key
      }).toString();

      try {
        await binance.put(`api/v3/userDataStream?${query}`);
      } catch (error) {
        // listen key does not exist
        if (error?.response?.data?.code === -1125) {
          keyExists = false;
        }
      }
      await AccountModel.findOneAndUpdate(
        { id: "production" },
        {
          $set: { last_spot_account_listen_key_update: Date.now() },
          ...(!keyExists && { $unset: { spot_account_listen_key: true } })
        }
      );
    }
    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};

exports.broadcast = async function (request, h) {
  try {
    request.server.publish(`/account/${request.payload.id}`, request.payload);
    return h.response();
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.getAccountById = async function (request, h) {
  try {
    const AccountModel =
      request.server.plugins.mongoose.connection.model("Account");
    const account = await AccountModel.findOne({ id: request.params.id }).hint(
      "id_1"
    );
    return {
      balance: account.balance,
      total_balance: account.total_balance,
      id: request.params.id,
      time: Date.now()
    };
  } catch (error) {
    request.logger.error(error);
    return Boom.internal();
  }
};

exports.bnbToUsdt = async function (request, h) {
  try {
    const PositionModel =
      request.server.plugins.mongoose.connection.model("Position");
    const MarketModel =
      request.server.plugins.mongoose.connection.model("Market");

    const accountPromise = binance.get("/api/v3/account");

    const { data: account } = await accountPromise;

    const [bnb] = account.balances.filter(item => item.asset === "BNB");

    const bnb_positions = await PositionModel.find({
      $and: [{ exchange }, { symbol: "BNBUSDT" }, { status: "open" }]
    }).hint("exchange_1_symbol_1_status_1");

    const total_in_bnb_positions = bnb_positions.reduce(
      (acc, position) => acc + position.buy_amount,
      0
    );

    const amount_to_sell = +bnb.free - total_in_bnb_positions;

    const bnbMarket = await MarketModel.findOne({
      $and: [{ exchange }, { symbol: "BNBUSDT" }]
    }).hint("exchange_1_symbol_1");

    if (amount_to_sell * bnbMarket.last_price > 12) {
      try {
        const query = qs.stringify({
          symbol: "BNBUSDT",
          type: "MARKET",
          side: "SELL",
          quantity: toSymbolStepPrecision(amount_to_sell, "BNBUSDT")
        });
        await binance.post(`/api/v3/order?${query}`);
      } catch (error) {
        request.logger.error(error.toJSON());
      }
    }

    return h.response();
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
