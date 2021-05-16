const Controller = require("./controller");

module.exports = {
  name: "logs routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "POST",
      path: "/",
      handler: Controller.saveLog,
      options: { auth: false }
    });
  }
};
