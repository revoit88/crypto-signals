import React, { useEffect, useCallback } from "react";
import useHttp from "../../hooks/useHttp";
import Block from "@crypto-signals/components/Block";
import Box from "@crypto-signals/components/Box";
import Loading from "@crypto-signals/components/Loading";
import RetryMessage from "@crypto-signals/components/RetryMessage";
import ReportBox from "./ReportBox";

const Home = () => {
  const {
    isLoading: loadingReports,
    data: reports,
    hasError: errorLoadingReports,
    get
  } = useHttp();

  const getReports = useCallback(async () => {
    await get(`/reports?limit=5`);
  }, [get]);

  useEffect(() => {
    getReports();
  }, [getReports]);

  return (
    <>
      <h1
        className="is-size-2 has-text-centered has-text-white"
        style={{ paddingBottom: "1rem" }}>
        Monthly Results
      </h1>
      <Block>
        {loadingReports && <Loading />}
        {!loadingReports && errorLoadingReports && (
          <Box>
            <RetryMessage retry={getReports} />
          </Box>
        )}
        {!loadingReports &&
          !errorLoadingReports &&
          reports &&
          reports.map(report => <ReportBox key={report._id} report={report} />)}
      </Block>
    </>
  );
};

export default Home;
