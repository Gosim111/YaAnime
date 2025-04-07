// [client/src/components/Header/Header.jsx]

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import MenuIcon from '../../assets/icons/MenuIcon'; // Иконка бургера
import CloseIcon from '../../assets/icons/CloseIcon'; // Иконка крестика

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Закрывать меню при смене роута
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Блокировка/разблокировка скролла body
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }
        // Очистка класса при размонтировании
        return () => document.body.classList.remove('menu-open');
    }, [isMenuOpen]);


    return (
        <>
            <header className={styles.header}>
                <div className={styles.container}>
                    <NavLink to="/" className={styles.logo}> Ya<span className={styles.logoAccent}>Anime</span> </NavLink>

                    {/* Навигация для десктопа */}
                    <nav className={`${styles.nav} ${styles.desktopNav}`}>
                        <NavLink to="/catalog" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}> Каталог </NavLink>
                        <NavLink to="/forum" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}> Форум </NavLink>
                    </nav>

                    <div className={styles.actionsContainer}>
                        {/* TODO: Поиск и кнопки пользователя */}
                        <div className={styles.userActionsPlaceholder}></div>

                        {/* Кнопка Бургера */}
                        <button className={styles.burgerButton} onClick={toggleMenu} aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={isMenuOpen}>
                            {isMenuOpen ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Мобильное меню (панель) */}
            <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <nav className={styles.mobileNavLinks}>
                    <NavLink to="/" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink} onClick={toggleMenu}> Главная </NavLink>
                    <NavLink to="/catalog" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink} onClick={toggleMenu}> Каталог </NavLink>
                    <NavLink to="/forum" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink} onClick={toggleMenu}> Форум </NavLink>
                    {/* Добавить ссылки на логин/регистрацию/профиль */}
                    <NavLink to="/login" className={styles.mobileNavLink} onClick={toggleMenu}> Войти </NavLink>
                </nav>
            </div>

            {/* Оверлей для закрытия меню */}
            {isMenuOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}
        </>
    );
};

export default Header;