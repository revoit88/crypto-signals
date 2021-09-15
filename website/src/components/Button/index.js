import React from "react";

const Button = ({ text, className, ...props }) => {
  return (
    <button className={["button", className || []].join(" ")} {...props}>
      {text}
    </button>
  );
};

export default Button;
