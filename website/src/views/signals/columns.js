import Tooltip from "@crypto-signals/components/Tooltip";

const getClassName = (signal, name) =>
  (signal || {})[name] > 0 ? "has-text-success" : "has-text-danger";

const renderPriceChange = v => `${v}%`;

const columns = [
  { name: "symbol", label: "Pair" },
  {
    name: "close_time",
    label: "Date",
    render: v => (
      <Tooltip text={new Date(v).toUTCString()}>
        {new Date(v).toLocaleString({}, { hour12: false })}
      </Tooltip>
    )
  },
  { name: "price", label: "Price", render: v => `$${v}` },
  {
    name: "high1d",
    label: "24h High",
    className: getClassName,
    render: renderPriceChange
  },
  {
    name: "high3d",
    label: "3d High",
    className: getClassName,
    render: renderPriceChange
  },
  {
    name: "high7d",
    label: "7d High",
    className: getClassName,
    render: renderPriceChange
  },
  {
    name: "low1d",
    label: "24h Low",
    className: getClassName,
    render: renderPriceChange
  },
  {
    name: "low3d",
    label: "3d Low",
    className: getClassName,
    render: renderPriceChange
  },
  {
    name: "low7d",
    label: "7d Low",
    className: getClassName,
    render: renderPriceChange
  }
];

export default columns;
