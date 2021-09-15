import React from "react";

const Select = ({ label, items = [], ...props }) => {
  return (
    <div className="field">
      {label && <label className="label">{label}</label>}
      <div className="control">
        <div className="select is-fullwidth">
          <select {...props}>
            {items.map(item => (
              <option value={item.value} key={`select-item-${item.value}`}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Select;
