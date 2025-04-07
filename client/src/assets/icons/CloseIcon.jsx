// [client/src/assets/icons/CloseIcon.jsx]

import React from 'react';

const CloseIcon = ({ className = "", size = 20, strokeWidth = 1.5, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        width={size}
        height={size}
        className={className}
        style={style}
        aria-hidden="true"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default CloseIcon;