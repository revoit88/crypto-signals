const app = require("express")();
const qs = require("querystring");
const mongoose = require("mongoose");
const {
  reserved_amount,
  btc_address,
  eth_address,
  port,
  db_uri
} = require("@crypto-signals/config");
const { nz } = require("@crypto-signals/utils");
const { binance, api } = require("./axios");
const { sendMail } = require("./mailer");

app.use(async (req, res, next) => {
  const connection = await mongoose
    .createConnection(db_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .asPromise();
  require("./src/position/model")(connection);
  req.app.mongoose = connection;
  next();
});

app.post("/withdraw-btc", async (req, res) => {
  try {
    console.log(`=== Withdrawing BTC @ ${new Date().toUTCString()} ===`);

    const PositionModel = req.app.mongoose.model("Position");
    const accountPromise = binance.get("/api/v3/account");
    const btcStatusPromise = binance.get(
      "/sapi/v1/asset/assetDetail?asset=BTC"
    );

    const { data: account } = await accountPromise;
    const { data: btc_status } = await btcStatusPromise;

    const positions = await PositionModel.find(
      { $and: [{ status: "open" }, { buy_order: { $exists: true } }] },
      { "buy_order.cummulativeQuoteQty": 1 }
    );

    const totalBTCInPositions = positions.reduce((acc, position) => {
      return acc + nz(+position.buy_order.cummulativeQuoteQty);
    }, 0);

    const [btc] = account.balances.filter(item => item.asset === "BTC");
    const free_btc = +btc.free;
    const total_btc = free_btc + totalBTCInPositions;

    const withdraw_fee = +btc_status.BTC.withdrawFee;
    const minimum_amount_to_withdraw = +btc_status.BTC.minWithdrawAmount;

    const amount_to_withdraw =
      req.query.amount ??
      +Number(total_btc - (reserved_amount + withdraw_fee)).toFixed(8);

    if (
      amount_to_withdraw > minimum_amount_to_withdraw &&
      amount_to_withdraw > withdraw_fee * 10 &&
      amount_to_withdraw <= free_btc
    ) {
      const withdrawQuery = qs.stringify({
        coin: "BTC",
        network: "BTC",
        address: btc_address,
        amount: amount_to_withdraw
      });

      const { data: withdrawResult } = await binance.post(
        `/sapi/v1/capital/withdraw/apply?${withdrawQuery}`
      );

      console.log("withdrawResult: ", withdrawResult);
      // if (!withdrawResult.success) {
      //   console.error(withdrawResult.msg);
      //   return res.status(500).send(withdrawResult);
      // }
    }

    const getMessage = amount => {
      if (amount < 0) {
        return "Unable to withdraw. Not enough balance.";
      }
      if (amount < withdraw_fee * 10) {
        return "Unable to withdraw. The amount is too low.";
      }
      if (amount > free_btc) {
        return "Insufficient balance available";
      }
      return `Withdrawal successfull.\nAmount: ${amount} BTC.`;
    };

    console.log(getMessage(amount_to_withdraw));
    // await sendMail(getMessage(amount_to_withdraw));
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
});

app.post("/withdraw-eth", async (req, res) => {
  try {
    console.log(`=== Withdrawing ETH @ ${new Date().toUTCString()} ===`);

    if (!eth_address) {
      throw new Error("The ETH address is not defined.");
    }

    if (!req.query.amount) {
      throw new Error("The amount to withdraw is not defined.");
    }

    const accountPromise = binance.get("/api/v3/account");
    const ethStatusPromise = binance.get(
      "/sapi/v1/asset/assetDetail?asset=ETH"
    );

    const { data: account } = await accountPromise;
    const { data: eth_status } = await ethStatusPromise;

    const [eth] = account.balances.filter(item => item.asset === "ETH");
    const free_eth = +eth.free;

    const withdraw_fee = +eth_status.ETH.withdrawFee;
    const minimum_amount_to_withdraw = +eth_status.ETH.minWithdrawAmount;

    const amount_to_withdraw = +req.query.amount;

    if (
      amount_to_withdraw <= free_eth &&
      amount_to_withdraw > minimum_amount_to_withdraw &&
      amount_to_withdraw > withdraw_fee
    ) {
      const withdrawQuery = qs.stringify({
        coin: "ETH",
        network: "ETH",
        address: eth_address,
        amount: amount_to_withdraw
      });

      const { data: withdrawResult } = await binance.post(
        `/sapi/v1/capital/withdraw/apply?${withdrawQuery}`
      );

      console.log("withdrawResult: ", withdrawResult);
      // if (!withdrawResult.success) {
      //   console.error(withdrawResult.msg);
      //   return res.status(500).send(withdrawResult);
      // }
    }

    const getMessage = amount => {
      if (amount < 0) {
        return "Unable to withdraw. Not enough balance.";
      }
      if (amount < withdraw_fee * 10) {
        return "Unable to withdraw. The amount is too low.";
      }
      return `Withdrawal successfull.\nAmount: ${amount} ETH.`;
    };

    await sendMail(getMessage(amount_to_withdraw));
    return res.send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
