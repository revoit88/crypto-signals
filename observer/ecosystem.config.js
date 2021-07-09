require("@crypto-signals/config");
const { pairs, splitArray } = require("@crypto-signals/utils");
module.exports = {
  apps: splitArray([], pairs, 25).map(pairs => ({
    name: `${pairs[0].symbol}-${pairs[pairs.length - 1].symbol}-observer`,
    script: "app.js",
    exp_backoff_restart_delay: 100,
    env: {
      SYMBOL: pairs.map(p => p.symbol).join(","),
      NODE_ENV: "production"
    }
  }))
};
