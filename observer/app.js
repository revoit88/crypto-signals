const { exchange, symbol, interval } = require("./config");
const Observer = require(`./src/observer`);

const start = async () => {
  try {
    await new Observer(exchange, symbol, interval).init();
  } catch (error) {
    console.error(error);
    process.exit();
  }
};

start();
