import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthForm.module.css';

// type: 'login' | 'register'
const AuthForm = ({ children, title, onSubmit, error, isLoading, type }) => {
    return (
        <div className={styles.authContainer}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>{title}</h1>
                <form onSubmit={onSubmit} className={styles.form}>
                    {children} {/* Сюда будут вставляться поля формы */}

                    {/* Отображение ошибки */}
                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : (type === 'login' ? 'Войти' : 'Зарегистрироваться')}
                    </button>
                </form>

                {/* Ссылки для перехода между входом и регистрацией */}
                <div className={styles.switchLink}>
                    {type === 'login' ? (
                        <>
                            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                        </>
                    ) : (
                        <>
                            Уже есть аккаунт? <Link to="/login">Войти</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthForm;