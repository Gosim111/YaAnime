// [client/src/components/Catalog/CatalogResults.jsx]
import React, { useState, useEffect } from 'react';
import AnimeCard from '../AnimeCard/AnimeCard'; // Используем восстановленную AnimeCard
import AnimeListItem from './AnimeListItem';
import Pagination from '../Pagination/Pagination';
import styles from './CatalogResults.module.css';
import homeStyles from '../../pages/HomePage.module.css';

// Иконки (без изменений)
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zM2 13.25A2.25 2.25 0 014.25 11h2.5A2.25 2.25 0 019 13.25v2.5A2.25 2.25 0 016.75 18h-2.5A2.25 2.25 0 012 15.75v-2.5zM11 4.25A2.25 2.25 0 0113.25 2h2.5A2.25 2.25 0 0118 4.25v2.5A2.25 2.25 0 0115.75 9h-2.5A2.25 2.25 0 0111 6.75v-2.5zM13.25 11A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" /></svg>;
const ListIconBars = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;

// !!! ОПЦИИ СОРТИРОВКИ БЕЗ -aired_on и -id !!!
const SORT_OPTIONS = [
    { value: 'popularity', label: 'По популярности' },
    { value: 'ranked', label: 'По рейтингу' },
    { value: 'name', label: 'По названию (А-Я)' },
    { value: 'aired_on', label: 'По дате выхода' }, // Shikimori по умолчанию сортирует по убыванию (новые)
    { value: 'id', label: 'По дате добавления' }, // Shikimori по умолчанию сортирует по убыванию (новые)
    { value: 'status', label: 'По статусу' },
];

const CatalogResults = ({
                            animeList, isLoading, error, paginationData, sortOrder,
                            onSortChange, onPageChange, initialSearchQuery
                        }) => {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('catalogViewMode') || 'grid');
    useEffect(() => { localStorage.setItem('catalogViewMode', viewMode); }, [viewMode]);
    const handleSortChange = (event) => { onSortChange(event.target.value); };

    // Логирование пропсов (оставляем)
    console.log('[CatalogResults] Получены props:', { animeList: animeList ? `массив из ${animeList.length}` : animeList, isLoading, error, paginationData });

    const renderResults = () => {
        if (isLoading) return <div className={homeStyles.loading} style={{ minHeight: '40vh' }}>Загрузка результатов...</div>;
        if (error) return <div className={homeStyles.error} style={{ minHeight: '30vh' }}>{`Ошибка загрузки: ${error.message}`}</div>;
        if (!animeList || animeList.length === 0) { return <div className={homeStyles.notFound} style={{ minHeight: '30vh' }}>По вашему запросу ничего не найдено. Попробуйте изменить фильтры.</div>; }

        // console.log(`[CatalogResults] Рендеринг ${animeList.length} элементов в режиме ${viewMode}`);
        if (viewMode === 'list') {
            return ( <div className={styles.listContainer}> {animeList.map(anime => ( <AnimeListItem key={anime?.id || Math.random()} anime={anime} /> ))} </div> );
        }
        // Сетка - рендерим с помощью AnimeCard
        return (
            <div className={styles.gridContainer}>
                {animeList.map((anime) => (
                    <div key={anime?.id || Math.random()} className={styles.gridItem}>
                        {/* Передаем объект anime как есть */}
                        <AnimeCard anime={anime} />
                    </div>
                ))}
            </div>
        );
    };

    // Рендеринг компонента (без изменений)
    return ( <div className={styles.resultsWrapper}> <div className={styles.toolbar}> <div className={styles.resultsInfo}>{initialSearchQuery && <span className={styles.searchQueryInfo}>Результаты по запросу: "{initialSearchQuery}"</span>}</div> <div className={styles.controls}> <select value={sortOrder} onChange={handleSortChange} className={styles.sortSelect}>{SORT_OPTIONS.map(option => ( <option key={option.value} value={option.value}>{option.label}</option> ))}</select> <div className={styles.viewToggle}><button onClick={() => setViewMode('grid')} className={`${styles.toggleButton} ${viewMode === 'grid' ? styles.active : ''}`} aria-label="Вид сетка" title="Сетка"><GridIcon /></button><button onClick={() => setViewMode('list')} className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`} aria-label="Вид список" title="Список"><ListIconBars /></button></div> </div> </div> {renderResults()} {animeList && animeList.length > 0 && paginationData && ( <Pagination currentPage={paginationData.currentPage} hasNextPage={paginationData.hasNextPage} onPageChange={onPageChange} /> )} </div> );
};

export default CatalogResults;