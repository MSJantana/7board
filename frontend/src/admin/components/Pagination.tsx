import './Pagination.css';

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: Readonly<{
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}>) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  if (totalItems === 0) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} resultados
      </div>
      <div className="pagination-controls">
        <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} type="button">
          <span className="material-icons" aria-hidden="true">
            chevron_left
          </span>
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let startPage = Math.max(1, currentPage - 2);
          const endPage = Math.min(totalPages, startPage + 4);
          if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
          }

          const pageNum = startPage + i;
          if (pageNum > totalPages) return null;

          return (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
              type="button"
            >
              {pageNum}
            </button>
          );
        })}

        <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} type="button">
          <span className="material-icons" aria-hidden="true">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}

