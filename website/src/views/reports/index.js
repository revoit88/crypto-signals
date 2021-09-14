import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Box from "../../components/Box";
import Row from "../../layout/Row";
import Column from "../../layout/Column";
import useHttp from "../../hooks/useHttp";
import { monthNames } from "../../utils";
import ReportsTable from "./ReportsTable";

const getColor = value => (value > 0 ? "has-text-success" : "has-text-danger");

const Reports = () => {
  const history = useHistory();
  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);
  const selectedYear = queryParameters.get("year") ?? "";
  const selectedMonth = queryParameters.get("month") ?? "";
  const selectedPair = queryParameters.get("pair") ?? "";
  const {
    isLoading: loadingReports,
    hasError: errorLoadingReports,
    data: reports,
    get: getReports
  } = useHttp();
  const {
    isLoading: loadingReportPositions,
    hasError: errorLoadingReportPositions,
    data: reportPositions,
    get: getReportPositions,
    headers: reportPositionsHeaders
  } = useHttp();
  const {
    isLoading: loadingPairs,
    hasError: errorLoadingPairs,
    data: pairs,
    get: getMarketPairs
  } = useHttp();

  useEffect(() => {
    const getAllReports = async () => {
      await getReports("/reports");
    };

    getAllReports();
  }, [getReports]);

  useEffect(() => {
    const getPairs = async () => await getMarketPairs(`/markets/active`);
    getPairs();
  }, [getMarketPairs]);

  const groupedReports = useMemo(
    () =>
      (reports ?? []).reduce((acc, report) => {
        return {
          ...acc,
          [report.year]: { ...acc[report.year], [report.month]: report }
        };
      }, {}),
    [reports]
  );
  const availableYears = [...new Set((reports ?? []).map(r => r.year))];

  const getAvailableMonthsFromYear = useCallback(
    year => {
      if (!year) {
        return [];
      }
      const months = Object.keys(groupedReports[year] ?? {})
        .sort((a, b) => +a - +b)
        .reverse()
        .map(month => [month, monthNames[month - 1]]);
      return months;
    },
    [groupedReports]
  );

  const onSelect = (parameter, event) => {
    queryParameters.set(parameter, event.target.value);
    if (parameter === "year") {
      queryParameters.set("month", "");
    }
    history.replace(`${location.pathname}?${queryParameters.toString()}`);
  };

  const getPositions = useCallback(async () => {
    const report = groupedReports[selectedYear][selectedMonth];
    if (report) {
      await getReportPositions(`/reports/${report._id}/signals`);
    }
  }, [selectedYear, selectedMonth, getReportPositions, groupedReports]);

  useEffect(() => {
    if (!!selectedYear && !!selectedMonth && !!reports) {
      getPositions();
    }
  }, [selectedYear, selectedMonth, reports, getPositions]);

  const selectedReport = ((groupedReports || {})[selectedYear] || {})[
    selectedMonth
  ];

  return (
    <Box>
      Reports
      <div>
        <select onChange={onSelect.bind(null, ["year"])} value={selectedYear}>
          <option>Select Year</option>
          {availableYears.map(year => (
            <option key={"year-" + year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select onChange={onSelect.bind(null, "month")} value={selectedMonth}>
          <option>Select Month</option>
          {getAvailableMonthsFromYear(selectedYear).map(
            ([month, monthName]) => (
              <option key={"month-" + month} value={month}>
                {monthName}
              </option>
            )
          )}
        </select>
      </div>
      {selectedReport && (
        <div>
          <h1 className="is-size-4">
            {monthNames[selectedReport.month - 1]} {selectedReport.year}
          </h1>

          <Row>
            <Column className="has-text-centered">
              <p className="heading">Trades</p>
              <p className="title"> {selectedReport.total_trades}</p>
            </Column>
            <Column className="has-text-centered">
              <p className="heading">Winning Trades</p>
              <p className="title">
                {" "}
                {selectedReport.total_wins} (
                {Number(
                  (selectedReport.total_wins * 100) /
                    selectedReport.total_trades
                ).toFixed(1)}
                %)
              </p>
            </Column>
            <Column className="has-text-centered">
              <p className="heading"> Average Profit</p>
              <p
                className={`title ${getColor(selectedReport.average_change)} `}>
                {" "}
                {selectedReport.average_change}%
              </p>
            </Column>
          </Row>
        </div>
      )}
      <div>
        <ReportsTable positions={reportPositions} />
      </div>
    </Box>
  );
};

export default Reports;
