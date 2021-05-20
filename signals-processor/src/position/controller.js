"use strict";

const Mongoose = require("mongoose");
const { trader } = require("../../axios");
const config = require("@crypto-signals/config");
const {
  toSymbolPrecision,
  toSymbolStepPrecision,
  getPercentageOfValue,
  toFixedDecimal
} = require("@crypto-signals/utils");

/**
 *
 * @param {Mongoose.Connection} db
 */
module.exports = db => {
  const PositionModel = db.model("Position");
  const AccountModel = db.model("Account");
  const SignalModel = db.model("Signal");
  const MarketModel = db.model("Market");

  /**
   *
   * @param {import("../interfaces").SignalI} signal
   */
  const create = async (signal, candle) => {
    const market = await MarketModel.findOne({
      $and: [{ exchange: config.exchange }, { symbol: signal.symbol }]
    }).hint("exchange_1_symbol_1");

    let buy_amount = config.position_minimum_buy_amount;
    let enough_balance = false;

    if (!!market.use_main_account) {
      const account = await AccountModel.findOne({
        id: "production"
      }).hint("id_1");
      buy_amount = toFixedDecimal(
        config.position_percentage_size && account.total_balance
          ? getPercentageOfValue(
              account.total_balance,
              config.position_percentage_size
            )
          : config.position_minimum_buy_amount,
        2
      );

      enough_balance = account.balance >= buy_amount;
    }

    const accountType = enough_balance ? "production" : "test";
    try {
      console.log(
        `${new Date().toISOString()} | Buying position for symbol: ${
          signal.symbol
        }@${signal.exchange} | account: ${accountType}`
      );

      const account = await AccountModel.findOne({ id: accountType }).hint(
        "id_1"
      );
      const price = signal.price;
      const stop_loss =
        candle.atr_stop < price ? candle.atr_stop : price - candle.atr * 3;

      const current_candle_signals = 1;

      const createdPosition = await PositionModel.create({
        id: `${signal.exchange}_${signal.symbol}_${signal.trigger}_${signal.close_time}`,
        exchange: signal.exchange,
        symbol: signal.symbol,
        open_time: Date.now(),
        date: new Date(),
        cost: buy_amount,
        buy_price: price,
        buy_amount: toSymbolStepPrecision(buy_amount / price, signal.symbol),
        take_profit: toSymbolPrecision(
          price * (1 + config.position_take_profit / 100),
          signal.symbol
        ),
        stop_loss: toSymbolPrecision(stop_loss, signal.symbol),
        arm_trailing_stop_loss: toSymbolPrecision(
          price *
            (1 +
              (config.position_arm_trailing_stop_loss *
                current_candle_signals) /
                100),
          signal.symbol
        ),
        trigger: signal.trigger,
        signal: signal._id,
        ...(signal.buy_order && { buy_order: signal.buy_order }),
        is_test: false,
        account_id: account._id,
        last_stop_loss_update: Date.now()
      });

      await SignalModel.findByIdAndUpdate(signal._id, {
        $set: { position: createdPosition._id }
      });

      if (!!market.use_main_account && config.environment === "production") {
        trader
          .createMarketBuyOrder({
            symbol: createdPosition.symbol,
            amount: createdPosition.cost,
            position: createdPosition.id
          })
          .catch(error => console.error(error));
      }
      return createdPosition;
    } catch (error) {
      throw error;
    }
  };

  return { create };
};
