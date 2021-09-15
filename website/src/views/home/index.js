import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import useHttp from "../../hooks/useHttp";
import Block from "@crypto-signals/components/Block";
import Box from "@crypto-signals/components/Box";
import Loading from "@crypto-signals/components/Loading";
import RetryMessage from "@crypto-signals/components/RetryMessage";
import Button from "@crypto-signals/components/Button";
import { Row, Column } from "@crypto-signals/layout";
import ReportBox from "./ReportBox";
import Modal from "./Modal";

const Home = () => {
  const [showModal, setShowModal] = useState(false);
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

  function toggleModal(value) {
    setShowModal(prevState =>
      typeof value === "boolean" ? value : !prevState
    );
  }

  return (
    <>
      {showModal &&
        ReactDOM.createPortal(
          <Modal show closeModal={toggleModal.bind(null, false)} />,
          document.getElementById("modal-root")
        )}
      <section className="hero is-large is-primary">
        <div className="hero-body">
          <Row>
            <Column>
              <p className="title">JJ's Crypto Signals</p>
              <p className="subtitle">Algorithm Driven Signals</p>
            </Column>
            <Column className="is-align-self-center has-text-centered">
              <Button
                text="Join Free"
                className="is-large"
                onClick={toggleModal}
              />
            </Column>
          </Row>
        </div>
      </section>
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
          reports.map(report => (
            <ReportBox key={report._id} report={report} showLink />
          ))}
      </Block>
    </>
  );
};

export default Home;
