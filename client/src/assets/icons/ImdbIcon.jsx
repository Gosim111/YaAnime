// [client/src/assets/icons/ImdbIcon.jsx]
import React from 'react';

// Простая иконка-заглушка для IMDb (можно заменить на более точную SVG)
const ImdbIcon = ({ className = "", size = 16, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 32" // Пропорции лого IMDb
        width={size * 2} // Делаем ширину в два раза больше высоты для лого
        height={size}
        fill="currentColor"
        className={className}
        style={style}
        aria-hidden="true"
    >
        {/* Примерный вид лого IMDb */}
        <rect width="64" height="32" rx="4" fill="#F5C518" /> {/* Желтый фон */}
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="#000000" // Черный текст
            fontFamily="Arial, sans-serif" // Примерный шрифт
        >
            IMDb
        </text>
    </svg>
);

export default ImdbIcon;