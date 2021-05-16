const Controller = require("./controller");

module.exports = {
  name: "orders routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "GET",
      path: "/",
      handler: Controller.getOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "POST",
      path: "/",
      handler: Controller.createOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "PATCH",
      path: "/",
      handler: Controller.updateOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "DELETE",
      path: "/",
      handler: Controller.cancelBuyOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "POST",
      path: "/market",
      handler: Controller.createMarketOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });

    server.route({
      method: "POST",
      path: "/market/buy",
      handler: Controller.createMarketBuyOrder,
      options: { auth: { access: { scope: ["observer", "microservice"] } } }
    });
  }
};
