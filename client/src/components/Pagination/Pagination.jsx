// [client/src/components/Pagination/Pagination.jsx]

import React from 'react';
import styles from './Pagination.module.css';

// Новая версия компонента Pagination:
// Принимает currentPage, onPageChange и hasNextPage (вместо totalPages)
const Pagination = ({ currentPage, onPageChange, hasNextPage }) => {
    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (hasNextPage) {
            onPageChange(currentPage + 1);
        }
    };

    // Не рендерим пагинацию, если мы на первой странице и нет следующей
    if (currentPage === 1 && !hasNextPage) {
        return null;
    }

    return (
        <nav className={styles.pagination} aria-label="Пагинация">
            <button
                className={`${styles.pageButton} ${styles.arrowButton}`}
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="Предыдущая страница"
            >
                {'<'}
            </button>
            <span className={styles.currentPageDisplay}>
                Стр. {currentPage}
            </span>
            <button
                className={`${styles.pageButton} ${styles.arrowButton}`}
                onClick={handleNext}
                disabled={!hasNextPage}
                aria-label="Следующая страница"
            >
                {'>'}
            </button>
        </nav>
    );
};

export default Pagination;