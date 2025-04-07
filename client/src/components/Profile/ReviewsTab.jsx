// [client/src/components/Profile/ReviewsTab.jsx]

import React from 'react';
import styles from '../../pages/ProfilePage.module.css';

const ReviewsTab = ({ tagPart }) => {
    return (
        <div className={styles.tabPlaceholder}>
            <h3>📝 Обзоры пользователя</h3>
            <p>Здесь будут отображаться обзоры, написанные пользователем {`@${tagPart}`}.</p>
            <div className={styles.reviewItemPlaceholder}> <h4>Обзор на "Anime Title"</h4> <p>Начало текста обзора... Lorem ipsum dolor sit amet consectetur adipisicing elit...</p> <span>Оценка: 9/10</span> <span>Дата: 10.07.2024</span> </div>
            <div className={styles.reviewItemPlaceholder}> <h4>Обзор на "Another Anime"</h4> <p>Lorem ipsum dolor sit amet...</p> <span>Оценка: 7/10</span> <span>Дата: 05.06.2024</span> </div>
        </div>
    );
};
export default ReviewsTab;