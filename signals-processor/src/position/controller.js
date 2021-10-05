"use strict";

const Mongoose = require("mongoose");
const config = require("@crypto-signals/config");
const {
  toSymbolPrecision,
  toSymbolStepPrecision
} = require("@crypto-signals/utils");

/**
 *
 * @param {Mongoose.Connection} db
 */
module.exports = db => {
  const PositionModel = db.model("Position");
  const SignalModel = db.model("Signal");

  /**
   *
   * @param {import("../interfaces").SignalI} signal
   */
  const create = async (signal, candle) => {
    let buy_amount = config.position_minimum_buy_amount;

    try {
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
        last_stop_loss_update: Date.now(),
        broadcast: signal.broadcast
      });

      await SignalModel.findByIdAndUpdate(signal._id, {
        $set: { position: createdPosition._id }
      });

      return createdPosition;
    } catch (error) {
      throw error;
    }
  };

  return { create };
};
