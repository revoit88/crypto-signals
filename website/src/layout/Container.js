import React from "react";

const Container = ({ children, className, ...props }) => {
  return (
    <div
      className={["container"]
        .concat(className || "")
        .join(" ")
        .trim()}
      {...props}>
      {children}
    </div>
  );
};

export default Container;
