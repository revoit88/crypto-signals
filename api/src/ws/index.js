"use strict";
const { WebSocketServer, OPEN } = require("ws");

function heartbeat() {
  this.isAlive = true;
}

module.exports = {
  name: "wss",
  version: "1.0.0",
  register: async function (server, options) {
    try {
      const wss = new WebSocketServer({ server: server.listener });

      wss.on("connection", socket => {
        socket.isAlive = true;
        socket.on("pong", heartbeat);
      });

      const interval = setInterval(() => {
        wss.clients.forEach(client => {
          if (!client.isAlive) return client.terminate();
          client.isAlive = false;
          client.ping();
        });
      }, 30000);

      wss.on("close", () => {
        clearInterval(interval);
      });

      const broadcast = message => {
        wss.clients.forEach(client => {
          if (client.readyState === OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      };

      console.log("wss started");
      server.expose("broadcast", broadcast);
    } catch (error) {
      throw error;
    }
  }
};
