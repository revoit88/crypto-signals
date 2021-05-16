const startDb = require("./config/mongoose");
const Observer = require("./src/observer");

const start = async () => {
  try {
    const db = await startDb();
    await new Observer(db).init();
  } catch (error) {
    console.error(error);
    process.exit();
  }
};

start();
