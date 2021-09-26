const Controller = require("./controller");

module.exports = {
  name: "orders routes",
  version: "1.0.0",
  register: function (server, options) {
    server.subscription("/orders");

    server.route({
      method: "GET",
      path: "/{clientOrderId}",
      handler: Controller.getOrderById,
      options: { auth: { access: { scope: ["microservice"] } } }
    });

    server.route({
      method: "GET",
      path: "/",
      handler: Controller.getOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "POST",
      path: "/",
      handler: Controller.createOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "PATCH",
      path: "/",
      handler: Controller.updateOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "DELETE",
      path: "/",
      handler: Controller.cancelOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "POST",
      path: "/tsl",
      handler: Controller.createTrailingStopLossOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "PATCH",
      path: "/tsl",
      handler: Controller.updateTrailingStopLossOrder,
      options: { auth: { access: { scope: ["observer"] } } }
    });

    server.route({
      method: "POST",
      path: "/broadcast",
      handler: Controller.broadcast,
      options: {
        auth: {
          access: {
            scope: ["microservice"]
          }
        },
        validate: { query: false }
      }
    });
  }
};
