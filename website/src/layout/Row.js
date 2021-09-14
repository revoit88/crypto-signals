import React from "react";

const Row = ({ children, centered, className, ...props }) => (
  <div
    className={["columns"]
      .concat(centered ? ["is-centered"] : [])
      .concat(className || "")
      .join(" ")
      .trim()}
    {...props}
  >
    {children}
  </div>
);

export default Row;
