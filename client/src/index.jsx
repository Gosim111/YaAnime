import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Импортируем BrowserRouter
import './styles/global.css'; // Импортируем глобальные стили
// client/src/index.jsx
import App from './App.jsx'; // Путь относительный
// import reportWebVitals from './reportWebVitals'; // Можно раскомментировать для измерения производительности

// Получаем корневой элемент из HTML
const rootElement = document.getElementById('root');

// Проверяем, что корневой элемент найден
if (!rootElement) {
    throw new Error("Не найден корневой элемент с id 'root'");
}

// Создаем React root с использованием нового API ReactDOM
const root = ReactDOM.createRoot(rootElement);

// Рендерим приложение внутри StrictMode и BrowserRouter
root.render(
    <React.StrictMode>
        <BrowserRouter> {/* Оборачиваем App в BrowserRouter для работы React Router */}
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

// Если вы хотите начать измерять производительность в вашем приложении, передайте функцию
// для логирования результатов (например: reportWebVitals(console.log))
// или отправьте на эндпоинт аналитики. Узнайте больше: https://bit.ly/CRA-vitals
// reportWebVitals();