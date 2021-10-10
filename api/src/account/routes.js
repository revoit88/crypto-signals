const Controller = require("./controller");

module.exports = {
  name: "account routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "GET",
      path: "/balance/update",
      handler: Controller.getUpdatedBalance,
      options: { auth: { access: { scope: ["microservice"] } } }
    });

    server.route({
      method: "GET",
      path: "/orders/cancel",
      handler: Controller.cancelUnfilledOrders,
      options: { auth: { access: { scope: ["microservice"] } } }
    });

    server.route({
      method: "GET",
      path: "/exchange-info",
      handler: Controller.getExchangeInfoProcessed,
      options: { auth: false }
    });

    server.route({
      method: "GET",
      path: "/dust",
      handler: Controller.convertDust,
      options: { auth: { access: { scope: ["microservice"] } } }
    });

    server.route({
      method: "PUT",
      path: "/listen-key",
      handler: Controller.updateListenKey,
      options: { auth: { access: { scope: ["microservice"] } } }
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
        },
        validate: {
          query: false
        }
      }
    });

    server.route({
      method: "GET",
      path: "/{id}",
      handler: Controller.getAccountById,
      options: {
        auth: {
          access: {
            scope: ["admin"]
          }
        },
        validate: {
          query: false
        }
      }
    });

    server.route({
      method: "POST",
      path: "/bnb-to-usdt",
      handler: Controller.bnbToUsdt,
      options: { auth: { access: { scope: ["microservice"] } } }
    });
  }
};
