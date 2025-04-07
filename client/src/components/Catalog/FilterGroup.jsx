// [client/src/components/Catalog/FilterGroup.jsx]
import React, { useState } from 'react';
import styles from './FilterSidebar.module.css'; // Используем стили сайдбара

// Иконка шеврона (стрелка вниз/вверх)
const ChevronDownIcon = ({ size = 16, strokeWidth = 2 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" width={size} height={size}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const FilterGroup = ({ title, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className={`${styles.filterGroup} ${isOpen ? styles.open : ''}`}>
            <button className={styles.groupHeader} onClick={toggleOpen} aria-expanded={isOpen}>
                <h4 className={styles.groupTitle}>{title}</h4>
                <ChevronDownIcon size={14} strokeWidth={3} />
            </button>
            <div className={styles.groupContent}>
                {children}
            </div>
        </div>
    );
};

export default FilterGroup;