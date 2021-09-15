import React from "react";

const Pagination = ({ onClickPage, currentPage, totalItems, itemsPerPage }) => {
  if (!totalItems) {
    return null;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages + 1;
  }

  const validatePage = page => {
    if (page < 1) {
      return 1;
    }
    if (page > totalPages) {
      return totalPages;
    }
    return page;
  };
  const renderEllipsis = side => {
    if (side === "left" && currentPage - 2 > 1) {
      return [`ellipsis-${side}`];
    }
    if (side === "right" && currentPage + 2 < totalPages) {
      return [`ellipsis-${side}`];
    }
    return [];
  };

  const pages = [
    ...new Set([
      1,
      ...renderEllipsis("left"),
      validatePage(currentPage - 1),
      currentPage,
      validatePage(currentPage + 1),
      ...renderEllipsis("right"),
      totalPages
    ])
  ];
  const isEllipsis = page => String(page).includes("ellipsis");

  return (
    <nav
      className="pagination is-centered"
      role="navigation"
      aria-label="pagination">
      <button
        className="pagination-previous pagination-button"
        disabled={currentPage <= 1}
        onClick={() => onClickPage(currentPage - 1)}>
        Previous
      </button>
      <button
        className="pagination-next pagination-button"
        disabled={currentPage >= totalPages}
        onClick={() => onClickPage(currentPage + 1)}>
        Next page
      </button>
      <ul className="pagination-list">
        {pages.map(page =>
          isEllipsis(page) ? (
            <li key={`page-${page}`}>
              <span className="pagination-ellipsis">&hellip;</span>
            </li>
          ) : (
            <li key={`page-${page}`}>
              <button
                className={[
                  "pagination-link",
                  "pagination-button",
                  ...(currentPage === page ? ["is-current"] : [])
                ].join(" ")}
                aria-label={`${
                  currentPage === page ? "" : "Go to "
                }Page ${page}`}
                {...(currentPage === page ? { "aria-current": "page" } : {})}
                onClick={() =>
                  currentPage !== page ? onClickPage(page) : null
                }>
                {page > totalPages ? totalPages + 1 : page}
              </button>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
