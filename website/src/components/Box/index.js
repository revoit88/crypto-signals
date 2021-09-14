import React from "react";

const Box = ({ children, className, ...props }) => {
  return (
    <div className={`box ${className ? className : ""}`} {...props}>
      {children}
    </div>
  );
};

export default Box;
