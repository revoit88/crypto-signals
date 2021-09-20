const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
module.exports = {
  db_uri: process.env.DB_URI,
  email_from: process.env.MAILER_FROM,
  email_to: process.env.MAILER_TO,
  mailer_host: process.env.MAILER_HOST,
  mailer_password: process.env.MAILER_PASSWORD,
  mailer_user: process.env.MAILER_USER,
  port: process.env.WITHDRAW_PORT || 3000,
  //=======================
  reserved_amount: +process.env.RESERVED_AMOUNT,
  btc_addresses: process.env.BTC_ADDRESS.split(","),
  eth_address: process.env.ETH_ADDRESS
};
