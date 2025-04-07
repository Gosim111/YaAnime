// [client/src/assets/icons/MenuIcon.jsx]
import React from 'react';

const MenuIcon = ({ className = "", size = 24, strokeWidth = 1.5, style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" width={size} height={size} className={className} style={style} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export default MenuIcon;