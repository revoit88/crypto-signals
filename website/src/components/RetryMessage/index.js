import React from "react";

const RetryMessage = ({ retry, message }) => {
  return (
    <div className="retry-message">
      <p>
        {message || "There was an error loading the data"}.{" "}
        <span onClick={retry}>Click here to retry.</span>
      </p>
    </div>
  );
};

export default RetryMessage;
