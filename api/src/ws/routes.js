const Controller = require("./controller");

module.exports = {
  name: "WebSockets routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "GET",
      path: "/clients",
      handler: Controller.getClientsCount,
      options: { auth: { scope: ["admin"] } }
    });
  }
};
