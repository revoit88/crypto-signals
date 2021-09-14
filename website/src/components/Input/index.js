import React from "react";

const Input = ({ label, ...props }) => {
  return (
    <div className="field">
      {label && <label className="label">{label}</label>}
      <div className="control">
        <input className="input" {...props} />
      </div>
    </div>
  );
};

export default Input;
