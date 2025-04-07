// [client/src/App.jsx]

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import AnimeDetailPage from './pages/AnimeDetailPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
// import { AuthProvider } from '/src/context/AuthContext.jsx'; // Убедимся, что закомментирован или удален

// Компонент 404 (если нужен)
// const NotFoundPage = () => <div style={{textAlign: 'center', padding: 'var(--spacing-16)'}}>404 - Страница не найдена</div>;

function App() {
    // console.log("App component rendered"); // Лог для отладки рендеринга
    return (
        // <AuthProvider> // Убедимся, что закомментирован или удален
        <Layout>
            <Routes>
                {/* Основные страницы */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                {/* Используем ID Kodik или Shikimori/KP ID */}
                <Route path="/anime/:animeId" element={<AnimeDetailPage />} />
                {/* Можно оставить slug опциональным, если Kodik API его возвращает */}
                <Route path="/anime/:animeId/:slug" element={<AnimeDetailPage />} />

                {/* Заглушки для функционала в разработке */}
                <Route path="/login" element={<ComingSoonPage />} />
                <Route path="/register" element={<ComingSoonPage />} />
                <Route path="/profile/:tagPart" element={<ComingSoonPage />} />
                <Route path="/settings" element={<ComingSoonPage />} />
                <Route path="/forum" element={<ComingSoonPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/feed" element={<ComingSoonPage />} />

                {/* Страница не найдена - перенаправляем на главную */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
        // </AuthProvider> // Убедимся, что закомментирован или удален
    );
}

export default App;