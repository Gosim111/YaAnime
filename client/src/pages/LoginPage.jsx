import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm/AuthForm';
import styles from '../components/AuthForm/AuthForm.module.css'; // Стили из AuthForm
import { loginUser } from '../services/authApi';
import { useAuth } from '/src/context/AuthContext.jsx';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        loginIdentifier: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const { loginIdentifier, password } = formData;

    const onChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'loginIdentifier' ? value.trim() : value;
        setFormData({ ...formData, [name]: finalValue });
        setError('');
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!loginIdentifier || !password) {
            setError('Введите email/тег и пароль');
            return;
        }

        setIsLoading(true);

        try {
            const { token, user } = await loginUser({ loginIdentifier, password });
            if (import.meta.env.DEV) {
                console.log('Ответ API входа:', { token, user });
            }
            login(user, token);
            navigate('/');
        } catch (apiError) {
            console.error('Ошибка входа:', apiError);
            setError(apiError.message || 'Ошибка входа. Проверьте email/тег и пароль.');
        } finally {
            setIsLoading(false);
        }
    };

    // Определяем, вводится email или тег, для отображения префикса @
    const isLikelyTag = loginIdentifier && !loginIdentifier.includes('@') && !loginIdentifier.includes('.');

    return (
        <AuthForm
            title="Вход"
            onSubmit={onSubmit}
            error={error}
            isLoading={isLoading}
            type="login"
        >
            {/* Поле Email или Тег */}
            <div className={styles.inputGroup}>
                <label htmlFor="loginIdentifier" className={styles.label}>Email или Тег</label>
                {/* Используем обертку с префиксом, если похоже на тег */}
                <div className={isLikelyTag ? styles.inputPrefixWrapper : ''}>
                    {isLikelyTag && <span className={styles.inputPrefix}>@</span>}
                    <input
                        type="text"
                        id="loginIdentifier"
                        name="loginIdentifier"
                        value={loginIdentifier}
                        onChange={onChange}
                        // Применяем разные стили в зависимости от того, похоже ли на тег
                        className={`${styles.input} ${!isLikelyTag ? styles.standalone : ''}`}
                        required
                        placeholder="example@mail.com или your_tag"
                        autoComplete="username"
                    />
                </div>
            </div>

            {/* Поле Пароль */}
            <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>Пароль</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    className={`${styles.input} ${styles.standalone}`} // Пароль всегда standalone
                    required
                    autoComplete="current-password"
                />
            </div>
        </AuthForm>
    );
};

export default LoginPage;