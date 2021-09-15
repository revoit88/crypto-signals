import React from "react";

const SHOW_FOOTER_THRESHOLD = 5;

function Table({ columns = [], data = [] }) {
  return (
    <div className="table-container">
      <table
        className={[
          "table",
          "is-fullwidth",
          "is-hoverable",
          "table-border-top"
        ].join(" ")}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`table-head-${index}`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`table-body-row-${rowIndex}`}>
              {columns.map((column, columnIndex) => (
                <td
                  key={`table-body-row-${rowIndex}-column-${columnIndex}`}
                  {...{
                    ...(column.className && {
                      className: column.className(row, column.name)
                    })
                  }}>
                  {!!column.render && typeof column.render === "function"
                    ? column.render(row[column.name])
                    : row[column.name]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {data.length > SHOW_FOOTER_THRESHOLD && (
          <tfoot>
            <tr>
              {columns.map((column, index) => (
                <th key={`table-footer-${index}`}>{column.label}</th>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default Table;
