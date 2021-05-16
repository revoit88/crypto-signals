const Controller = require("./controller");

module.exports = {
  name: "telegram bot routes",
  version: "1.0.0",
  register: function (server, options) {
    server.route({
      method: "POST",
      path: "/chats",
      handler: Controller.createChat,
      options: {
        auth: options.auth
      }
    });

    server.route({
      method: "DELETE",
      path: "/chats/{chat_id}",
      handler: Controller.deleteChat,
      options: {
        auth: options.auth
      }
    });

    server.route({
      method: "POST",
      path: "/chats/{chat_id}/markets",
      handler: Controller.addMarkets,
      options: {
        auth: options.auth
      }
    });

    server.route({
      method: "DELETE",
      path: "/chats/{chat_id}/markets",
      handler: Controller.deleteMarkets,
      options: {
        auth: options.auth
      }
    });

    server.route({
      method: "GET",
      path: "/chats/{chat_id}/markets",
      handler: Controller.getMarkets,
      options: {
        auth: options.auth
      }
    });

    server.route({
      method: "GET",
      path: "/chats/{chat_id}/markets/available",
      handler: Controller.getAvailableMarkets,
      options: {
        auth: options.auth
      }
    });
  }
};
