// [client/src/components/Profile/AnimeListItem.jsx]

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AnimeListItem.module.css';

const AnimeListItem = ({ anime }) => {
    if (!anime) return null;
    const title = anime.title || 'Нет названия';
    const posterUrl = anime.posterImage?.tiny || anime.posterImage?.small || '/placeholder-poster.png';
    const kitsuId = anime.kitsuId;
    const linkTo = `/anime/${kitsuId}${anime.slug ? `/${anime.slug}` : ''}`;
    const statusTextMap = { watching: 'Смотрю', planned: 'В планах', completed: 'Просмотрено', on_hold: 'Отложено', dropped: 'Брошено', };
    const displayStatus = statusTextMap[anime.status] || anime.status;
    let displayProgress = '';
    // ! Используем обогащенные данные (если они есть) для totalEpisodes
    const totalEpisodes = anime.episodeCount; // Поле episodeCount должно приходить от API в обогащенном виде
    if (anime.status === 'watching' || anime.status === 'on_hold') {
        displayProgress = totalEpisodes ? `${anime.progress} / ${totalEpisodes}` : `${anime.progress} эп.`;
    } else if (anime.status === 'completed') {
        displayProgress = totalEpisodes ? `${totalEpisodes} эп.` : 'Завершено';
    }
    const displayRating = anime.rating ? `⭐ ${anime.rating}` : '–';
    const statusClass = anime.status ? styles[`status_${anime.status}`] : '';

    return (
        <li className={`${styles.listItem} ${statusClass}`}>
            <img src={posterUrl} alt="" className={styles.itemPoster} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-poster.png'; }} />
            <div className={styles.itemInfo}> <Link to={linkTo} className={styles.itemTitleLink} title={title}> {title} </Link> </div>
            <div className={styles.itemStatus}>{displayStatus}</div>
            <div className={styles.itemProgress}>{displayProgress}</div>
            <div className={styles.itemRating} data-value={displayRating}>{displayRating}</div>
        </li>
    );
};
export default AnimeListItem;