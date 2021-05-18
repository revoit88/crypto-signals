"use strict";

const Mongoose = require("mongoose");
const { toSymbolPrecision, getTimeDiff } = require("@crypto-signals/utils");
const { exchange, interval } = require("@crypto-signals/config");

/**
 *
 * @param {Mongoose.Connection} db
 */
module.exports = db => {
  const PositionModel = db.model("Position");
  const CandleModel = db.model("Candle");

  const process = async symbol => {
    const candles = await CandleModel.find({
      $and: [
        { exchange },
        { symbol },
        { interval },
        { open_time: { $gte: Date.now() - getTimeDiff(3, interval) } },
        { open_time: { $lte: Date.now() } }
      ]
    })
      .hint("exchange_1_symbol_1_interval_1_open_time_1")
      .sort({ open_time: 1 });

    if (candles.length <= 1) {
      return;
    }
    const [previous_candle, candle] = candles.slice(-2);

    try {
      const positions = await PositionModel.find({
        $and: [{ exchange }, { symbol }, { status: "open" }]
      }).hint("exchange_1_symbol_1_status_1");

      if (!positions.length) {
        return;
      }

      return Promise.all(
        positions.map(async position => {
          try {
            if (
              candle.atr_stop !== position.stop_loss &&
              candle.atr_stop < candle.open_price
            ) {
              await PositionModel.findByIdAndUpdate(position._id, {
                $set: {
                  stop_loss: toSymbolPrecision(candle.atr_stop, candle.symbol)
                }
              });
            }

            if (
              (previous_candle.atr_stop < previous_candle.open_price &&
                previous_candle.atr_stop < candle.atr_stop &&
                candle.open_price < candle.atr_stop) ||
              (previous_candle.atr_stop > previous_candle.open_price &&
                candle.open_price < candle.atr_stop &&
                candle.close_price < position.stop_loss)
            ) {
              return {
                position,
                candle,
                sell_trigger: "stop_loss"
              };
            }

            if (+candle.close_price >= position.take_profit) {
              return {
                position,
                candle,
                sell_trigger: "take_profit"
              };
            }

            return Promise.resolve();
          } catch (error) {
            throw error;
          }
        })
      );
    } catch (error) {
      throw error;
    }
  };

  return { process };
};
