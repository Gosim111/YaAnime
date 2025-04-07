// [client/src/assets/icons/TagIcon.jsx]
import React from 'react';

const TagIcon = ({ className = "", size = 20, strokeWidth = 1.5, style = {} }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} stroke="currentColor" width={size} height={size} className={className} style={style} aria-hidden="true" >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.372l2.88-2.88c.827-.5.998-1.588.372-2.607L9.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

export default TagIcon;