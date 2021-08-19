"use strict";

const mongoose = require("mongoose");
const { SignalModel } = require("@crypto-signals/utils/models");

const SignalSchema = SignalModel(mongoose);

module.exports = db => db.model("Signal", SignalSchema);
