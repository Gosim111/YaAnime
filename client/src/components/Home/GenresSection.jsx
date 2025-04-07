// [client/src/components/Home/GenresSection.jsx]

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/HomePage.module.css'; // Используем стили главной
import TagIcon from '../../assets/icons/TagIcon';

const GenresSection = ({ genres, isLoading, error }) => {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false); // Состояние для анимации

    // Observer только для анимации
    useEffect(() => {
        const observerOptions = { threshold: 0.1 };
        const observerCallback = (entries, observerInstance) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsVisible(true); // Активируем анимацию
                    observerInstance.unobserve(entry.target); // Отписываемся
                }
            });
        };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const currentRef = sectionRef.current;
        if (currentRef) { observer.observe(currentRef); }
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []); // Пустая зависимость

    const renderGenres = () => {
        if (isLoading) return <div className={styles.loading}>Загрузка жанров...</div>;
        if (error) return <div className={styles.error}>Ошибка загрузки жанров: {error.message}</div>;
        if (!genres || genres.length === 0) return <div className={styles.notFound}>Жанры не найдены.</div>;

        return genres.map((genre, index) => (
            <Link
                key={genre.id}
                to={`/catalog?genre=${genre.id}`}
                className={styles.genreChip}
                // Анимация применяется через родительский .sectionVisible
                style={{ animationDelay: `${index * 0.04}s` }}
            >
                {genre.russian || genre.name}
            </Link>
        ));
    };

    return (
        // Добавляем ref и классы видимости для анимации чипов
        <section ref={sectionRef} className={`${styles.genresSection} ${isVisible ? styles.sectionVisible : styles.sectionHidden}`}>
            <h3 className={styles.genresTitle}>
                <TagIcon size={18} /> Популярные Жанры
            </h3>
            <div className={styles.genresContainer}>
                {renderGenres()}
            </div>
        </section>
    );
};

export default GenresSection;