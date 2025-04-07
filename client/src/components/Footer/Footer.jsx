import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={`${styles.container} ${styles.footerContainer}`}>
                <p>© {new Date().getFullYear()} YaAnime. Почти все права защищены.</p>
                {/* Можно добавить ссылки */}
            </div>
        </footer>
    );
};

export default Footer;