const Controller = require("./controller");
const Joi = require("joi");

module.exports = {
  name: "markets routes",
  version: "1.0.0",
  register: function (server, options) {
    server.subscription("/markets");
    server.subscription("/markets/{symbol}");

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
      method: "PATCH",
      path: "/{id}",
      handler: Controller.updateById,
      options: {
        auth: {
          access: {
            scope: ["admin"]
          }
        },
        validate: {
          params: {
            id: Joi.string().trim().alphanum().length(24).required()
          },
          payload: Joi.object({
            trading: Joi.boolean().optional(),
            broadcast_signals: Joi.boolean().optional(),
            send_to_profit_sharing: Joi.boolean().optional(),
            use_main_account: Joi.boolean().optional()
          })
            .options({ stripUnknown: true })
            .or(
              "trading",
              "broadcast_signals",
              "send_to_profit_sharing",
              "use_main_account"
            )
        }
      }
    });

    server.route({
      method: "get",
      path: "/",
      handler: Controller.getMarkets,
      options: {
        auth: {
          access: {
            scope: ["admin"]
          }
        }
      }
    });

    server.route({
      method: "get",
      path: "/lock",
      handler: Controller.updateMarketLocks,
      options: {
        auth: {
          access: {
            scope: ["microservice"]
          }
        }
      }
    });

    server.route({
      method: "POST",
      path: "/persist",
      handler: Controller.persist,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "post",
      path: "/update-traded-markets",
      handler: Controller.updateTradedMarkets,
      options: { auth: { access: { scope: ["microservice"] } } }
    });
  }
};
