import React from "react";
import Table from "@crypto-signals/components/Table";
import columns from "./columns";

const ReportsTable = ({ positions }) => {
  if (!positions?.length) {
    return null;
  }
  return <Table columns={columns} data={positions} />;
};

export default ReportsTable;
