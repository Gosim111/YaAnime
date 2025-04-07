// [client/src/pages/ComingSoonPage.jsx]

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ComingSoonPage.module.css';

const ComingSoonPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <img src="/chibi-wait.png" alt="Ожидание" className={styles.image} />
                <h1 className={styles.title}>Упс! В разработке...</h1>
                <p className={styles.text}>
                    Эта часть сайта пока находится в активной разработке. Мы готовим
                    что-то действительно крутое, так что следите за обновлениями! 😉
                </p>
                <Link to="/" className={styles.homeButton}>
                    Вернуться на главную
                </Link>
            </div>
        </div>
    );
};

export default ComingSoonPage;