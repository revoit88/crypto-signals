require("@crypto-signals/config");
const { pairs } = require("@crypto-signals/utils");
module.exports = {
  apps: [
    {
      name: "observer",
      script: "app.js",
      exp_backoff_restart_delay: 100,
      env: {
        SYMBOL: pairs.map(p => p.symbol).join(","),
        NODE_ENV: "production"
      }
    }
  ]
};
