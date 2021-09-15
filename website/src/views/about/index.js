import React from "react";
import Box from "@crypto-signals/components/Box";

const About = () => {
  return (
    <Box>
      <div className="content is-normal">
        <h3>About</h3>
        <p>
          The strategy used is entirely algorithm driven, it is connected
          directly to Binance Markets data. I do not interfere in anything
          whatsoever, the bot takes all the decisions.
        </p>
        <p>
          The strategy is a "Bullish Trend Following" strategy, this means it
          will scan the markets and look for pairs with strong upside potential
          and trigger an entry signal when all the indicators used confirm the
          uptrend. Once an entry signal has been sent, no more signals will be
          sent for the remainder of the trend, so make sure you catch the wave
          at the right price before the trend ends.
        </p>
        <p>
          This is a low frequency strategy, it trades once per trend, and the
          trade can last from weeks to months.
        </p>
        <p>
          The strategy will try to avoid trading during pump &amp; dump
          scenarios, however this is not 100% guaranteed.
        </p>
      </div>
    </Box>
  );
};

export default About;
