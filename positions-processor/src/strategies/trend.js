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
        { open_time: { $gte: Date.now() - getTimeDiff(10, interval) } },
        { open_time: { $lte: Date.now() } }
      ]
    })
      .hint("symbol_1_open_time_1")
      .sort({ open_time: 1 })
      .lean();

    /*
        Binance does not push candles during maintenance hours.
        Therefore when system comes back up, there is a gap between
        the last candle when maintenance started and when it finished
      */

    const [previous_candle = {}, candle = {}] = candles.slice(-2);

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

            const downwards_ema_slope =
              previous_candle.ema_50_slope === -1 && candle.ema_50_slope === -1;
            const downwards_trend = candle.trend === -1;

            const sell_condition =
              ((previous_candle.atr_stop < previous_candle.open_price &&
                previous_candle.atr_stop < candle.atr_stop &&
                candle.close_price < candle.atr_stop) ||
                (previous_candle.atr_stop > previous_candle.open_price &&
                  candle.open_price < candle.atr_stop &&
                  candle.close_price < candle.atr_stop)) &&
              (downwards_ema_slope || downwards_trend);

            if (sell_condition && !position.stop_loss_trigger_time) {
              await PositionModel.findByIdAndUpdate(position._id, {
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
              await PositionModel.findByIdAndUpdate(position._id, {
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
