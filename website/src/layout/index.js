import React from "react";
import Header from "./Header";
// import Footer from "./Footer";
import Container from "./Container";
import Column from "./Column";
import Row from "./Row";

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <div className="container main-content">{children}</div>
      {/* <Footer /> */}
    </>
  );
};

export default Layout;

export { Column, Row, Container };
