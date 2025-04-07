// [client/src/assets/icons/KinopoiskIcon.jsx]
import React from 'react';

// Простая иконка-заглушка для Кинопоиска (можно заменить на более точную SVG)
const KinopoiskIcon = ({ className = "", size = 16, style = {} }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24" // Стандартный viewBox
        width={size}
        height={size}
        fill="currentColor" // Используем текущий цвет текста
        className={className}
        style={style}
        aria-hidden="true"
    >
        {/* Простой прямоугольник с буквой K */}
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#FF6600" /> {/* Оранжевый фон */}
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#FFFFFF" // Белый цвет буквы
        >
            K
        </text>
    </svg>
);

export default KinopoiskIcon;