const joi = require("joi");
const Controller = require("./controller");

module.exports = {
  name: "reports routes",
  version: "1.0.0",
  register: function (server, options) {
    // generate last month report
    server.route({
      method: "POST",
      path: "/generate",
      handler: Controller.create,
      options: { auth: { access: { scope: ["microservice"] } } }
    });

    server.route({
      method: "GET",
      path: "/{id}/signals",
      handler: Controller.getReportPositions,
      options: {
        auth: { access: { scope: ["website"] } },
        validate: { params: { id: joi.string().hex().length(24).required() } }
      }
    });

    server.route({
      method: "GET",
      path: "/",
      handler: Controller.getReports,
      options: { auth: { access: { scope: ["website"] } } }
    });
  }
};
