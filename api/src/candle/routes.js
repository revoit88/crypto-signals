const joi = require("joi");
const Controller = require("./controller");

module.exports = {
  name: "candles routes",
  version: "1.0.0",
  register: function (server, options) {
    server.subscription("/candles/{symbol}");

    server.route({
      method: "POST",
      path: "/",
      handler: Controller.create,
      options: {
        auth: {
          access: {
            scope: ["backtest"]
          }
        }
      }
    });

    server.route({
      method: "GET",
      path: "/",
      handler: Controller.getObserverStatus,
      options: {
        auth: {
          access: {
            scope: ["website", "admin"]
          }
        },
        validate: {
          query: joi.object({
            symbol: joi
              .string()
              .valid(...options.pairs)
              .optional()
          })
        }
      }
    });

    server.route({
      method: "GET",
      path: "/{symbol}",
      handler: Controller.getSymbolCandles,
      options: {
        auth: {
          access: {
            scope: ["admin"]
          }
        }
      }
    });

    server.route({
      method: "DELETE",
      path: "/old",
      handler: Controller.deleteOldCandles,
      options: {
        auth: false,
        validate: {
          payload: false,
          query: joi.object({
            symbol: joi
              .string()
              .valid(...options.pairs)
              .optional()
          })
        }
      }
    });

    server.route({
      method: "POST",
      path: "/broadcast",
      handler: Controller.broadcast,
      options: {
        auth: {
          access: {
            scope: ["observer", "microservice"]
          }
        }
      }
    });

    server.route({
      method: "GET",
      path: "/past-day",
      handler: Controller.getPastDayCandles,
      options: {
        auth: {
          access: {
            scope: ["website", "admin"]
          }
        }
      }
    });

    server.route({
      method: "POST",
      path: "/persist",
      handler: Controller.persist,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "POST",
      path: "/binance",
      handler: Controller.getCandlesFromBinance,
      options: { auth: false }
      // options: { auth: { access: { scope: ["admin"] } } }
    });
  }
};
