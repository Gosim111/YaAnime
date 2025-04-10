// [client/src/App.jsx] - ПРОВЕРЕННЫЙ ВАРИАНТ

import React from 'react';
import { Analytics } from "@vercel/analytics/react"
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import AnimeDetailPage from './pages/AnimeDetailPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx'; // Страница-заглушка

function App() {
    return (
        <Layout>
            <Routes>
                {/* Основные рабочие маршруты */}
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/anime/:animeId" element={<AnimeDetailPage />} />
                {/* Оставляем возможность для slug, если понадобится */}
                <Route path="/anime/:animeId/:slug" element={<AnimeDetailPage />} />

                {/* Маршруты-заглушки */}
                <Route path="/login" element={<ComingSoonPage title="Вход" />} />
                <Route path="/register" element={<ComingSoonPage title="Регистрация" />} />
                {/* :tagPart может быть любым, поэтому /profile/list не нужен отдельно */}
                <Route path="/profile/:tagPart/*" element={<ComingSoonPage title="Профиль" />} />
                <Route path="/settings" element={<ComingSoonPage title="Настройки" />} />
                <Route path="/forum" element={<ComingSoonPage title="Форум" />} />
                <Route path="/feed" element={<ComingSoonPage title="Лента" />} />

                {/* Перенаправление всех остальных ненайденных путей на главную */}
                {/* Это обработка 404 на стороне КЛИЕНТА */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

export default App;