import React from "react";
import Box from "@crypto-signals/components/Box";

const Contact = () => {
  return (
    <Box style={{ minHeight: "160px" }}>
      <div className="content is-normal">
        <h3>Contact</h3>
        <p>
          If you have any feedback, suggestions or bug reports feel free to
          contact me at{" "}
          <a href="mailto:jjscryptosignals@protonmail.com">
            jjscryptosignals@protonmail.com
          </a>
        </p>
      </div>
    </Box>
  );
};

export default Contact;
