const { exchange, symbol, interval } = require("@crypto-signals/config");
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
