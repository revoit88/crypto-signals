"use strict";

const Mongoose = require("mongoose");
const {
  toSymbolPrecision,
  getTimeDiff,
  milliseconds
} = require("@crypto-signals/utils");
const { exchange, interval } = require("@crypto-signals/config");

/**
 *
 * @param {Mongoose.Connection} db
 */
module.exports = db => {
  const PositionModel = db.model("Position");
  const CandleModel = db.model("Candle");

  const process = async symbol => {
    const count = await CandleModel.countDocuments({
      $and: [
        { symbol },
        { open_time: { $gte: Date.now() - getTimeDiff(155, interval) } },
        { open_time: { $lte: Date.now() } }
      ]
    });

    if (count < 150) {
      return;
    }

    const candles = await CandleModel.find({
      $and: [
        { symbol },
        { open_time: { $gte: Date.now() - getTimeDiff(3, interval) } },
        { open_time: { $lte: Date.now() } }
      ]
    })
      .hint("symbol_1_open_time_1")
      .sort({ open_time: 1 })
      .lean();

    const [previous_candle, candle] = candles.slice(-2);

    try {
      const positions = await PositionModel.find({
        $and: [{ symbol }, { status: "open" }]
      })
        .hint("symbol_1_status_1")
        .lean();

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

            const sell_condition =
              (previous_candle.atr_stop < previous_candle.open_price &&
                previous_candle.atr_stop < candle.atr_stop &&
                candle.close_price < candle.atr_stop) ||
              (previous_candle.atr_stop > previous_candle.open_price &&
                candle.open_price < candle.atr_stop &&
                candle.close_price < candle.atr_stop);

            if (sell_condition && !position.stop_loss_trigger_time) {
              return await PositionModel.findByIdAndUpdate(position._id, {
                $set: { stop_loss_trigger_time: Date.now() }
              });
            }

            const five_minutes_passed =
              position.stop_loss_trigger_time &&
              Date.now() - position.stop_loss_trigger_time >
                milliseconds.minute * 5;

            if (
              five_minutes_passed &&
              !sell_condition &&
              position.stop_loss_trigger_time
            ) {
              return await PositionModel.findByIdAndUpdate(position._id, {
                $unset: { stop_loss_trigger_time: true }
              });
            }

            if (
              five_minutes_passed &&
              sell_condition &&
              position.stop_loss_trigger_time
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
