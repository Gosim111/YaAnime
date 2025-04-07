// [client/src/components/Profile/OverviewTab.jsx]

import React, { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // ! Импортируем Link
import styles from './OverviewTab.module.css';

// Иконки для виджетов
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.widgetIcon}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CheckBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.widgetIcon}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.widgetIcon}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5h16.5M3.75 19.5h16.5M5.625 17.25h12.75M7.5 14.25h9M9.375 11.25h5.25M11.25 8.25h1.5M13.125 5.25h-1.5" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.widgetIcon}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.54.044.77.77.364 1.118l-3.976 3.573a.563.563 0 00-.162.505l1.08 5.422c.123.616-.448 1.095-1.008.784l-4.934-2.905a.563.563 0 00-.556 0l-4.934 2.905c-.56.31-.1132.168-1.008-.784l1.08-5.422a.563.563 0 00-.162-.505l-3.976-3.573c-.407-.348-.176-1.074.364-1.118l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.widgetIcon}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.976.634h6.274a.75.75 0 00.634-.976L9.717 3.239a.75.75 0 00-.95-.826L3.105 2.29z" /><path d="M16.736 8.035a.75.75 0 01.193.531v2.868a.75.75 0 01-.86.744l-5.012-.501a.75.75 0 00-.67.378l-1.494 2.49a.75.75 0 01-1.293-.776l1.196-3.987a.75.75 0 00-.296-.713l-3.495-2.796a.75.75 0 01.49-.13h3.212a.75.75 0 00.713-.537l1.196-3.987a.75.75 0 011.49.001l1.196 3.987a.75.75 0 00.713.537h3.213a.75.75 0 01.567.933z" /></svg>;

const autoResizeTextarea = (element) => { if (element) { element.style.height = 'auto'; const newHeight = Math.max(element.scrollHeight, 54); element.style.height = `${newHeight}px`; } };

const PostInput = ({ isCurrentUserProfile }) => {
    const textareaRef = useRef(null);
    const handleTextareaInput = useCallback(() => { autoResizeTextarea(textareaRef.current); }, []);
    useEffect(() => {}, []);
    if (!isCurrentUserProfile) return null;
    return (
        <div className={styles.postInputContainer}>
            <textarea ref={textareaRef} onInput={handleTextareaInput} placeholder="Что нового?" rows="1" className={styles.postTextarea} maxLength={500} />
            <button className={styles.postSubmitButton} title="Опубликовать"><SendIcon /></button>
        </div>
    );
};

const OverviewTab = ({ profileData, isCurrentUserProfile }) => {
    if (!profileData) return null;
    const userTagPart = profileData.tag.substring(1);

    return (
        <div className={styles.overviewContainer}>
            {/* Левая колонка (Посты/Лента) */}
            <div className={styles.feedColumn}>
                <PostInput isCurrentUserProfile={isCurrentUserProfile} />
                {/* Лента постов/активности */}
                {/* <h3 className={styles.feedTitle}>Посты и Активность</h3> */}
                <div className={styles.feedItemList}>
                    <div className={styles.feedItem}> <span className={styles.feedItemIcon}>▶️</span> <div className={styles.feedItemText}> Начал(а) смотреть <b>Attack on Titan</b> </div> <span className={styles.feedItemTimestamp}>2 ч</span> </div>
                    <div className={styles.feedItem}> <span className={styles.feedItemIcon}>✍️</span> <div className={styles.feedItemText}> Написал(а) пост: "Только что досмотрел Your Name, это шедевр! Эмоции переполняют..." </div> <span className={styles.feedItemTimestamp}>Вчера</span> </div>
                    <div className={styles.feedItem}> <span className={styles.feedItemIcon}>⭐</span> <div className={styles.feedItemText}> Оценил(а) <b>Your Name</b> на <b className={styles.ratingHighlight}>10/10</b> </div> <span className={styles.feedItemTimestamp}>Вчера</span> </div>
                    <div className={styles.feedItem}> <span className={styles.feedItemIcon}>✅</span> <div className={styles.feedItemText}> Завершил(а) просмотр <b>Vinland Saga Season 2</b> </div> <span className={styles.feedItemTimestamp}>3 д</span> </div>
                    <div className={styles.feedItem}> <span className={styles.feedItemIcon}>💬</span> <div className={styles.feedItemText}> Написал(а) комментарий в теме <b>"Лучший опенинг сезона"</b> </div> <span className={styles.feedItemTimestamp}>4 д</span> </div>
                </div>
                <button className={styles.loadMoreButton}>Загрузить еще</button>
            </div>

            {/* Правая колонка (Виджеты/Сайдбар) */}
            <div className={styles.sidebarColumn}>
                <div className={`${styles.widget} ${styles.aboutWidget}`}>
                    <h4 className={styles.widgetTitle}><UserCircleIcon/> О себе</h4>
                    <div className={styles.widgetContent}> <p className={styles.bioText}> {profileData.bio || 'Пользователь пока ничего не рассказал о себе.'} </p> </div>
                </div>
                <div className={`${styles.widget} ${styles.watchingWidget}`}>
                    <h4 className={styles.widgetTitle}><EyeIcon/> Сейчас смотрит (3)</h4>
                    <div className={styles.widgetContentGrid}>
                        <div className={styles.miniAnimeCardPlaceholder} title="Anime 1"></div>
                        <div className={styles.miniAnimeCardPlaceholder} title="Anime 2"></div>
                        <div className={styles.miniAnimeCardPlaceholder} title="Anime 3"></div>
                    </div>
                    <Link to={`/profile/${userTagPart}/list?status=watching`} className={styles.widgetMoreLink}>Весь список</Link>
                </div>
                <div className={`${styles.widget} ${styles.recentRatingsWidget}`}>
                    <h4 className={styles.widgetTitle}><StarIcon/> Недавние оценки</h4>
                    <div className={styles.widgetContentList}>
                        <div className={styles.ratingItem}><span>Your Name</span> <span>10</span></div>
                        <div className={styles.ratingItem}><span>Vinland Saga S2</span> <span>9</span></div>
                        <div className={styles.ratingItem}><span>Oshi no Ko</span> <span>8</span></div>
                    </div>
                </div>
                <div className={`${styles.widget} ${styles.statsWidget}`}>
                    <h4 className={styles.widgetTitle}><ChartBarIcon/> Любимые жанры</h4>
                    <div className={styles.widgetContentTags}>
                        <span className={styles.genreTag}>Сёнен (35)</span>
                        <span className={styles.genreTag}>Фэнтези (28)</span>
                        <span className={styles.genreTag}>Приключения (25)</span>
                        <span className={styles.genreTag}>Драма (20)</span>
                        <span className={styles.genreTag}>Комедия (18)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;