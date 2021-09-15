import React from "react";
import Box from "../../components/Box";
import Column from "../../layout/Column";
import Row from "../../layout/Row";
import { monthNames } from "../../utils";
import { Link } from "react-router-dom";
import Button from "@crypto-signals/components/Button";

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
          <p className="heading">Closed Trades</p>
          <p className="title"> {report.total_trades}</p>
        </Column>
        <Column className="has-text-centered">
          <p className="heading">Winning Trades</p>
          <p className="title"> {report.total_wins}</p>
        </Column>
        <Column className="has-text-centered">
          <p className="heading"> Average Profit</p>
          <p className={`title ${getColor(report.average_change)}`}>
            {report.average_change}%
          </p>
        </Column>
        {showLink ? (
          <Column className="has-text-centered is-align-self-center">
            <Link to={`/results?report=${report.month}_${report.year}`}>
              <Button text="Details" className="is-link" />
            </Link>
          </Column>
        ) : null}
      </Row>
    </Box>
  );
};

export default ReportBox;
