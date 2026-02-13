import React from 'react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  if (totalItems === 0) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} resultados
      </div>
      <div className="pagination-controls">
        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <span className="material-icons">chevron_left</span>
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
            >
              {pageNum}
            </button>
          );
        })}

        <button 
          className="pagination-btn" 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
