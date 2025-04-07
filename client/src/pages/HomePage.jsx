// [client/src/pages/HomePage.jsx]

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAnime, getGenres } from '../services/shikimoriApi';
import AnimeSection from '../components/Home/AnimeSection';
import styles from './HomePage.module.css';
import SearchIcon from '../assets/icons/SearchIcon';
import StarIcon from '../assets/icons/StarIcon';
import CalendarDaysIcon from '../assets/icons/CalendarDaysIcon';
import TrendingUpIcon from '../assets/icons/TrendingUpIcon';

// Импорты Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y, FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css'; import 'swiper/css/navigation'; import 'swiper/css/free-mode'; import 'swiper/css/pagination';

const HomePage = () => {
    // --- Состояния ---
    const [popularAnime, setPopularAnime] = useState([]); const [seasonalAnime, setSeasonalAnime] = useState([]); const [topRatedAnime, setTopRatedAnime] = useState([]); const [genres, setGenres] = useState([]); const [isLoadingPopular, setIsLoadingPopular] = useState(true); const [isLoadingSeasonal, setIsLoadingSeasonal] = useState(false); const [isLoadingTopRated, setIsLoadingTopRated] = useState(false); const [isLoadingGenres, setIsLoadingGenres] = useState(true); const [errorPopular, setErrorPopular] = useState(null); const [errorSeasonal, setErrorSeasonal] = useState(null); const [errorTopRated, setErrorTopRated] = useState(null); const [errorGenres, setErrorGenres] = useState(null); const [seasonalLoaded, setSeasonalLoaded] = useState(false); const [topRatedLoaded, setTopRatedLoaded] = useState(false); const [searchTerm, setSearchTerm] = useState(''); const [showScrollTop, setShowScrollTop] = useState(false);
    const navigate = useNavigate(); const videoRef = useRef(null); const seasonalSectionRef = useRef(null); const topRatedSectionRef = useRef(null);

    // --- Функции ---
    const fetchData = useCallback(async (setter, setErrorState, setLoadingState, apiParams, sectionName) => { setLoadingState(true); setErrorState(null); try { const { data, error: apiError } = await searchAnime(apiParams); if (apiError) { throw apiError; } setter(data || []); } catch (err) { console.error(`[HomePage] Ошибка загрузки '${sectionName}':`, err); setErrorState(err); setter([]); } finally { setLoadingState(false); } }, []);
    const loadGenresForButtons = useCallback(async () => { setIsLoadingGenres(true); setErrorGenres(null); try { const { data: genreData, error: genreError } = await getGenres(); if (genreError) throw genreError; setGenres((genreData || []).slice(0, 5)); } catch (err) { setErrorGenres(err); console.error("Error loading genres:", err); setGenres([]); /* !!! Устанавливаем пустой массив при ошибке !!! */ } finally { setIsLoadingGenres(false); } }, []);
    const loadSeasonal = useCallback(() => { if (!seasonalLoaded && !isLoadingSeasonal) { setSeasonalLoaded(true); fetchData(setSeasonalAnime, setErrorSeasonal, setIsLoadingSeasonal, { status: 'ongoing', order: 'popularity', kind: 'tv,ova,ona,special', limit: 14 }, "Seasonal"); } }, [fetchData, seasonalLoaded, isLoadingSeasonal]);
    const loadTopRated = useCallback(() => { if (!topRatedLoaded && !isLoadingTopRated) { setTopRatedLoaded(true); fetchData(setTopRatedAnime, setErrorTopRated, setIsLoadingTopRated, { order: 'ranked', kind: 'tv,movie,ova,ona,special', limit: 14 }, "Top Rated"); } }, [fetchData, topRatedLoaded, isLoadingTopRated]);
    const handleSearch = (e) => { e.preventDefault(); if (searchTerm.trim()) { navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`); } };
    const scrollTop = () => { window.scrollTo({top: 0, behavior: 'smooth'}); };

    // --- Эффекты ---
    useEffect(() => { fetchData(setPopularAnime, setErrorPopular, setIsLoadingPopular, { order: 'popularity', kind: 'tv,movie,ova,ona,special', limit: 15 }, "Popular"); loadGenresForButtons(); }, [fetchData, loadGenresForButtons]);
    useEffect(() => { const videoElement = videoRef.current; if (!videoElement) return; const handleScroll = () => { videoElement.style.transform = `translate(-50%, calc(-50% + ${window.pageYOffset * 0.2}px))`; }; window.addEventListener('scroll', handleScroll, { passive: true }); handleScroll(); return () => window.removeEventListener('scroll', handleScroll); }, []);
    useEffect(() => { const checkScrollTop = () => { setShowScrollTop(window.pageYOffset > 400); }; window.addEventListener('scroll', checkScrollTop); return () => window.removeEventListener('scroll', checkScrollTop); }, []);
    useEffect(() => { const observerOptions = { threshold: 0.1 }; const observerCallback = (entries, observerInstance) => { entries.forEach(entry => { if (entry.isIntersecting) { if (entry.target === seasonalSectionRef.current) loadSeasonal(); else if (entry.target === topRatedSectionRef.current) loadTopRated(); observerInstance.unobserve(entry.target); } }); }; const observer = new IntersectionObserver(observerCallback, observerOptions); const refs = [seasonalSectionRef.current, topRatedSectionRef.current].filter(Boolean); refs.forEach(ref => observer.observe(ref)); return () => refs.forEach(ref => observer.unobserve(ref)); }, [loadSeasonal, loadTopRated]);

    const accentColor = '#a78bfa';

    // Рендеринг
    return (
        <div className={styles.homePage}>
            <section className={styles.heroSection}> <video ref={videoRef} className={styles.heroVideoBackground} autoPlay muted loop playsInline poster="/hero-background.jpg"> <source src="/hero-video.mp4" type="video/mp4" /> Ваш браузер не поддерживает видео. </video> <div className={styles.heroOverlay}></div> <div className={styles.heroContentWrapper}> <div className={styles.heroContent}> <h1 className={`${styles.heroTitle} ${styles.fadeInUp}`}>Твой компас в мире аниме</h1> <p className={`${styles.heroSubtitle} ${styles.fadeInUpDelay1}`}> Находи, смотри и обсуждай любимые тайтлы. </p> <form className={`${styles.searchForm} ${styles.fadeInUpDelay2}`} onSubmit={handleSearch}> <input type="search" placeholder="Найти аниме..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> <button type="submit" className={styles.searchButton} aria-label="Поиск"><SearchIcon /></button> </form>
                {/* !!! ДОБАВЛЕНА ПРОВЕРКА Array.isArray(genres) !!! */}
                {!isLoadingGenres && Array.isArray(genres) && genres.length > 0 && (
                    <div className={`${styles.heroGenreButtons} ${styles.fadeInUpDelay3}`}>
                        <span>Жанры:</span>
                        {genres.map(genre => (
                            <Link key={genre.id} to={`/catalog?genre=${genre.id}`} className={styles.heroGenreButton}>{genre.russian || genre.name}</Link>
                        ))}
                    </div>
                )}
                {/* Опционально: Показать сообщение об ошибке загрузки жанров */}
                {errorGenres && !isLoadingGenres && (
                    <p className={styles.genreLoadError}>Не удалось загрузить жанры.</p>
                )}
            </div> </div> </section>
            <div className={styles.mainContent}> <AnimeSection key="popular" title="Популярное сейчас" icon={StarIcon} iconColor={accentColor} animeList={popularAnime} isLoading={isLoadingPopular} error={errorPopular} layout="carousel" usePagination={true} linkToCatalog="/catalog?order=popularity" onVisible={() => {}} /> <div className={styles.sectionDivider}></div> <div ref={seasonalSectionRef}> <AnimeSection key="seasonal" title="Онгоинги Сезона" icon={CalendarDaysIcon} iconColor={accentColor} animeList={seasonalAnime} isLoading={isLoadingSeasonal} error={errorSeasonal} layout="grid" gridClass={styles.gridSevenCols} linkToCatalog={`/catalog?status=ongoing&order=popularity`} onVisible={loadSeasonal} /> </div> <div className={styles.sectionDivider}></div> <div ref={topRatedSectionRef}> <AnimeSection key="top-rated" title="Топ Рейтинга" icon={TrendingUpIcon} iconColor={accentColor} animeList={topRatedAnime} isLoading={isLoadingTopRated} error={errorTopRated} layout="grid" gridClass={styles.gridSevenCols} linkToCatalog="/catalog?order=ranked" onVisible={loadTopRated} /> </div> </div>
            {showScrollTop && ( <button onClick={scrollTop} className={`${styles.scrollTopButton} ${showScrollTop ? styles.show : ''}`} title="Наверх"> ↑ </button> )}
        </div>
    );
};
export default HomePage;