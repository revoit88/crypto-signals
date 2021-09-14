import Tooltip from "@crypto-signals/components/Tooltip";

const getClassName = (position, name) =>
  (position || {})[name] > 0 ? "has-text-success" : "has-text-danger";

const renderPrice = v => `₿${v}`;

const columns = [
  { name: "symbol", label: "Pair" },
  {
    name: "open_time",
    label: "Buy Date",
    render: v => (
      <Tooltip text={new Date(v).toUTCString()}>
        {new Date(v).toLocaleString({}, { hour12: false })}
      </Tooltip>
    )
  },
  { name: "buy_price", label: "Buy Price", render: renderPrice },
  {
    name: "close_time",
    label: "Sell Date",
    render: v => (
      <Tooltip text={new Date(v).toUTCString()}>
        {new Date(v).toLocaleString({}, { hour12: false })}
      </Tooltip>
    )
  },
  { name: "sell_price", label: "Sell Price", render: renderPrice },
  {
    name: "change",
    label: "Estimated Profit",
    render: v => `${v}%`,
    className: getClassName
  }
];

export default columns;
