import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm/AuthForm';
import styles from '../components/AuthForm/AuthForm.module.css';
import { registerUser } from '../services/authApi';
import { useAuth } from '/src/context/AuthContext.jsx';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        tagPart: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const { tagPart, email, password, confirmPassword } = formData;

    const onChange = (e) => {
        let { name, value } = e.target;
        if (name === 'tagPart') {
            value = value.replace(/[^a-zA-Z0-9_]/g, '');
        }
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const fullTag = tagPart ? `@${tagPart}` : '';

        // Валидация
        if (!tagPart || !email || !password || !confirmPassword) {
            setError('Все поля обязательны для заполнения');
            return;
        }
        if (!/^@[a-zA-Z0-9_]{3,20}$/.test(fullTag) || !/[a-zA-Z]/.test(tagPart)) {
            setError('Неверный формат тега. Требования: 3-20 символов (латиница, цифры, _), должна быть хотя бы одна буква.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Введите корректный email');
            return;
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }

        setIsLoading(true);

        try {
            // --- ИЗМЕНЕНИЕ: Передаем объект с tagPart ---
            const response = await registerUser({ tagPart, email, password });
            // --- Конец изменения ---

            if (import.meta.env.DEV) {
                console.log('Ответ API регистрации:', response);
            }
            login(response.user, response.token);
            navigate('/');

        } catch (apiError) {
            console.error('Ошибка регистрации:', apiError);
            setError(apiError.message || 'Ошибка регистрации. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthForm
            title="Регистрация"
            onSubmit={onSubmit}
            error={error}
            isLoading={isLoading}
            type="register"
        >
            {/* Поле Тег */}
            <div className={styles.inputGroup}>
                <label htmlFor="tagPart" className={styles.label}>Тег пользователя</label>
                <div className={styles.inputPrefixWrapper}>
                    <span className={styles.inputPrefix}>@</span>
                    <input
                        type="text"
                        id="tagPart"
                        name="tagPart"
                        value={tagPart}
                        onChange={onChange}
                        className={styles.input}
                        required
                        minLength="3"
                        maxLength="20"
                        placeholder="your_unique_tag"
                        title="3-20 символов: латиница, цифры, _"
                        autoComplete="username"
                    />
                </div>
            </div>

            {/* Поля Email и Пароли */}
            <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    className={`${styles.input} ${styles.standalone}`}
                    required
                    autoComplete="email"
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Пароль</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className={`${styles.input} ${styles.standalone}`}
                    required
                    minLength="6"
                    autoComplete="new-password"
                />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Подтвердите пароль</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
                    className={`${styles.input} ${styles.standalone}`}
                    required
                    minLength="6"
                    autoComplete="new-password"
                />
            </div>
        </AuthForm>
    );
};

export default RegisterPage;