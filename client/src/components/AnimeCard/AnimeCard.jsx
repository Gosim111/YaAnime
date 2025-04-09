// [client/src/components/AnimeCard/AnimeCard.jsx]

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AnimeCard.module.css';

const SHIKIMORI_URL_PREFIX = 'https://shikimori.one';

// Вспомогательные компоненты для данных Shikimori
const AnimeFormatBadge = ({ kind }) => { if (!kind) return null; const map={tv:'ТВ',movie:'Фильм',ova:'OVA',ona:'ONA',special:'Спешл',music:'Клип', tv_13:'ТВ',tv_24:'ТВ',tv_48:'ТВ'}; const txt=map[kind.toLowerCase()]||kind.toUpperCase(); return <span className={styles.badge} title={`Формат: ${kind}`}>{txt}</span>; };
const AnimeYearBadge = ({ year }) => { if (!year) return null; return <span className={styles.badge}>{year}</span>; };
const StarRatingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.83 4.421a.75.75 0 00.563.41l4.873.709c.845.122 1.183 1.148.557 1.753l-3.526 3.436a.75.75 0 00-.215.664l.832 4.853c.145.84-.734 1.484-1.483 1.098L10.2 17.59a.75.75 0 00-.703 0l-4.34 2.282c-.75.386-1.629-.252-1.484-1.098l.833-4.853a.75.75 0 00-.215-.664l-3.526-3.436c-.626-.605-.288-1.631.557-1.753l4.872-.709a.75.75 0 00.563-.41l1.83-4.421z" clipRule="evenodd" /></svg>;
const RatingBadge = ({ rating }) => { const r=rating?parseFloat(rating).toFixed(1):null; if(!r||r==="0.0")return null; return <div className={styles.ratingOverlay} title={`Рейтинг: ${r}`}><StarRatingIcon/><span>{r}</span></div>; };
const EpisodeStatusBadge = ({ status, aired, total }) => { if (status === 'released') return total ? <span className={styles.badge} title="Завершено">{total} эп.</span> : <span className={styles.badge} title="Вышло">Вышло</span>; if (status === 'ongoing') { const a=aired??'?'; const t=total??'?'; const p=(a!=='?'&&a===t&&t!=='?')?`${a}`:`${a}/${t}`; return <span className={`${styles.badge} ${styles.ongoingBadge}`} title="Онгоинг">{p} эп.</span>; } if (status === 'anons') return <span className={`${styles.badge} ${styles.anonsBadge}`} title="Анонс">Анонс</span>; if (total && total > 0) return <span className={styles.badge}>{total} эп.</span>; return null; };

const AnimeCard = ({ anime }) => {
    // Проверка данных Shikimori
    if (!anime || !anime.id || !(anime.russian || anime.name)) {
        if (import.meta.env.DEV) console.warn("[AnimeCard] Получены неполные данные Shikimori:", anime);
        return null;
    }

    const relativePosterUrl = anime.image?.original || anime.image?.preview;
    const posterUrl = relativePosterUrl ? `${SHIKIMORI_URL_PREFIX}${relativePosterUrl}` : '/placeholder-poster.png';
    const linkTo = `/anime/${anime.id}`;
    const displayTitle = anime.russian || anime.name;
    const fullTitleForHint = anime.name || anime.russian;
    const displayKind = anime.kind;
    const displayYear = anime.aired_on ? new Date(anime.aired_on).getFullYear() : null;
    const displayRating = anime.score;
    const status = anime.status;
    const airedEpisodes = anime.episodes_aired;
    const totalEpisodes = anime.episodes;

    return (
        <Link to={linkTo} className={styles.cardLink} title={fullTitleForHint}>
            <article className={styles.card}>
                <div className={styles.posterWrapper}>
                    <img key={posterUrl} src={posterUrl} alt={`Постер ${displayTitle}`} className={styles.poster} loading="lazy" onError={(e) => { if (e.target.src !== '/placeholder-poster.png') e.target.src = '/placeholder-poster.png'; }}/>
                    <RatingBadge rating={displayRating} />
                </div>
                <div className={styles.info}>
                    <div className={styles.titleSeasonWrapper}> <h3 className={styles.title}>{displayTitle}</h3> </div>
                    <div className={styles.meta}>
                        <AnimeFormatBadge kind={displayKind} />
                        {displayYear && <AnimeYearBadge year={displayYear} />}
                        <EpisodeStatusBadge status={status} aired={airedEpisodes} total={totalEpisodes} />
                    </div>
                </div>
            </article>
        </Link>
    );
};
export default AnimeCard;