// [client/src/components/Profile/AnimeListContainerTab.jsx]

import React, { useState, useMemo, useEffect } from 'react';
import AnimeCard from '../AnimeCard/AnimeCard';
import AnimeListItem from './AnimeListItem';
import styles from '../../pages/ProfilePage.module.css';
import listStyles from './AnimeListItem.module.css';
import homeStyles from '../../pages/HomePage.module.css';
import { fetchUserAnimeList } from '../../services/listApi';

const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zM2 13.25A2.25 2.25 0 014.25 11h2.5A2.25 2.25 0 019 13.25v2.5A2.25 2.25 0 016.75 18h-2.5A2.25 2.25 0 012 15.75v-2.5zM11 4.25A2.25 2.25 0 0113.25 2h2.5A2.25 2.25 0 0118 4.25v2.5A2.25 2.25 0 0115.75 9h-2.5A2.25 2.25 0 0111 6.75v-2.5zM13.25 11A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" /></svg>;
const ListIconBars = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;

const AnimeListContainerTab = ({ tagPart }) => {
    const listStatuses = [
        { key: 'watching', label: 'Смотрю', count: 12 }, { key: 'planned', label: 'Запланировано', count: 30 },
        { key: 'completed', label: 'Просмотрено', count: 125 }, { key: 'on_hold', label: 'Отложено', count: 5 },
        { key: 'dropped', label: 'Брошено', count: 8 },
    ];
    const [activeStatusTab, setActiveStatusTab] = useState(listStatuses[0].key);
    const [viewMode, setViewMode] = useState('grid');
    const [sortOrder, setSortOrder] = useState('updated_at_desc');
    const [animeList, setAnimeList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadList = async () => {
            setIsLoading(true); setError(null); setAnimeList([]);
            try { const data = await fetchUserAnimeList(tagPart, activeStatusTab); if (isMounted) { setAnimeList(data || []); } }
            catch (err) { if (isMounted) { console.error(`[AnimeListContainer ${activeStatusTab}] Ошибка загрузки:`, err); setError(err.message || "Ошибка загрузки списка"); } }
            finally { if (isMounted) setIsLoading(false); }
        };
        loadList();
        return () => { isMounted = false; };
    }, [tagPart, activeStatusTab]);

    const sortedList = useMemo(() => {
        const listToSort = [...animeList];
        listToSort.sort((a, b) => {
            switch (sortOrder) {
                case 'updated_at_desc': return (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
                case 'score_desc': return (b.rating ?? -1) - (a.rating ?? -1);
                case 'score_asc': return (a.rating ?? 11) - (b.rating ?? 11);
                case 'title_asc': return (a.title || '').localeCompare(b.title || '');
                case 'title_desc': return (b.title || '').localeCompare(a.title || '');
                case 'added_at_desc': return (b.addedAt ? new Date(b.addedAt).getTime() : 0) - (a.addedAt ? new Date(a.addedAt).getTime() : 0);
                default: return 0;
            }
        });
        return listToSort;
    }, [animeList, sortOrder]);

    const activeStatusInfo = listStatuses.find(s => s.key === activeStatusTab);
    const statusLabel = activeStatusInfo?.label || activeStatusTab;

    return (
        <div className={styles.listTabContentWrapper}>
            <div className={styles.listToolbar}>
                <div className={styles.viewModeToggle}> <button className={`${styles.toolButton} ${viewMode === 'grid' ? styles.toolButtonActive : ''}`} onClick={() => setViewMode('grid')} title="Вид: Сетка"><GridIcon /></button> <button className={`${styles.toolButton} ${viewMode === 'list' ? styles.toolButtonActive : ''}`} onClick={() => setViewMode('list')} title="Вид: Список"><ListIconBars /></button> </div>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={styles.listSortSelect}> <option value="updated_at_desc">Сортировка: Недавние</option> <option value="score_desc">Сортировка: Оценка ↓</option> <option value="score_asc">Сортировка: Оценка ↑</option> <option value="title_asc">Сортировка: Название А-Я</option> <option value="title_desc">Сортировка: Название Я-А</option> <option value="added_at_desc">Сортировка: Дата добавления</option> </select>
            </div>
            <div className={styles.listStatusTabs}> {listStatuses.map(statusInfo => ( <button key={statusInfo.key} className={`${styles.statusTabButton} ${activeStatusTab === statusInfo.key ? styles.statusTabButtonActive : ''}`} onClick={() => setActiveStatusTab(statusInfo.key)}> {statusInfo.label} <span className={styles.statusCount}>({statusInfo.count})</span> </button> ))} </div>
            <div className={styles.statusListContent}>
                {isLoading && <div className={homeStyles.loading} style={{ minHeight: '200px' }}>Загрузка "{statusLabel}"...</div>}
                {error && <div className={homeStyles.error} style={{ minHeight: '150px' }}>{error}</div>}
                {!isLoading && !error && sortedList.length === 0 && ( <div className={styles.placeholderContent} style={{ minHeight: '150px' }}><p>Список "{statusLabel}" пуст.</p></div> )}
                {!isLoading && !error && sortedList.length > 0 && (
                    viewMode === 'grid' ? ( <div className={styles.profileAnimeGrid}> {sortedList.map(animeItem => { const cardData = { id: animeItem.kitsuId, title: animeItem.title, slug: animeItem.slug, posterImage: animeItem.posterImage, startDate: animeItem.startDate, subtype: animeItem.subtype, }; return <AnimeCard key={animeItem.kitsuId} anime={cardData} />; })} </div> )
                        : ( <ul className={listStyles.listWrapper}> {sortedList.map(animeItem => ( <AnimeListItem key={animeItem.kitsuId} anime={animeItem} /> ))} </ul> )
                )}
            </div>
        </div>
    );
};
export default AnimeListContainerTab;