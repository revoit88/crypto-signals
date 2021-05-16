const Hapi = require("@hapi/hapi");
const config = require("./config");
const { createWriteStream } = require("pino-http-send");

const init = async () => {
  const server = Hapi.server({
    port: config.port,
    host: config.host,
    routes: {
      cors: { additionalExposedHeaders: ["x-total-count"] }
    }
  });
  const stream = createWriteStream({
    url: `${config.api_url}/logs`,
    method: "POST",
    log: true
  });
  server.validator(require("joi"));
  await server.register([
    {
      plugin: require("hapi-pino"),
      options: {
        prettyPrint: process.env.NODE_ENV !== "production",
        // Redact Authorization headers, see https://getpino.io/#/docs/redaction
        redact: ["req.headers.authorization"],
        logPayload: true,
        logQueryParams: true,
        stream
      }
    },
    require("./src/auth"),
    {
      plugin: require("./db"),
      options: {
        db_uri: config.db_uri
      }
    },
    {
      plugin: require("./src/order/routes"),
      routes: { prefix: "/order" }
    }
  ]);

  await server.start();
  console.log(`Server running on port ${config.port}`);
};

init();
