const joi = require("joi");
const Controller = require("./controller");

module.exports = {
  name: "signals routes",
  version: "1.0.0",
  register: async function (server, options) {
    server.subscription("/signals");

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
      handler: Controller.find,
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
              .optional(),
            start_time: joi.number().integer().positive().greater(0).optional(),
            end_time: joi.number().integer().positive().greater(0).optional(),
            limit: joi.number().positive().integer().greater(0).optional(),
            offset: joi.number().positive().integer().greater(0).optional()
          })
        }
      }
    });

    server.route({
      method: "GET",
      path: "/{id}",
      handler: Controller.findById,
      options: {
        auth: {
          access: {
            scope: ["admin"]
          }
        },
        validate: {
          params: {
            id: joi.string().hex().length(24).required()
          }
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
            scope: ["observer"]
          }
        },
        validate: {
          // payload: joi.object({
          //   symbol: joi
          //     .string()
          //     .valid(...options.pairs)
          //     .required(),
          //   price: joi.number().positive().required(),
          //   stop_loss: joi.number().negative().required(),
          //   trailing_stop_loss: joi.number().positive().required(),
          //   take_profit: joi.number().positive().required(),
          //   id: joi.string().hex().length(24).required()
          // }),
          query: false
        }
      }
    });

    server.route({
      method: "GET",
      path: "/reports/monthly",
      handler: Controller.getMonthlyReport,
      options: {
        auth: {
          access: {
            scope: ["website", "admin"]
          }
        }
      }
    });

    server.route({
      method: "GET",
      path: "/reports/dayly",
      handler: Controller.getDaylyReport,
      options: {
        auth: {
          access: {
            scope: ["website", "admin"]
          }
        }
      }
    });

    server.route({
      method: "GET",
      path: "/open",
      handler: Controller.findOpenSignals,
      options: {
        auth: {
          access: {
            scope: ["admin", "microservice"]
          }
        }
      }
    });
  }
};
