"use strict";

const Boom = require("@hapi/boom");
const Iron = require("@hapi/iron");
const { iron_secret, environment } = require("../../config");

module.exports = {
  name: "authScheme",
  register: async function (server, options) {
    const requestScheme = server => {
      return {
        authenticate: async (request, h) => {
          if (environment === "development") {
            return h.authenticated({
              credentials: {
                scope: [
                  "admin",
                  "website",
                  "observer",
                  "backtest",
                  "microservice"
                ]
              }
            });
          }
          let token = null;
          let payload = null;
          let auth = request.raw.req.headers.authorization || null;
          if (!auth) {
            return Boom.unauthorized();
          }
          if (!/^Bearer /.test(auth)) {
            return Boom.unauthorized();
          }

          try {
            token = auth.slice(7);
          } catch (error) {
            return Boom.unauthorized();
          }
          try {
            payload = await Iron.unseal(token, iron_secret, Iron.defaults);
          } catch (error) {
            return Boom.unauthorized();
          }

          return h.authenticated({ credentials: { scope: [payload.sub] } });
        } //authenticate
      }; //return
    }; //const requestScheme

    await server.auth.scheme("requestScheme", requestScheme);
    await server.auth.strategy("requestAuth", "requestScheme");
    await server.auth.default({ strategy: "requestAuth" });
  }
};
