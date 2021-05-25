const joi = require("joi");
const Controller = require("./controller");

module.exports = {
  name: "positions routes",
  version: "1.0.0",
  register: function (server, options) {
    server.subscription("/positions");

    server.route({
      method: "POST",
      path: "/",
      handler: Controller.create,
      options: {
        auth: {
          access: {
            scope: ["microservice"]
          }
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
      method: "GET",
      path: "/open",
      handler: Controller.findOpenPositions,
      options: {
        auth: {
          access: {
            scope: ["admin", "microservice"]
          }
        }
      }
    });

    server.route({
      method: "POST",
      path: "/broadcast",
      handler: Controller.broadcast,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
      // options: {
      //   validate: {
      //     payload: joi.object({
      //       symbol: joi
      //         .string()
      //         .valid(...options.pairs)
      //         .required(),
      //       close_price: joi.number().positive().required(),
      //       event_time: joi.number().integer().positive(),
      //       open_time: joi.number().integer().positive(),
      //       close_time: joi.number().integer().positive(),
      //       change: joi.number()
      //     }),
      //     query: false
      //   }
      // }
    });

    server.route({
      method: "GET",
      path: "/reports/profit",
      handler: Controller.profitReport,
      options: {
        auth: {
          access: {
            scope: ["website"]
          }
        }
      }
      // options: {
      //   validate: {
      //     query:{
      //       symbol
      //       start date
      //       end date
      //     }
      //   }
      // }
    });

    server.route({
      method: "GET",
      path: "/reports/dayly",
      handler: Controller.getDaylyReport,
      options: {
        auth: {
          access: {
            scope: ["website"]
          }
        }
      }
    });

    server.route({
      method: "GET",
      path: "/reports/weekly",
      handler: Controller.getWeeklyReport,
      options: {
        auth: {
          access: {
            scope: ["website"]
          }
        }
      }
    });

    server.route({
      method: "POST",
      path: "/repeat-close",
      handler: Controller.repeatClosePositions,
      options: { auth: { access: { scope: ["microservice"] } } }
    });
  }
};
