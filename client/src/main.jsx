// [client/src/main.jsx]

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Не удалось найти корневой элемент с id 'root'");
}

// Убедимся, что StrictMode ОТКЛЮЧЕН для чистоты эксперимента
ReactDOM.createRoot(rootElement).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);