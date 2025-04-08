// [client/src/pages/AnimeDetailPage.jsx]

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeFullById } from '../services/shikimoriApi';
import { searchKodikPlayer } from '../services/kodikApi';
import styles from './AnimeDetailPage.module.css';
// Импорты иконок (если нужны для деталей)
import StarIcon from '../assets/icons/StarIcon';
import CalendarDaysIcon from '../assets/icons/CalendarDaysIcon';
import ClockIcon from '../assets/icons/ClockIcon';
// !!! ИСПРАВЛЕНЫ ПУТИ !!!
import PlayIcon from '../assets/icons/PlayIcon';
import ListPlusIcon from '../assets/icons/ListPlusIcon';
// ------------------------

const SHIKIMORI_URL_PREFIX = 'https://shikimori.one';

const AnimeDetailPage = () => {
    const { animeId } = useParams();
    const [animeData, setAnimeData] = useState(null);
    const [kodikData, setKodikData] = useState({ link: null, id: null });
    const [isLoadingAnime, setIsLoadingAnime] = useState(true);
    const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
    const [errorAnime, setErrorAnime] = useState(null);
    const [errorPlayer, setErrorPlayer] = useState(null);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);

    const loadAnimeDetails = useCallback(async () => {
        if (!animeId) return;
        console.log(`[AnimeDetail] Загрузка данных Shikimori для ID: ${animeId}`);
        setIsLoadingAnime(true); setIsLoadingPlayer(true); setErrorAnime(null); setErrorPlayer(null);
        setKodikData({ link: null, id: null }); setAnimeData(null);

        // --- Загрузка данных Shikimori ---
        const shikiResult = await getAnimeFullById(animeId);
        console.log("[AnimeDetail] Результат getAnimeFullById:", shikiResult);
        if (!shikiResult) { setErrorAnime(new Error("Критическая ошибка: не удалось получить ответ от API деталей аниме.")); setIsLoadingAnime(false); setIsLoadingPlayer(false); return; }
        const { data: shikiData, error: shikiError } = shikiResult;

        if (shikiError) { console.error("[AnimeDetail] Ошибка загрузки Shikimori:", shikiError); setErrorAnime(shikiError); setAnimeData(null); setIsLoadingAnime(false); setIsLoadingPlayer(false); return; }
        if (!shikiData) { console.warn("[AnimeDetail] Данные Shikimori не найдены."); setErrorAnime(new Error("Информация об этом аниме не найдена или недоступна.")); setAnimeData(null); setIsLoadingAnime(false); setIsLoadingPlayer(false); return; }

        setAnimeData(shikiData); setIsLoadingAnime(false);
        console.log("[AnimeDetail] Данные Shikimori загружены.");

        // --- Загрузка Плеера Kodik ---
        console.log("[AnimeDetail] Запуск поиска плеера Kodik...");
        const searchParams = { shikimori_id: animeId };
        if (shikiData.kinopoisk_id) searchParams.kinopoisk_id = shikiData.kinopoisk_id;
        if (shikiData.imdb_id) searchParams.imdb_id = shikiData.imdb_id;
        if (!searchParams.shikimori_id && !searchParams.kinopoisk_id && !searchParams.imdb_id && shikiData.name) { searchParams.title = shikiData.name; if (shikiData.aired_on) { searchParams.year = new Date(shikiData.aired_on).getFullYear(); } }

        const { kodik_link, id: kodikId, error: kodikError } = await searchKodikPlayer(searchParams);
        console.log("[AnimeDetail] Результат searchKodikPlayer:", { kodik_link, kodikId, kodikError });

        if (kodikError) { console.warn("[AnimeDetail] Ошибка поиска Kodik:", kodikError); setErrorPlayer(kodikError); setKodikData({ link: null, id: null }); }
        else { setKodikData({ link: kodik_link, id: kodikId }); setErrorPlayer(null); }
        setIsLoadingPlayer(false);
        console.log("[AnimeDetail] Поиск плеера завершен.");

    }, [animeId]);

    useEffect(() => { loadAnimeDetails(); }, [loadAnimeDetails]);

    // --- Рендеринг --- (Без изменений в логике рендера)
    if (isLoadingAnime) { return <div className={styles.loading}>Загрузка информации об аниме...</div>; }
    if (errorAnime) { return <div className={styles.errorPage}>Ошибка: {errorAnime.message}</div>; }
    if (!animeData) { return <div className={styles.errorPage}>Аниме не найдено.</div>; }

    // Извлечение данных для рендера
    const title = animeData.russian || animeData.name || 'Без названия';
    const originalTitle = animeData.name || '';
    const posterLargeUrl = animeData.image?.original ? `${SHIKIMORI_URL_PREFIX}${animeData.image.original}` : '/placeholder-poster.png';
    const bannerUrl = animeData.screenshots && animeData.screenshots.length > 0 ? `${SHIKIMORI_URL_PREFIX}${animeData.screenshots[0].original}` : posterLargeUrl;
    const year = animeData.aired_on ? new Date(animeData.aired_on).getFullYear() : '';
    const kind = animeData.kind?.toUpperCase() || '';
    const episodes = animeData.episodes || animeData.episodes_aired || '?';
    const duration = animeData.duration ? `${animeData.duration} мин.` : '';
    const score = animeData.score && animeData.score !== "0.0" ? parseFloat(animeData.score).toFixed(1) : null;
    const descriptionHtml = animeData.description_html || '<p>Описание отсутствует.</p>';
    const studios = animeData.studios?.map(s => s.name).join(', ');
    const genres = animeData.genres || [];

    const handleWatchClick = () => setIsPlayerVisible(true);

    return (
        <div className={styles.animeDetailPage}>
            {/* Баннер */}
            <div className={styles.banner} style={{ backgroundImage: `url(${bannerUrl})` }}>
                <div className={styles.bannerOverlay}></div>
                <div className={styles.bannerContent}>
                    <div className={styles.bannerInfo}>
                        <h1 className={styles.title}>{title}</h1>
                        {originalTitle && originalTitle !== title && <p className={styles.originalTitle}>{originalTitle}</p>}
                        <div className={styles.meta}> {kind && <span>{kind}</span>} {year && <span>{year}</span>} {episodes !== '?' && <span>{episodes} эп.</span>} {duration && <span>{duration}</span>} </div>
                        {score && ( <div className={styles.rating} title={`Рейтинг Shikimori: ${score}`}> <StarIcon size={20}/> <span>{score}</span> </div> )}
                        <div className={styles.actions}> <button onClick={handleWatchClick} className={styles.watchButton} disabled={isLoadingPlayer || !kodikData.link}> <PlayIcon size={20} /> {isLoadingPlayer ? 'Поиск плеера...' : kodikData.link ? 'Смотреть онлайн' : 'Плеер недоступен'} </button> <Link to="/login" className={styles.addButton}> <ListPlusIcon size={20} /> Добавить в список </Link> </div>
                    </div>
                </div>
            </div>
            {/* Основной контент */}
            <div className={styles.mainContent}>
                <div className={styles.leftSidebar}>
                    <img src={posterLargeUrl} alt={`Постер ${title}`} className={styles.poster} onError={(e) => { if (e.target.src !== '/placeholder-poster.png') e.target.src = '/placeholder-poster.png'; }}/>
                    <div className={styles.infoWidget}> <h4>Детали</h4> <p><strong>Тип:</strong> {kind || '?'}</p> <p><strong>Эпизоды:</strong> {episodes}</p> <p><strong>Статус:</strong> {animeData.status || '?'}</p> <p><strong>Год:</strong> {year || '?'}</p> {duration && <p><strong>Длительность:</strong> {duration}</p>} {studios && <p><strong>Студия:</strong> {studios}</p>} </div>
                    {genres.length > 0 && ( <div className={styles.infoWidget}> <h4>Жанры</h4> <div className={styles.genreTags}> {genres.map(g => g && g.id && ( <Link key={g.id} to={`/catalog?genre=${g.id}`} className={styles.genreTag}>{g.russian || g.name}</Link> ))} </div> </div> )}
                </div>
                <div className={styles.rightContent}>
                    <div className={styles.playerSection}> <h3>Просмотр онлайн</h3> {isLoadingPlayer && <div className={styles.playerLoading}>Загрузка плеера...</div>} {!isLoadingPlayer && errorPlayer && <div className={styles.playerError}>Не удалось загрузить плеер: {errorPlayer.message}</div>} {!isLoadingPlayer && !errorPlayer && !kodikData.link && <div className={styles.playerNotFound}>Плеер для этого аниме не найден.</div>} {kodikData.link && isPlayerVisible && ( <div className={styles.playerWrapper}> <iframe src={kodikData.link} title={`Плеер ${title}`} frameBorder="0" allowFullScreen allow="autoplay *; fullscreen *"></iframe> </div> )} {kodikData.link && !isPlayerVisible && ( <div className={styles.playerPlaceholder}> <button onClick={handleWatchClick} className={styles.watchButtonLarge}> <PlayIcon size={24} /> Показать плеер </button> </div> )} </div>
                    {descriptionHtml && ( <div className={styles.descriptionSection}> <h3>Описание</h3> <div dangerouslySetInnerHTML={{ __html: descriptionHtml }}></div> </div> )}
                    {animeData.screenshots && animeData.screenshots.length > 0 && ( <div className={styles.screenshotsSection}> <h3>Кадры</h3> <div className={styles.screenshotsGrid}> {animeData.screenshots.map((shot, index) => shot && shot.original && ( <img key={index} src={`${SHIKIMORI_URL_PREFIX}${shot.original}`} alt={`Кадр ${index + 1}`} loading="lazy" /> ))} </div> </div> )}
                </div>
            </div>
        </div>
    );
};
export default AnimeDetailPage;