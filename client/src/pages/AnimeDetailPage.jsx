// [client/src/pages/AnimeDetailPage.jsx]

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimeFullById } from '../services/shikimoriApi';
import { searchKodikPlayer } from '../services/kodikApi';
import styles from './AnimeDetailPage.module.css';
// Импорты иконок (если нужны)
import StarIcon from '../assets/icons/StarIcon';
import CalendarDaysIcon from '../assets/icons/CalendarDaysIcon';
import ClockIcon from '../assets/icons/ClockIcon';
import PlayIcon from '../assets/icons/PlayIcon'; // Пример иконки для кнопки
import ListPlusIcon from '../assets/icons/ListPlusIcon'; // Пример

const SHIKIMORI_URL_PREFIX = 'https://shikimori.one';

const AnimeDetailPage = () => {
    const { animeId } = useParams();
    const [animeData, setAnimeData] = useState(null);
    const [kodikData, setKodikData] = useState({ link: null, id: null });
    const [isLoadingAnime, setIsLoadingAnime] = useState(true);
    const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
    const [errorAnime, setErrorAnime] = useState(null);
    const [errorPlayer, setErrorPlayer] = useState(null);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false); // Для показа плеера по кнопке

    const loadAnimeDetails = useCallback(async () => {
        if (!animeId) return;
        console.log(`[AnimeDetail] Загрузка данных Shikimori для ID: ${animeId}`);
        setIsLoadingAnime(true); setIsLoadingPlayer(true);
        setErrorAnime(null); setErrorPlayer(null); setKodikData({ link: null, id: null }); // Сброс плеера
        setAnimeData(null); // Сброс данных аниме

        // --- Загрузка данных Shikimori ---
        // !!! ДОБАВЛЕНА ПРОВЕРКА ПЕРЕД ДЕСТРУКТУРИЗАЦИЕЙ !!!
        const shikiResult = await getAnimeFullById(animeId);
        console.log("[AnimeDetail] Результат getAnimeFullById:", shikiResult); // Логируем результат

        if (!shikiResult) { // Проверяем на undefined/null
            console.error("[AnimeDetail] getAnimeFullById вернул undefined или null!");
            setErrorAnime(new Error("Критическая ошибка: не удалось получить ответ от API деталей аниме."));
            setIsLoadingAnime(false); setIsLoadingPlayer(false);
            return;
        }

        const { data: shikiData, error: shikiError } = shikiResult; // Теперь деструктуризация безопасна

        if (shikiError) {
            console.error("[AnimeDetail] Ошибка загрузки Shikimori:", shikiError);
            setErrorAnime(shikiError);
            setAnimeData(null); // Убедимся, что данных нет
            setIsLoadingAnime(false);
            setIsLoadingPlayer(false); // Плеер тоже не грузим
            return;
        }
        if (!shikiData) {
            console.warn("[AnimeDetail] Данные Shikimori не найдены (возможно, 404 или запрещенный контент).");
            setErrorAnime(new Error("Информация об этом аниме не найдена или недоступна."));
            setAnimeData(null);
            setIsLoadingAnime(false);
            setIsLoadingPlayer(false);
            return;
        }

        setAnimeData(shikiData); setIsLoadingAnime(false); // Устанавливаем данные Shiki, завершаем их загрузку
        console.log("[AnimeDetail] Данные Shikimori загружены:", shikiData);

        // --- Загрузка Плеера Kodik (только после успеха Shiki) ---
        console.log("[AnimeDetail] Запуск поиска плеера Kodik...");
        const searchParams = { shikimori_id: animeId };
        // Добавляем другие ID или название, если они есть в shikiData
        if (shikiData.kinopoisk_id) searchParams.kinopoisk_id = shikiData.kinopoisk_id;
        if (shikiData.imdb_id) searchParams.imdb_id = shikiData.imdb_id;
        // Ищем по названию только если нет ID Shikimori/KP/IMDb (маловероятно)
        if (!searchParams.shikimori_id && !searchParams.kinopoisk_id && !searchParams.imdb_id && shikiData.name) {
            searchParams.title = shikiData.name;
            if (shikiData.aired_on) { // Добавляем год для точности поиска по названию
                searchParams.year = new Date(shikiData.aired_on).getFullYear();
            }
        }

        const { kodik_link, id: kodikId, error: kodikError } = await searchKodikPlayer(searchParams);
        console.log("[AnimeDetail] Результат searchKodikPlayer:", { kodik_link, kodikId, kodikError });

        if (kodikError) {
            console.warn("[AnimeDetail] Ошибка поиска Kodik или результат не найден:", kodikError);
            setErrorPlayer(kodikError); // Отобразим ошибку поиска плеера
            setKodikData({ link: null, id: null });
        } else {
            setKodikData({ link: kodik_link, id: kodikId }); // Устанавливаем ссылку или null
            setErrorPlayer(null); // Ошибки нет (даже если ссылка null)
        }
        setIsLoadingPlayer(false); // Завершаем загрузку плеера
        console.log("[AnimeDetail] Поиск плеера завершен.");

    }, [animeId]);

    useEffect(() => {
        loadAnimeDetails();
    }, [loadAnimeDetails]); // Зависимость от useCallback-функции

    // --- Рендеринг ---
    if (isLoadingAnime) { return <div className={styles.loading}>Загрузка информации об аниме...</div>; }
    if (errorAnime) { return <div className={styles.errorPage}>Ошибка: {errorAnime.message}</div>; }
    if (!animeData) { return <div className={styles.errorPage}>Аниме не найдено.</div>; }

    // Извлечение данных для рендера (с проверками)
    const title = animeData.russian || animeData.name || 'Без названия';
    const originalTitle = animeData.name || '';
    const posterLargeUrl = animeData.image?.original ? `${SHIKIMORI_URL_PREFIX}${animeData.image.original}` : '/placeholder-poster.png';
    // Для баннера берем первый скриншот или постер
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
                        <div className={styles.meta}>
                            {kind && <span>{kind}</span>}
                            {year && <span>{year}</span>}
                            {episodes !== '?' && <span>{episodes} эп.</span>}
                            {duration && <span>{duration}</span>}
                        </div>
                        {score && ( <div className={styles.rating} title={`Рейтинг Shikimori: ${score}`}> <StarIcon size={20}/> <span>{score}</span> </div> )}
                        <div className={styles.actions}>
                            <button onClick={handleWatchClick} className={styles.watchButton} disabled={isLoadingPlayer || !kodikData.link}>
                                <PlayIcon size={20} />
                                {isLoadingPlayer ? 'Поиск плеера...' : kodikData.link ? 'Смотреть онлайн' : 'Плеер недоступен'}
                            </button>
                            {/* Кнопка "Добавить в список" (ведет на заглушку) */}
                            <Link to="/login" className={styles.addButton}>
                                <ListPlusIcon size={20} /> Добавить в список
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className={styles.mainContent}>
                <div className={styles.leftSidebar}>
                    <img src={posterLargeUrl} alt={`Постер ${title}`} className={styles.poster} onError={(e) => { if (e.target.src !== '/placeholder-poster.png') e.target.src = '/placeholder-poster.png'; }}/>
                    {/* Можно добавить виджеты с информацией */}
                    <div className={styles.infoWidget}> <h4>Детали</h4> <p><strong>Тип:</strong> {kind || '?'}</p> <p><strong>Эпизоды:</strong> {episodes}</p> <p><strong>Статус:</strong> {animeData.status || '?'}</p> <p><strong>Год:</strong> {year || '?'}</p> {duration && <p><strong>Длительность:</strong> {duration}</p>} {studios && <p><strong>Студия:</strong> {studios}</p>} {/* ... другие поля */} </div>
                    {genres.length > 0 && ( <div className={styles.infoWidget}> <h4>Жанры</h4> <div className={styles.genreTags}> {genres.map(g => g && g.id && ( <Link key={g.id} to={`/catalog?genre=${g.id}`} className={styles.genreTag}>{g.russian || g.name}</Link> ))} </div> </div> )}
                </div>

                <div className={styles.rightContent}>
                    {/* Плеер */}
                    <div className={styles.playerSection}>
                        <h3>Просмотр онлайн</h3>
                        {isLoadingPlayer && <div className={styles.playerLoading}>Загрузка плеера...</div>}
                        {!isLoadingPlayer && errorPlayer && <div className={styles.playerError}>Не удалось загрузить плеер: {errorPlayer.message}</div>}
                        {!isLoadingPlayer && !errorPlayer && !kodikData.link && <div className={styles.playerNotFound}>Плеер для этого аниме не найден.</div>}
                        {/* Показываем плеер, если есть ссылка и нажата кнопка (или сразу, если isPlayerVisible по умолчанию true) */}
                        {kodikData.link && isPlayerVisible && (
                            <div className={styles.playerWrapper}> <iframe src={kodikData.link} title={`Плеер ${title}`} frameBorder="0" allowFullScreen allow="autoplay *; fullscreen *"></iframe> </div>
                        )}
                        {/* Показываем кнопку, если плеер не видим, но ссылка есть */}
                        {kodikData.link && !isPlayerVisible && (
                            <div className={styles.playerPlaceholder}> <button onClick={handleWatchClick} className={styles.watchButtonLarge}> <PlayIcon size={24} /> Показать плеер </button> </div>
                        )}
                    </div>

                    {/* Описание */}
                    {descriptionHtml && (
                        <div className={styles.descriptionSection}> <h3>Описание</h3> <div dangerouslySetInnerHTML={{ __html: descriptionHtml }}></div> </div>
                    )}

                    {/* Скриншоты (если есть) */}
                    {animeData.screenshots && animeData.screenshots.length > 0 && (
                        <div className={styles.screenshotsSection}>
                            <h3>Кадры</h3>
                            <div className={styles.screenshotsGrid}>
                                {animeData.screenshots.map((shot, index) => shot && shot.original && (
                                    <img key={index} src={`${SHIKIMORI_URL_PREFIX}${shot.original}`} alt={`Кадр ${index + 1}`} loading="lazy" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;