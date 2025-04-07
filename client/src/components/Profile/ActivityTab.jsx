// [client/src/components/Profile/ActivityTab.jsx]

import React from 'react';
import styles from '../../pages/ProfilePage.module.css';

const ActivityTab = ({ tagPart, isCurrentUserProfile }) => {
    return (
        <div className={styles.tabPlaceholder}>
            <h3>⚡ Активность пользователя</h3>
            {isCurrentUserProfile && ( <p>Это ваша полная лента активности. Возможно, здесь будут фильтры.</p> )}
            <div className={styles.feedItem} style={{backgroundColor: 'var(--background-card)'}}> <span className={styles.feedItemIcon}>▶️</span> <div className={styles.feedItemText}>Начал(а) смотреть <b>Attack on Titan</b></div> <span className={styles.feedItemTimestamp}>2 часа назад</span> </div>
            <div className={styles.feedItem} style={{backgroundColor: 'var(--background-card)'}}> <span className={styles.feedItemIcon}>⭐</span> <div className={styles.feedItemText}>Оценил(а) <b>Your Name</b> на <b className={styles.ratingHighlight}>10/10</b></div> <span className={styles.feedItemTimestamp}>Вчера</span> </div>
            <div className={styles.feedItem} style={{backgroundColor: 'var(--background-card)'}}> <span className={styles.feedItemIcon}>✅</span> <div className={styles.feedItemText}> Завершил(а) просмотр <b>Vinland Saga Season 2</b> </div> <span className={styles.feedItemTimestamp}>3 дня назад</span> </div>
            <div className={styles.feedItem} style={{backgroundColor: 'var(--background-card)'}}> <span className={styles.feedItemIcon}>💬</span> <div className={styles.feedItemText}> Написал(а) комментарий в теме <b>"Лучший опенинг сезона"</b> </div> <span className={styles.feedItemTimestamp}>4 дня назад</span> </div>
        </div>
    );
};
export default ActivityTab;