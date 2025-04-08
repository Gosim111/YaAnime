// [client/src/assets/icons/ListPlusIcon.jsx]
import React from 'react';

const ListPlusIcon = ({ size = 20, className = "", strokeWidth = 1.5 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
        />
        {/* Добавляем плюс */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3.75m-1.875 0h3.75" />

    </svg>
);

export default ListPlusIcon;