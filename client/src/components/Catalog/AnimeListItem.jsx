// [client/src/components/Catalog/AnimeListItem.jsx]
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AnimeListItem.module.css';
import AnimeCardStyles from '../AnimeCard/AnimeCard.module.css'; // Для бейджей

const SHIKIMORI_URL_PREFIX = 'https://shikimori.one';

// Используем те же компоненты бейджей, что и в AnimeCard
const { AnimeFormatBadge, AnimeYearBadge, RatingBadge, EpisodeStatusBadge } = {
    AnimeFormatBadge: ({ kind }) => { if (!kind) return null; const kindMap={tv:"ТВ",movie:"Фильм",ova:"OVA",ona:"ONA",special:"Спешл",music:"Клип",tv_13:"ТВ",tv_24:"ТВ",tv_48:"ТВ",tv_special:"Спешл"}; const formatText=kindMap[kind.toLowerCase()]||kind.toUpperCase(); return <span className={AnimeCardStyles.badge} title={`Формат: ${kind}`}>{formatText}</span>; },
    AnimeYearBadge: ({ year }) => { if (!year) return null; return <span className={AnimeCardStyles.badge}>{year}</span>; },
    StarRatingIcon: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.83 4.421a.75.75 0 00.563.41l4.873.709c.845.122 1.183 1.148.557 1.753l-3.526 3.436a.75.75 0 00-.215.664l.832 4.853c.145.84-.734 1.484-1.483 1.098L10.2 17.59a.75.75 0 00-.703 0l-4.34 2.282c-.75.386-1.629-.252-1.484-1.098l.833-4.853a.75.75 0 00-.215-.664l-3.526-3.436c-.626-.605-.288-1.631.557-1.753l4.872-.709a.75.75 0 00.563-.41l1.83-4.421z" clipRule="evenodd" /></svg>,
    RatingBadge: ({ rating }) => { const r=rating?parseFloat(rating).toFixed(1):null; if(!r||r==="0.0")return null; return <div className={styles.ratingItem} title={`Рейтинг: ${r}`}><StarRatingIcon/><span>{r}</span></div>; },
    EpisodeStatusBadge: ({ status, aired, total }) => { if (status === 'released') return total ? <span className={AnimeCardStyles.badge}>{total} эп.</span> : <span className={AnimeCardStyles.badge}>Вышло</span>; if (status === 'ongoing') { const a=aired??'?'; const t=total??'?'; const p=(a!=='?'&&a===t&&t!=='?')?`${a}`:`${a}/${t}`; return <span className={`${AnimeCardStyles.badge} ${AnimeCardStyles.ongoingBadge}`}>{p} эп.</span>; } if (status === 'anons') return <span className={`${AnimeCardStyles.badge} ${AnimeCardStyles.anonsBadge}`}>Анонс</span>; return null; }
};


const AnimeListItem = ({ anime }) => {
    if (!anime || !anime.id || !(anime.russian || anime.title || anime.name)) {
        return null;
    }

    const relativePosterUrl = anime.image?.preview || anime.image?.original; // Меньший постер для списка
    const posterUrl = relativePosterUrl ? `${SHIKIMORI_URL_PREFIX}${relativePosterUrl}` : '/placeholder-poster.png';
    const linkTo = `/anime/${anime.id}`;
    const displayTitle = anime.russian || anime.title || anime.name;
    const displayKind = anime.kind;
    const displayYear = anime.aired_on ? new Date(anime.aired_on).getFullYear() : null;
    const displayRating = anime.score;
    const status = anime.status;
    const airedEpisodes = anime.episodes_aired;
    const totalEpisodes = anime.episodes;
    const studios = anime.studios?.map(s => s.name).join(', ') || '';
    // Описание: берем начало и обрезаем (можно сделать опциональным)
    const description = anime.description ? anime.description.replace(/\[.*?\]/g, '').substring(0, 150) + '...' : '';

    return (
        <div className={styles.listItem}>
            <Link to={linkTo} className={styles.posterLink}>
                <img
                    src={posterUrl}
                    alt={`Постер ${displayTitle}`}
                    loading="lazy"
                    className={styles.poster}
                    onError={(e) => { if (e.target.src !== '/placeholder-poster.png') e.target.src = '/placeholder-poster.png'; }}
                />
            </Link>
            <div className={styles.infoBlock}>
                <Link to={linkTo} className={styles.titleLink}>
                    <h3 className={styles.title}>{displayTitle}</h3>
                </Link>
                <div className={styles.metaBadges}>
                    <AnimeFormatBadge kind={displayKind} />
                    {displayYear && <AnimeYearBadge year={displayYear} />}
                    <EpisodeStatusBadge status={status} aired={airedEpisodes} total={totalEpisodes} />
                </div>
                {studios && <p className={styles.studios}>Студия: {studios}</p>}
                {description && <p className={styles.description}>{description}</p>}
            </div>
            <div className={styles.ratingBlock}>
                <RatingBadge rating={displayRating} />
                {/* Можно добавить другие элементы сюда */}
            </div>
        </div>
    );
};

export default AnimeListItem;