import React, { useEffect, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Box from "../../components/Box";
import Row from "../../layout/Row";
import Column from "../../layout/Column";
import useHttp from "../../hooks/useHttp";
import { monthNames } from "../../utils";
import ReportsTable from "./ReportsTable";
import Loading from "@crypto-signals/components/Loading";
import RetryMessage from "@crypto-signals/components/RetryMessage";

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
  // const selectedPair = queryParameters.get("pair") ?? "";
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
    get: getReportPositions
  } = useHttp();

  const getAllReports = useCallback(async () => {
    await getReports("/reports");
  }, [getReports]);

  useEffect(() => {
    getAllReports();
  }, [getAllReports]);

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

        {!loadingReports && errorLoadingReports ? (
          <RetryMessage retry={getAllReports} />
        ) : (
          <div className="field is-horizontal">
            <label className="field-label is-normal">Available Reports</label>
            <div className="field-body">
              <div className="field is-narrow">
                <div className="control">
                  <div
                    className={"select is-fullwidth".concat(
                      loadingReports ? " is-loading" : ""
                    )}>
                    <select
                      onChange={onSelect.bind(null, "report")}
                      value={selectedReportFromParams}
                      disabled={loadingReports}>
                      <option value="" disabled>
                        {loadingReports
                          ? "Loading reports..."
                          : "Select Report"}
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
              </div>
            </div>
          </div>
        )}

        {selectedReport && (
          <div className="content">
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
          {loadingReportPositions && <Loading />}
          {!loadingReportPositions && errorLoadingReportPositions && (
            <RetryMessage retry={getPositions} />
          )}
          {!loadingReportPositions &&
            !errorLoadingReportPositions &&
            reportPositions && <ReportsTable positions={reportPositions} />}
        </div>
      </div>
    </Box>
  );
};

export default Reports;
