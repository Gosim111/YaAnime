// [client/src/pages/CatalogPage.jsx]
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchAnime, getGenres, getStudios } from '../services/shikimoriApi';
import FilterSidebar from '../components/Catalog/FilterSidebar';
import CatalogResults from '../components/Catalog/CatalogResults';
import styles from './CatalogPage.module.css';
import FilterIcon from '../assets/icons/FilterIcon';

// Утилита парсинга URL (Добавлена обработка score)
const parseUrlParams = (searchParams) => {
    const filters = { page: 1, order: 'popularity', q: '', kind: [], status: [], genre: [], studio: [], yearFrom: '', yearTo: '', scoreFrom: '', scoreTo: '', season: '', score: '' };
    if (!searchParams) return filters;
    try {
        for (const [key, value] of searchParams.entries()) {
            if (!value) continue;
            switch (key) {
                case 'page': filters.page = parseInt(value, 10) || 1; break;
                case 'order': filters.order = value || 'popularity'; break;
                case 'q': case 'yearFrom': case 'yearTo': case 'scoreFrom': case 'scoreTo': filters[key] = value; break;
                // 'season' и 'score' из URL используются только для API, не для UI фильтров
                case 'season': filters.season = value; break;
                case 'score': filters.score = value; break;
                // Массивы
                case 'kind': case 'status': case 'genre': case 'studio': filters[key] = [...new Set([...(filters[key] || []), ...value.split(',')])].filter(v => v); break;
                default: break;
            }
        }
        if (!filters.order) filters.order = 'popularity';
        // Восстанавливаем yearFrom/To и scoreFrom/To из season/score если они пришли в URL
        if (filters.season) {
            const parts = filters.season.split('_');
            if (parts.length === 2 && parts[0] && parts[1]) { filters.yearFrom = parts[0]; filters.yearTo = parts[1]; }
            else if (parts.length === 1 && parts[0]) { filters.yearFrom = parts[0]; filters.yearTo = parts[0]; } // Если только один год
        }
        if (filters.score) { filters.scoreFrom = filters.score; filters.scoreTo = '10'; /* Так как API принимает только score=N (минимальный) */ }

    } catch (error) { console.error("[parseUrlParams] Error parsing searchParams:", error); return { page: 1, order: 'popularity', q: '', kind: [], status: [], genre: [], studio: [], yearFrom: '', yearTo: '', scoreFrom: '', scoreTo: '', season: '', score: '' }; }
    return filters;
};


const CatalogPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentFilters = useMemo(() => parseUrlParams(searchParams), [searchParams]);

    // Состояния данных (без изменений)
    const [animeList, setAnimeList] = useState([]);
    const [paginationData, setPaginationData] = useState({ currentPage: 1, hasNextPage: false, limit: 28 });
    const [genresList, setGenresList] = useState([]);
    const [studiosList, setStudiosList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    // Загрузка данных для фильтров (без изменений)
    useEffect(() => { const fetchFilterOptions = async () => { setIsLoadingFilters(true); try { const [genresResponse, studiosResponse] = await Promise.all([getGenres(), getStudios()]); setGenresList(genresResponse.data || []); setStudiosList(studiosResponse.data || []); } catch (err) { console.error("Ошибка загрузки опций фильтров:", err); } finally { setIsLoadingFilters(false); } }; fetchFilterOptions(); }, []);

    // Загрузка Аниме
    const fetchAnimeData = useCallback(async (filters) => {
        if (!filters) { console.warn("[CatalogPage] fetchAnimeData вызван с filters === undefined."); setIsLoading(false); return; }
        setIsLoading(true); setError(null); // setAnimeList([]); // Очищаем позже, чтобы не было мерцания
        console.log('[CatalogPage] --- Начинаем fetchAnimeData ---');

        // Формируем параметры для API ИЗ ТЕКУЩИХ ФИЛЬТРОВ В URL (currentFilters)
        // handleApplyFilters отвечает только за обновление URL
        const apiParams = {
            page: filters.page, order: filters.order,
            kind: filters.kind?.join(','), // Берем массивы из currentFilters
            status: filters.status?.join(','),
            genre: filters.genre?.join(','), // Уже не содержит запрещенные, если выбран через UI
            studio: filters.studio?.join(','),
            search: filters.q,
            // 'season' и 'score' берутся напрямую из currentFilters (уже подготовлены в parseUrlParams)
            season: filters.season,
            score: filters.score
        };
        console.log('[CatalogPage] Параметры для searchAnime:', apiParams);

        const { data, pagination, error: apiError } = await searchAnime(apiParams);
        console.log('[CatalogPage] Ответ от searchAnime:', { data: data ? `массив из ${data.length}` : data, pagination, apiError });

        if (apiError) {
            setError(apiError);
            setAnimeList([]); // Очищаем при ошибке
            setPaginationData({ currentPage: filters.page || 1, hasNextPage: false, limit: 28 });
        } else {
            setAnimeList(data || []); // Устанавливаем новые данные
            setPaginationData({ currentPage: pagination?.currentPage || 1, hasNextPage: pagination?.hasNextPage || false, limit: pagination?.limit || 28 });
        }
        setIsLoading(false);
        console.log('[CatalogPage] --- Завершили fetchAnimeData ---');
    }, []); // Зависимость не нужна

    // Перезагрузка данных при изменении currentFilters (из URL)
    useEffect(() => {
        console.log("[CatalogPage] useEffect[currentFilters] - Запускаем fetchAnimeData");
        fetchAnimeData(currentFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentFilters, fetchAnimeData]);

    // !!! ИСПРАВЛЕННЫЙ handleApplyFilters !!!
    const handleApplyFilters = (sidebarFilters) => {
        console.log("[CatalogPage] Получены фильтры из сайдбара для применения:", sidebarFilters);
        const params = new URLSearchParams(); // Создаем новый объект параметров
        params.set('page', '1'); // Всегда сбрасываем на 1 страницу

        // Добавляем непустые значения из sidebarFilters
        if (sidebarFilters.kind?.length > 0) params.set('kind', sidebarFilters.kind.join(','));
        if (sidebarFilters.status?.length > 0) params.set('status', sidebarFilters.status.join(','));
        if (sidebarFilters.genre?.length > 0) params.set('genre', sidebarFilters.genre.join(','));
        if (sidebarFilters.studio?.length > 0) params.set('studio', sidebarFilters.studio.join(','));

        // Добавляем значения для сохранения состояния полей ввода UI
        if (sidebarFilters.yearFrom) params.set('yearFrom', sidebarFilters.yearFrom);
        if (sidebarFilters.yearTo) params.set('yearTo', sidebarFilters.yearTo);
        if (sidebarFilters.scoreFrom) params.set('scoreFrom', sidebarFilters.scoreFrom);
        if (sidebarFilters.scoreTo) params.set('scoreTo', sidebarFilters.scoreTo);

        // Добавляем текущий поиск и сортировку (если они были в URL)
        if (currentFilters.q) params.set('q', currentFilters.q);
        if (currentFilters.order && currentFilters.order !== 'popularity') {
            params.set('order', currentFilters.order);
        }

        console.log("[CatalogPage] Применяем фильтры (setSearchParams):", params.toString());
        setSearchParams(params, { replace: true }); // Используем новый объект params
    };

    // handleResetFilters (Оставляем только q и order, если они были)
    const handleResetFilters = () => {
        const params = new URLSearchParams();
        params.set('page', '1');
        if (currentFilters.q) params.set('q', currentFilters.q);
        if (currentFilters.order && currentFilters.order !== 'popularity') params.set('order', currentFilters.order);
        console.log("[CatalogPage] Сбрасываем фильтры (setSearchParams):", params.toString());
        setSearchParams(params, { replace: true });
    };

    // handlePageChange, handleSortChange, toggleMobileFilters (без изменений)
    const handlePageChange = (newPage) => { setSearchParams(prev => { prev.set('page', String(newPage)); return prev; }, { replace: true }); };
    const handleSortChange = (newSortOrder) => { setSearchParams(prev => { prev.set('order', newSortOrder); prev.set('page', '1'); return prev; }, { replace: true }); };
    const toggleMobileFilters = () => { setIsMobileFiltersOpen(!isMobileFiltersOpen); };

    // Рендеринг (без изменений)
    return ( <div className={styles.catalogPage}> <div className={`${styles.mobileOverlay} ${isMobileFiltersOpen ? styles.visible : ''}`} onClick={toggleMobileFilters}></div> <FilterSidebar initialFilters={currentFilters} availableGenres={genresList} availableStudios={studiosList} onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} isMobileOpen={isMobileFiltersOpen} onMobileClose={toggleMobileFilters} isLoadingGenres={isLoadingFilters} isLoadingStudios={isLoadingFilters} /> <div className={styles.mainContent}> <CatalogResults animeList={animeList} isLoading={isLoading} error={error} paginationData={paginationData} sortOrder={currentFilters?.order ?? 'popularity'} onSortChange={handleSortChange} onPageChange={handlePageChange} initialSearchQuery={currentFilters?.q ?? ''} /> </div> <button className={styles.mobileFilterButton} onClick={toggleMobileFilters} aria-label="Открыть фильтры"> <FilterIcon size={24} /> </button> </div> );
};

export default CatalogPage;