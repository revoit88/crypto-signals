import React from "react";

const Column = ({ children, className, ...props }) => (
  <div
    className={["column"]
      .concat(className || "")
      .join(" ")
      .trim()}
    {...props}
  >
    {children}
  </div>
);

export default Column;
