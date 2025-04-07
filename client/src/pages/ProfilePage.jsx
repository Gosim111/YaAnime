// [client/src/pages/ProfilePage.jsx]

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfileByTagPart } from '../services/userApi';
import { useAuth } from '/src/context/AuthContext.jsx';
import OverviewTab from '../components/Profile/OverviewTab';
import AnimeListContainerTab from '../components/Profile/AnimeListContainerTab';
import ReviewsTab from '../components/Profile/ReviewsTab';
import ActivityTab from '../components/Profile/ActivityTab';
import FriendsModal from '../components/Profile/FriendsModal';
import styles from './ProfilePage.module.css';
import homeStyles from './HomePage.module.css';

// --- Иконки ---
const HomeIcon = () => <svg className={styles.tabIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const ListIcon = () => <svg className={styles.tabIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const ReviewsIcon = () => <svg className={styles.tabIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.54.044.77.77.364 1.118l-3.976 3.573a.563.563 0 00-.162.505l1.08 5.422c.123.616-.448 1.095-1.008.784l-4.934-2.905a.563.563 0 00-.556 0l-4.934 2.905c-.56.31-.1132.168-1.008-.784l1.08-5.422a.563.563 0 00-.162-.505l-3.976-3.573c-.407-.348-.176-1.074.364-1.118l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const ActivityIcon = () => <svg className={styles.tabIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.125 1.125 0 010 2.25H5.625a1.125 1.125 0 010-2.25z" /></svg>;
const SettingsIconGear = () => <svg className={styles.buttonIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.333.184-.583.496-.646.87l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.646-.87-.074-.04-.147-.083-.22-.127a6.501 6.501 0 01-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.298-2.247a1.125 1.125 0 011.37-.491l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.333-.184.583-.496.646-.87l.213-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MessageIcon = () => <svg className={styles.buttonIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const FriendsIcon = () => <svg className={styles.buttonIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.243-4.243A11.25 11.25 0 0112 15c-2.432 0-4.685-.64-6.534-1.735M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 6a9 9 0 110-18 9 9 0 010 18z" /></svg>;
// --- Конец иконок ---

const profileTabs = [
    { key: 'overview', label: 'Обзор', icon: HomeIcon },
    { key: 'anime_list', label: 'Список аниме', icon: ListIcon },
    { key: 'reviews', label: 'Обзоры', icon: ReviewsIcon },
    { key: 'activity', label: 'Активность', icon: ActivityIcon },
];

const ProfilePage = () => {
    const { tagPart } = useParams();
    const { user: currentUser, isAuthenticated } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeMainTab, setActiveMainTab] = useState(profileTabs[0].key);
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!tagPart) { setError('Тег пользователя не найден в URL'); setIsLoading(false); return; }
            setIsLoading(true); setError(null); setProfileData(null);
            try {
                const data = await getUserProfileByTagPart(tagPart);
                setProfileData({ ...data, friendsCount: 42 });
            } catch (err) {
                console.error("Ошибка загрузки профиля:", err);
                if (err.message === 'Пользователь не найден' || err.message.includes('404')) { setError(`Профиль с тегом "@${tagPart}" не найден.`); } else { setError(err.message || 'Не удалось загрузить профиль'); }
            } finally { setIsLoading(false); }
        };
        fetchProfile();
        window.scrollTo({ top: 0, behavior: 'auto' });
        setActiveMainTab(profileTabs[0].key);
        setIsFriendsModalOpen(false);
    }, [tagPart]);

    const isCurrentUserProfile = isAuthenticated && profileData && currentUser?.tag === profileData.tag;

    if (isLoading) { return <div className={homeStyles.loading}>Загрузка профиля...</div>; }
    if (error) { const ErrorComponent = ({ children }) => ( error.includes('не найден') ? <div className={homeStyles.notFound}>{children}</div> : <div className={homeStyles.error}>{children}</div> ); return <ErrorComponent>{error}</ErrorComponent>; }
    if (!profileData) { return <div className={homeStyles.notFound}>Не удалось загрузить данные профиля.</div>; }

    const displayName = profileData.nickname || profileData.tag;
    const registrationDate = profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Неизвестно';
    const profileLink = `/profile/${tagPart}`;

    return (
        <div className={styles.profilePage}>
            <div className={styles.profileCover}>
                <img src={profileData.cover || '/default-cover.jpg'} alt="Обложка профиля" className={styles.coverImage} onError={(e) => { e.target.onerror = null; e.target.src='/default-cover.jpg'; }} />
                <div className={styles.coverOverlay}></div>
            </div>

            <div className={styles.profileBody}>
                <div className={styles.profileHeader}>
                    <div className={styles.profileHeaderLeft}>
                        <Link to={profileLink} className={styles.avatarLinkWrapper} title={`Профиль ${displayName}`}>
                            <img src={profileData.avatar || '/default-avatar.png'} alt={`Аватар ${displayName}`} className={styles.avatar} onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }} />
                            <div className={styles.onlineStatusIndicator} title="Сейчас онлайн"></div>
                        </Link>
                    </div>
                    <div className={styles.profileHeaderCenter}>
                        <div className={styles.nameAndDate}>
                            <Link to={profileLink} className={styles.nameLinkWrapper}>
                                <h1 className={styles.nickname}>{displayName}</h1>
                                {profileData.nickname && <p className={styles.tag}>{profileData.tag}</p>}
                            </Link>
                            <p className={styles.registrationDate}>На сайте с {registrationDate}</p>
                        </div>
                    </div>
                    <div className={styles.profileHeaderRight}>
                        <div className={styles.statsContainer}>
                            <div className={styles.statItem} title="Всего просмотрено аниме"> <span className={styles.statValue}>125</span> <span className={styles.statLabel}>Просмотрено</span> </div>
                            <div className={styles.statItem} title="Средняя оценка"> <span className={styles.statValue}>8.5</span> <span className={styles.statLabel}>Ср. оценка</span> </div>
                            <button className={`${styles.statItem} ${styles.statButton}`} title="Показать друзей" onClick={() => setIsFriendsModalOpen(true)}>
                                <FriendsIcon /> {/* Иконка для друзей */}
                                <span className={styles.statValue}>{profileData.friendsCount || 0}</span>
                                {/* <span className={styles.statLabel}>Друзей</span> */}
                            </button>
                        </div>
                        <div className={styles.actionsContainer}>
                            {isCurrentUserProfile ? (
                                <Link to="/settings" className={`${styles.actionButton} ${styles.settingsButton}`}> <SettingsIconGear /> Настроить </Link>
                            ) : (
                                <>
                                    <button className={`${styles.actionButton} ${styles.messageButton}`}> <MessageIcon /> Написать </button>
                                    <button className={`${styles.actionButton} ${styles.followButton}`}> Подписаться </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.profileContentTabsContainer}>
                    <div className={styles.profileTabsNav}>
                        {profileTabs.map(tab => { const Icon = tab.icon; return ( <button key={tab.key} className={`${styles.mainTabButton} ${activeMainTab === tab.key ? styles.mainTabButtonActive : ''}`} onClick={() => setActiveMainTab(tab.key)}> {Icon && <Icon />} {tab.label} </button> ); })}
                    </div>
                    <div className={styles.profileTabContent}>
                        {activeMainTab === 'overview' && <OverviewTab profileData={profileData} isCurrentUserProfile={isCurrentUserProfile}/>}
                        {activeMainTab === 'anime_list' && <AnimeListContainerTab tagPart={tagPart} />}
                        {activeMainTab === 'reviews' && <ReviewsTab tagPart={tagPart} />}
                        {activeMainTab === 'activity' && <ActivityTab tagPart={tagPart} isCurrentUserProfile={isCurrentUserProfile}/>}
                    </div>
                </div>
            </div>

            <FriendsModal
                isOpen={isFriendsModalOpen}
                onClose={() => setIsFriendsModalOpen(false)}
                userTag={profileData.tag}
            />
        </div>
    );
};

export default ProfilePage;