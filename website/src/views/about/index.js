import React from "react";
import Box from "@crypto-signals/components/Box";

const About = () => {
  return (
    <Box>
      <div className="content is-normal">
        <h3>About</h3>
        <p>
          Overall indicators include: Trend, Volume, Volatility, Moving
          Averages. Low frequency strategy. Once an entry signal has been sent,
          no more signals will be sent for the remainder of the trend (unless
          the price plummets and the trend is still bullish).
        </p>
      </div>
    </Box>
  );
};

export default About;
