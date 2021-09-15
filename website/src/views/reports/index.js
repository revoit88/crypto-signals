import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Box from "../../components/Box";
import Row from "../../layout/Row";
import Column from "../../layout/Column";
import useHttp from "../../hooks/useHttp";
import { monthNames } from "../../utils";
import ReportsTable from "./ReportsTable";

const getColor = value => (value > 0 ? "has-text-success" : "has-text-danger");
const getReportValue = report => `${report.month}_${report.year}`;
const getReportName = report =>
  `${monthNames[report.month - 1]} ${report.year}`;
const findReport = (reports = [], selected = "") =>
  reports.find(r => `${r.month}_${r.year}` === selected);

const Reports = () => {
  const history = useHistory();
  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);
  const selectedReportFromParams = queryParameters.get("report") ?? "";
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
  // const {
  //   isLoading: loadingPairs,
  //   hasError: errorLoadingPairs,
  //   data: pairs,
  //   get: getMarketPairs
  // } = useHttp();

  useEffect(() => {
    const getAllReports = async () => {
      await getReports("/reports");
    };

    getAllReports();
  }, [getReports]);

  // useEffect(() => {
  //   const getPairs = async () => await getMarketPairs(`/markets/active`);
  //   getPairs();
  // }, [getMarketPairs]);

  const onSelect = (parameter, event) => {
    queryParameters.set(parameter, event.target.value);
    history.replace(`${location.pathname}?${queryParameters.toString()}`);
  };

  const getPositions = useCallback(async () => {
    const report = reports.find(
      r => `${r.month}_${r.year}` === selectedReportFromParams
    );
    if (report) {
      await getReportPositions(`/reports/${report._id}/signals`);
    }
  }, [reports, selectedReportFromParams, getReportPositions]);

  useEffect(() => {
    if (!!selectedReportFromParams && !!reports) {
      getPositions();
    }
  }, [selectedReportFromParams, reports, getPositions]);

  const selectedReport = findReport(reports, selectedReportFromParams);

  return (
    <Box>
      <div className="content is-normal">
        <h3>Results</h3>

        <div className="field">
          <label className="label">Reports</label>
          <div className="select">
            <select
              onChange={onSelect.bind(null, "report")}
              value={selectedReportFromParams}>
              <option value="" disabled>
                Select report
              </option>
              {(reports ?? []).map(report => (
                <option
                  value={getReportValue(report)}
                  key={getReportValue(report)}>
                  {getReportName(report)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedReport && (
          <div className="content">
            <h1 className="is-size-4">
              {monthNames[selectedReport.month - 1]} {selectedReport.year}
            </h1>

            <Row>
              <Column className="has-text-centered">
                <p className="heading">Closed Trades</p>
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
                  className={`title ${getColor(
                    selectedReport.average_change
                  )} `}>
                  {" "}
                  {selectedReport.average_change}%
                </p>
              </Column>
            </Row>
          </div>
        )}
        <div className="content">
          <ReportsTable positions={reportPositions} />
        </div>
      </div>
    </Box>
  );
};

export default Reports;
