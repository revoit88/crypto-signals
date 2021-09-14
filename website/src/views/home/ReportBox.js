import React from "react";
import Box from "../../components/Box";
import Column from "../../layout/Column";
import Row from "../../layout/Row";
import { monthNames } from "../../utils";

const ReportBox = ({ report, showLink }) => {
  const getColor = value =>
    value > 0 ? "has-text-success" : "has-text-danger";

  return (
    <Box>
      <h1 className="is-size-4">
        {monthNames[report.month - 1]} {report.year}
      </h1>

      <Row>
        <Column className="has-text-centered">
          <p className="heading">Trades</p>
          <p className="title"> {report.total_trades}</p>
        </Column>
        <Column className="has-text-centered">
          <p className="heading">Winning Trades</p>
          <p className="title"> {report.total_wins}</p>
        </Column>
        <Column className="has-text-centered">
          <p className="heading"> Average Profit</p>
          <p className={`title ${getColor(report.average_change)} `}>
            {" "}
            {report.average_change}%
          </p>
        </Column>
        {showLink ? (
          <Column className="has-text-centered">Details</Column>
        ) : null}
      </Row>
    </Box>
  );
};

export default ReportBox;
