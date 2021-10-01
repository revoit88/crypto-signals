const Controller = require("./controller");

module.exports = {
  name: "account routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "POST",
      path: "/dca",
      handler: Controller.dca,
      options: { auth: { access: { scope: ["microservice"] } } }
    });
  }
};
