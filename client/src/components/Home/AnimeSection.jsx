// [client/src/components/Home/AnimeSection.jsx]

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from '../AnimeCard/AnimeCard'; // Предполагаем, что AnimeCard исправлен и стилизован
import styles from '../../pages/HomePage.module.css'; // Используем стили главной страницы

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y, FreeMode, Pagination } from 'swiper/modules'; // Импортируем нужные модули
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import 'swiper/css/pagination'; // Импортируем стили пагинации

const AnimeSection = ({
                          title, icon: Icon, iconColor,
                          animeList, isLoading, error, // Получает данные как props
                          layout = "grid", gridClass, linkToCatalog, usePagination = false,
                          onVisible // Колбэк, вызываемый при появлении секции
                      }) => {
    const navigationPrevRef = useRef(null);
    const navigationNextRef = useRef(null);
    // УБИРАЕМ ref для пагинации, так как стилизуем стандартный элемент
    // const paginationRef = useRef(null);
    const sectionRef = useRef(null);
    const [isContentVisible, setIsContentVisible] = useState(false); // Для анимации
    const uniqueId = title.replace(/\s+/g, '-').toLowerCase();
    const loadTriggeredRef = useRef(false);

    // Observer для анимации и вызова onVisible
    useEffect(() => {
        const observerOptions = { threshold: 0.1 };
        const observerCallback = (entries, observerInstance) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsContentVisible(true);
                    if (onVisible && typeof onVisible === 'function' && !loadTriggeredRef.current) {
                        console.log(`[AnimeSection: ${title}] Секция видима, вызываем onVisible.`);
                        loadTriggeredRef.current = true;
                        onVisible(); // Вызываем загрузку данных
                    }
                    observerInstance.unobserve(entry.target);
                }
            });
        };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) { observer.observe(currentSectionRef); }
        return () => { if (currentSectionRef) observer.unobserve(currentSectionRef); };
    }, [title, onVisible]);

    // Рендер контента
    const renderContent = () => {
        if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
        if (error) return <div className={styles.error}>Ошибка: {error.message || 'Не удалось загрузить'}</div>;
        if (!animeList || animeList.length === 0) { return <div className={styles.notFound}>Ничего не найдено.</div>; }

        if (layout === "carousel") {
            const swiperModules = [Navigation, A11y, FreeMode];
            if (usePagination) swiperModules.push(Pagination); // Добавляем модуль, если нужен
            return (
                <div className={`${styles.carouselWrapper} ${isContentVisible ? styles.cardsVisible : ''}`}>
                    <Swiper
                        modules={swiperModules}
                        spaceBetween={16} slidesPerView={'auto'}
                        freeMode={{ enabled: true, sticky: false, momentum: false }} // Оставляем без инерции
                        navigation={{ prevEl: navigationPrevRef.current, nextEl: navigationNextRef.current }}
                        // !!! НАСТРОЙКА ПАГИНАЦИИ ДЛЯ SWIPER !!!
                        pagination={usePagination ? {
                            clickable: true, // Делаем точки кликабельными
                            // Swiper сам найдет элемент с классом swiper-pagination
                            // или мы можем стилизовать его через :global в CSS
                            // Задаем кастомные классы для точек, чтобы применить наши стили
                            bulletClass: styles.paginationBullet,
                            bulletActiveClass: styles.paginationBulletActive,
                            renderBullet: (index, className) => `<span class="${className}"></span>` // Важно для кастомных классов
                        } : false}
                        onBeforeInit={(swiper) => {
                            swiper.params.navigation.prevEl = navigationPrevRef.current;
                            swiper.params.navigation.nextEl = navigationNextRef.current;
                            // Не нужно устанавливать pagination.el, Swiper создаст свой
                        }}
                        observer={true} observeParents={true} className={styles.animeSwiper}
                    >
                        {animeList.map((anime, index) => (<SwiperSlide key={anime.id || `slide-${index}`} className={styles.carouselSlide} style={{ animationDelay: `${index * 0.07}s` }}><AnimeCard anime={anime} /></SwiperSlide>))}
                        {/* Swiper сам добавит контейнер для пагинации */}
                    </Swiper>
                    <div ref={navigationPrevRef} className={`swiper-button-prev swiper-button-prev-${uniqueId}`}></div>
                    <div ref={navigationNextRef} className={`swiper-button-next swiper-button-next-${uniqueId}`}></div>
                    {/* Наш контейнер для пагинации больше не нужен */}
                    {/* {usePagination && <div ref={paginationRef} className={styles.carouselPaginationContainer}></div>} */}
                </div>
            );
        }
        // Рендер сетки
        const containerClass = `${styles.animeGrid} ${gridClass || ''}`;
        return (
            <div className={`${containerClass} ${isContentVisible ? styles.cardsVisible : ''}`}>
                {animeList.map((anime, index) => (<div key={anime.id || `grid-${index}`} className={styles.gridItem} style={{ animationDelay: `${index * 0.05}s` }}><AnimeCard anime={anime} /></div>))}
            </div>
        );
    };

    return (<section ref={sectionRef} className={styles.section}><div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>{Icon && <Icon size={20} className={styles.sectionTitleIcon} style={{ color: iconColor || 'var(--accent-1)' }} />} {title}</h2>{linkToCatalog && <Link to={linkToCatalog} className={styles.seeAllLink}><span>Смотреть все</span> <span className={styles.seeAllArrow}>→</span></Link>}</div>{renderContent()}</section>);
};
export default AnimeSection;