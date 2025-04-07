// [client/src/components/Profile/FriendsModal.jsx]

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../Modal/Modal';
import styles from './FriendsModal.module.css';

const dummyFriends = [ { id: '1', tag: '@friend_one', nickname: 'Best Friend', avatar: '/default-avatar.png', isOnline: true }, { id: '2', tag: '@another_user', nickname: null, avatar: '/default-avatar.png', isOnline: false }, { id: '3', tag: '@cool_guy_123', nickname: 'Cool Guy', avatar: '/default-avatar.png', isOnline: true }, { id: '4', tag: '@anime_lover', nickname: 'Anime Lover', avatar: '/default-avatar.png', isOnline: false }, { id: '5', tag: '@zeta_user', nickname: 'Zeta', avatar: '/default-avatar.png', isOnline: true }, { id: '6', tag: '@long_nickname_test', nickname: 'VeryLongNicknameIndeedYes', avatar: '/default-avatar.png', isOnline: false }, { id: '7', tag: '@online_no_nick', nickname: null, avatar: '/default-avatar.png', isOnline: true }, ];

const FriendsModal = ({ isOpen, onClose, userTag }) => {
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('online');

    useEffect(() => { if (isOpen) { setIsLoading(true); setError(null); setSearchTerm(''); setSortBy('online'); const timer = setTimeout(() => { setFriends(dummyFriends); setIsLoading(false); }, 300); return () => clearTimeout(timer); } }, [isOpen, userTag]);

    const filteredAndSortedFriends = useMemo(() => {
        let result = friends.filter(friend => friend.tag.toLowerCase().includes(searchTerm.toLowerCase().replace('@', '')) || (friend.nickname && friend.nickname.toLowerCase().includes(searchTerm.toLowerCase())));
        result.sort((a, b) => { if (sortBy === 'online') { if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1; return a.tag.localeCompare(b.tag); } else if (sortBy === 'tag_asc') { return a.tag.localeCompare(b.tag); } else if (sortBy === 'tag_desc') { return b.tag.localeCompare(a.tag); } return 0; });
        return result;
    }, [friends, searchTerm, sortBy]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Друзья ${userTag}`}>
            <div className={styles.friendsContainer}>
                <div className={styles.controls}> <input type="search" placeholder="Поиск по тегу или нику..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} /> <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect} > <option value="online">Сначала онлайн</option> <option value="tag_asc">Тег А-Я</option> <option value="tag_desc">Тег Я-А</option> </select> </div>
                {isLoading && <div className={styles.loading}>Загрузка...</div>}
                {error && <div className={styles.error}>{error}</div>}
                {!isLoading && !error && filteredAndSortedFriends.length === 0 && ( <div className={styles.noFriends}> {searchTerm ? 'Друзья не найдены' : 'Список друзей пуст'} </div> )}
                {!isLoading && !error && filteredAndSortedFriends.length > 0 && (
                    <ul className={styles.friendsList}>
                        {filteredAndSortedFriends.map(friend => (
                            <li key={friend.id} className={styles.friendItem}>
                                <Link to={`/profile/${friend.tag.substring(1)}`} className={styles.friendLinkWrapper} onClick={onClose}>
                                    <div className={styles.friendAvatarWrapper}> <img src={friend.avatar} alt="" className={styles.friendAvatar} onError={(e) => { e.target.onerror = null; e.target.src='/default-avatar.png'; }} /> {friend.isOnline && <div className={styles.friendOnlineIndicator}></div>} </div>
                                    <div className={styles.friendInfo}> <span className={styles.friendNickname}>{friend.nickname || friend.tag}</span> {friend.nickname && <span className={styles.friendTag}>{friend.tag}</span>} </div>
                                </Link>
                                <div className={styles.friendActions}> {/* <button className={styles.actionButton} title="Написать сообщение">✉️</button> */} {/* <button className={styles.actionButton} title="Удалить из друзей">❌</button> */} </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
};
export default FriendsModal;