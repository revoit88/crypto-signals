const { getBinanceInstance, nz } = require("@crypto-signals/utils");

const binance = getBinanceInstance(process.env);

const createListenKey = async () => {
  const { data } = await binance.post("/api/v3/userDataStream");
  return data?.listenKey;
};

async function listenKeyKeepAlive(listenKey) {
  const query = new URLSearchParams({ listenKey }).toString();
  await binance.put(`/api/v3/userDataStream?${query}`);
  return null;
}

async function getAccountBalance(quote_asset) {
  const { data: account } = await binance.get("/api/v3/account");
  const asset = account.balances.find(item => item.asset === quote_asset);
  return +nz(asset?.free);
}

module.exports = {
  binance: { createListenKey, listenKeyKeepAlive, getAccountBalance }
};
