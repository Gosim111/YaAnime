// [client/src/pages/AnimeDetailPage.jsx]

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnimeFullById } from '../services/shikimoriApi'; // Shikimori для метаданных
import { searchKodikPlayer } from '../services/kodikApi'; // Kodik для плеера и постера
import styles from './AnimeDetailPage.module.css';
import homeStyles from './HomePage.module.css';
import ClockIcon from '../assets/icons/ClockIcon';
import CalendarDaysIcon from '../assets/icons/CalendarDaysIcon';
import StarIcon from '../assets/icons/StarIcon';
import KinopoiskIcon from '../assets/icons/KinopoiskIcon'; // Нужна иконка
import ImdbIcon from '../assets/icons/ImdbIcon'; // Нужна иконка

const SHIKIMORI_URL_PREFIX = 'https://shikimori.one';

// Хелперы форматирования (без изменений)
const formatStatus = (status) => { const statusMap = { anons: { text: 'Анонс', class: styles.statusAnons }, ongoing: { text: 'Онгоинг', class: styles.statusOngoing }, released: { text: 'Вышло', class: styles.statusReleased }, }; return statusMap[status] || { text: status, class: '' }; };
const formatRatingMPAA = (rating) => rating ? rating.toUpperCase().replace('_', '-') : 'N/A';
const GenreTag = ({ genre }) => genre?.id ? ( <Link to={`/catalog?genres=${genre.id}`} className={styles.genreTag}> {genre.russian || genre.name} </Link> ) : null;

// Компонент рейтинга с иконкой
const RatingItem = ({ value, source, icon: Icon, title }) => {
    if (!value || value === '0' || value === '0.0' || value === 0) return null;
    const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
    return (
        <div className={styles.ratingItem} title={`${title}: ${displayValue}`}>
            {Icon && <Icon className={styles.ratingIcon} size={16}/>}
            <span>{displayValue}</span>
        </div>
    );
};


const AnimeDetailPage = () => {
    const { animeId } = useParams();
    const navigate = useNavigate();
    const [animeData, setAnimeData] = useState(null); // Данные из Shikimori
    const [playerData, setPlayerData] = useState({ url: null, material: null, isLoading: true, error: null }); // Добавили material
    const [isLoading, setIsLoading] = useState(true); // Общая загрузка страницы
    const [error, setError] = useState(null); // Общая ошибка страницы

    useEffect(() => {
        window.scrollTo(0, 0);
        let isMounted = true;
        const fetchAnimeAndPlayer = async () => {
            setIsLoading(true); setError(null); setAnimeData(null);
            setPlayerData({ url: null, material: null, isLoading: true, error: null });

            if (!animeId || isNaN(parseInt(animeId))) {
                setError(new Error("Некорректный ID аниме"));
                setIsLoading(false); return;
            }

            // 1. Загружаем данные Shikimori
            console.log(`[AnimeDetail] Загрузка данных Shikimori для ID: ${animeId}`);
            const { data: shikiData, error: shikiError } = await getAnimeFullById(animeId);

            if (!isMounted) return;
            if (shikiError || !shikiData) {
                console.error('[AnimeDetail] Ошибка загрузки данных Shikimori:', shikiError);
                setError(shikiError || new Error('Не удалось загрузить данные об аниме'));
                setIsLoading(false); return;
            }
            console.log('[AnimeDetail] Данные Shikimori получены:', shikiData);
            setAnimeData(shikiData); // Сохраняем основные данные
            setIsLoading(false); // Основная загрузка завершена

            // 2. Ищем плеер и ПОСТЕР/ДАННЫЕ из Kodik
            setPlayerData(prev => ({ ...prev, isLoading: true, error: null }));
            const searchParams = { shikimori_id: shikiData.id };
            if (shikiData.kinopoisk_id) searchParams.kinopoisk_id = shikiData.kinopoisk_id;
            if (shikiData.imdb_id) searchParams.imdb_id = shikiData.imdb_id;
            // Если нет ID, используем название как крайний вариант
            if (!searchParams.shikimori_id && !searchParams.kinopoisk_id && !searchParams.imdb_id) {
                searchParams.title = shikiData.name;
                console.warn("[AnimeDetail] Поиск Kodik по названию:", searchParams.title);
            }

            console.log('[AnimeDetail] Поиск плеера/данных Kodik с параметрами:', searchParams);
            // !!! ЗАПРАШИВАЕМ material_data !!!
            const { kodik_link, materialData, error: kodikError } = await searchKodikPlayer(searchParams, true);

            if (!isMounted) return;
            if (kodikError) {
                console.warn('[AnimeDetail] Ошибка поиска Kodik или результат не найден:', kodikError);
                setPlayerData({ url: null, material: null, isLoading: false, error: kodikError });
            } else {
                console.log(`[AnimeDetail] Результат Kodik получен. Ссылка: ${kodik_link ? 'OK' : 'НЕТ'}, MaterialData: ${materialData ? 'OK' : 'НЕТ'}`);
                setPlayerData({ url: kodik_link, material: materialData, isLoading: false, error: null });
            }
        };

        fetchAnimeAndPlayer();
        return () => { isMounted = false; };
    }, [animeId]);

    // Мемоизация данных для рендера
    const displayData = useMemo(() => {
        if (!animeData) return {}; // Ждем данных Shikimori

        const shikiPosterUrl = animeData.image?.original ? `${SHIKIMORI_URL_PREFIX}${animeData.image.original}` : '/placeholder-poster.png';
        // !!! Используем постер из Kodik, если он есть, иначе из Shikimori !!!
        const posterUrl = playerData.material?.poster_url || shikiPosterUrl;

        // Баннер по-прежнему из Shikimori
        const shikiBannerUrl = animeData.screenshots?.[0]?.original || animeData.image?.original;
        const bannerUrl = shikiBannerUrl ? `${SHIKIMORI_URL_PREFIX}${shikiBannerUrl}` : null;

        const kindMap = { tv: 'ТВ Сериал', movie: 'Фильм', ova: 'OVA', ona: 'ONA', special: 'Спешл', music: 'Клип', tv_13: 'ТВ (коротк.)', tv_24: 'ТВ (станд.)', tv_48: 'ТВ (длин.)' };

        return {
            displayTitle: animeData.russian || animeData.name,
            originalTitle: animeData.name !== (animeData.russian || animeData.name) ? animeData.name : null,
            posterUrl: posterUrl, // Используем вычисленный posterUrl
            bannerUrl: bannerUrl,
            kindText: kindMap[animeData.kind] || animeData.kind?.toUpperCase() || 'N/A',
            year: animeData.aired_on ? new Date(animeData.aired_on).getFullYear() : 'N/A',
            statusInfo: formatStatus(animeData.status),
            ratingMPAA: formatRatingMPAA(animeData.rating),
            episodesText: animeData.episodes || animeData.episodes_aired ? `${animeData.episodes_aired || '?'}/${animeData.episodes || '?'}` : (animeData.kind === 'movie' ? 'Полнометражный' : 'N/A'),
            durationText: animeData.duration ? `${animeData.duration} мин.` : 'N/A',
            studiosText: animeData.studios?.length > 0 ? animeData.studios.map(s => s.name).join(', ') : 'N/A',
            genres: animeData.genres || [],
            description: animeData.description || 'Описание отсутствует.',
            // Рейтинги
            scoreShiki: animeData.score,
            scoreKP: playerData.material?.kinopoisk_rating,
            scoreIMDb: playerData.material?.imdb_rating,
            // Ссылки для виджета (если есть ID)
            shikiId: animeData.id,
            kpId: animeData.kinopoisk_id || playerData.material?.kinopoisk_id,
            imdbId: animeData.imdb_id || playerData.material?.imdb_id,
        };
    }, [animeData, playerData.material]); // Зависим от animeData и playerData.material


    // --- РЕНДЕР ---
    if (isLoading) { return <div className={homeStyles.loading} style={{minHeight: '60vh'}}>Загрузка данных об аниме...</div>; }
    if (error) { return <div className={homeStyles.error} style={{minHeight: '60vh'}}>Ошибка: {error.message}</div>; }
    if (!animeData) { return <div className={homeStyles.notFound} style={{minHeight: '60vh'}}>Аниме не найдено.</div>; }

    const { displayTitle, originalTitle, posterUrl, bannerUrl, kindText, year, statusInfo, ratingMPAA, episodesText, durationText, studiosText, genres, description, scoreShiki, scoreKP, scoreIMDb, shikiId, kpId, imdbId } = displayData;

    return (
        <div className={styles.detailPage}>
            {/* --- Баннер --- */}
            <div className={styles.banner} style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}>
                <div className={styles.bannerOverlay}></div>
                <div className={styles.bannerContent}>
                    <div className={styles.bannerInfo}>
                        <h1 className={styles.animeTitle}>{displayTitle}</h1>
                        {originalTitle && <h2 className={styles.animeOriginalTitle}>{originalTitle}</h2>}
                        <div className={styles.metaRow}>
                            <span className={styles.metaItem}>{kindText}</span>
                            <span className={styles.metaSeparator}>•</span>
                            <span className={styles.metaItem}>{year}</span>
                            <span className={styles.metaSeparator}>•</span>
                            <span className={`${styles.metaItem} ${statusInfo.class}`}>{statusInfo.text}</span>
                            {ratingMPAA !== 'N/A' && <span className={styles.metaSeparator}>•</span>}
                            {ratingMPAA !== 'N/A' && <span className={styles.metaItem}>{ratingMPAA}</span>}
                        </div>
                        {/* !!! Отображение всех рейтингов !!! */}
                        <div className={styles.ratingRow}>
                            <RatingItem value={scoreShiki} source="Shiki" icon={StarIcon} title="Рейтинг Shikimori" />
                            <RatingItem value={scoreKP} source="KP" icon={KinopoiskIcon} title="Рейтинг Кинопоиск" />
                            <RatingItem value={scoreIMDb} source="IMDb" icon={ImdbIcon} title="Рейтинг IMDb" />
                        </div>
                        <button className={styles.addToListButton} onClick={() => navigate('/login')}>Добавить в список</button>
                    </div>
                </div>
            </div>

            {/* --- Основной контент --- */}
            <div className={styles.mainContentWrapper}>
                <div className={styles.mainContent}>
                    {/* Левый Сайдбар */}
                    <aside className={styles.sidebar}>
                        {/* !!! Используем posterUrl, который теперь может быть от Kodik !!! */}
                        <img src={posterUrl} alt={`Постер ${displayTitle}`} className={styles.posterImage}
                             onError={(e) => { if (e.target.src !== '/placeholder-poster.png') { e.target.src = '/placeholder-poster.png'; } else { e.target.style.display = 'none'; } }}
                        />
                        <div className={styles.sidebarWidget}>
                            <h4 className={styles.widgetTitle}>Детали</h4>
                            <ul className={styles.widgetList}>
                                <li><span>Тип:</span> <span>{kindText}</span></li>
                                <li><span>Статус:</span> <span className={statusInfo.class}>{statusInfo.text}</span></li>
                                <li><span>Эпизоды:</span> <span>{episodesText}</span></li>
                                <li><span>Длительность:</span> <span>{durationText}</span></li>
                                <li><span>Год:</span> <span>{year}</span></li>
                                {ratingMPAA !== 'N/A' && <li><span>Рейтинг:</span> <span>{ratingMPAA}</span></li>}
                                <li><span>Студии:</span> <span>{studiosText}</span></li>
                                {animeData.licensors?.length > 0 && (<li><span>Лицензировано:</span> <span>{animeData.licensors.join(', ')}</span></li>)}
                                {animeData.aired_on && <li><span>Выход:</span> <span>{new Date(animeData.aired_on).toLocaleDateString()}</span></li>}
                                {animeData.released_on && <li><span>Релиз:</span> <span>{new Date(animeData.released_on).toLocaleDateString()}</span></li>}
                            </ul>
                        </div>
                        {/* Виджет ссылок */}
                        {(shikiId || kpId || imdbId) && (
                            <div className={styles.sidebarWidget}>
                                <h4 className={styles.widgetTitle}>Ссылки</h4>
                                <div className={styles.externalLinks}>
                                    {shikiId && <a href={`${SHIKIMORI_URL_PREFIX}/animes/${shikiId}`} target="_blank" rel="noopener noreferrer nofollow">Shikimori</a>}
                                    {kpId && <a href={`https://www.kinopoisk.ru/film/${kpId}/`} target="_blank" rel="noopener noreferrer nofollow">Кинопоиск</a>}
                                    {imdbId && <a href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noopener noreferrer nofollow">IMDb</a>}
                                </div>
                            </div>
                        )}
                        {genres.length > 0 && (
                            <div className={styles.sidebarWidget}>
                                <h4 className={styles.widgetTitle}>Жанры</h4>
                                <div className={styles.widgetTagContainer}>
                                    {genres.map(genre => <GenreTag key={genre.id} genre={genre} />)}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Правая Колонка */}
                    <section className={styles.contentColumn}>
                        {/* Плеер */}
                        <div className={styles.playerSection}>
                            <h3 className={styles.sectionTitle}>Смотреть онлайн</h3>
                            <div className={styles.playerWrapper}>
                                {playerData.isLoading && <div className={styles.playerPlaceholder}><div className={homeStyles.loading}>Загрузка плеера...</div></div>}
                                {playerData.error && !playerData.isLoading && <div className={styles.playerPlaceholder}><div className={homeStyles.error}>{playerData.error.message || 'Плеер не найден'}</div></div>}
                                {playerData.url && !playerData.isLoading && (
                                    <iframe src={playerData.url} title={`Плеер ${displayTitle}`} frameBorder="0" allowFullScreen allow="autoplay *; fullscreen *" className={styles.playerIframe}></iframe>
                                )}
                                {!playerData.url && !playerData.isLoading && !playerData.error && (
                                    <div className={styles.playerPlaceholder}><div className={homeStyles.notFound}>Плеер для этого аниме не найден.</div></div>
                                )}
                            </div>
                        </div>
                        {/* Описание */}
                        {description && description !== '<нет>' && (<div className={styles.descriptionSection}><h3 className={styles.sectionTitle}>Описание</h3><p className={styles.descriptionText} dangerouslySetInnerHTML={{ __html: animeData.description_html || description.replace(/\[.*?\]/g, '') }}></p></div>)}
                        {/* Скриншоты */}
                        {animeData.screenshots && animeData.screenshots.length > 0 && ( <div className={styles.screenshotsSection}><h3 className={styles.sectionTitle}>Кадры</h3><div className={styles.screenshotsGrid}> {animeData.screenshots.map((screenshot) => ( <a key={screenshot.original} href={`${SHIKIMORI_URL_PREFIX}${screenshot.original}`} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}> <img src={`${SHIKIMORI_URL_PREFIX}${screenshot.preview}`} alt="Кадр из аниме" loading="lazy" className={styles.screenshotImage}/> </a> ))} </div></div> )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;