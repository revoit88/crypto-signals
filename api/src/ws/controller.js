const Boom = require("@hapi/boom");

exports.getClientsCount = async function (request, h) {
  try {
    const count = request.server.plugins.wss.server.clients.size;
    return { client_count: count };
  } catch (error) {
    request.server.logger.error(error);
    return Boom.internal();
  }
};
