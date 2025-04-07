// [client/src/assets/icons/ClockIcon.jsx]

import React from 'react';

// Иконка часов (из Heroicons)
const ClockIcon = ({ className = "", size = 24, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24" // Исправлен viewBox на 24x24
        strokeWidth={1.5}
        stroke="currentColor"
        fill="none"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
        style={style}
    >
        {/* Исправлен path для viewBox 24x24 */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default ClockIcon;