import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getMe, logoutUser as apiLogout } from '../services/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const login = useCallback((userData, jwtToken) => {
        if (import.meta.env.DEV) console.log("AuthContext: Login");
        localStorage.setItem('authToken', jwtToken);
        setToken(jwtToken);
        setUser(userData);
        setAuthError(null);
    }, []);

    const logout = useCallback(() => {
        if (import.meta.env.DEV) console.log("AuthContext: Logout");
        apiLogout();
        setToken(null);
        setUser(null);
    }, []);

    // --- ДОБАВЛЕНА ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ USER STATE ---
    const updateUserState = useCallback((updatedUserData) => {
        if (import.meta.env.DEV) console.log("AuthContext: Обновление состояния пользователя", updatedUserData);
        setUser(currentUser => ({ ...currentUser, ...updatedUserData }));
    }, []);
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setAuthError(null);
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                if (import.meta.env.DEV) console.log("AuthContext: Проверка токена при загрузке...");
                try {
                    const userData = await getMe();
                    if (isMounted) {
                        if (userData) {
                            if (import.meta.env.DEV) console.log("AuthContext: Пользователь получен", userData);
                            setUser(userData);
                            setToken(currentToken);
                        } else {
                            if (import.meta.env.DEV) console.log("AuthContext: Токен невалидный или ошибка getMe, выход...");
                            logout();
                        }
                    }
                } catch (error) {
                    console.error("AuthContext: Ошибка при проверке аутентификации:", error);
                    if (isMounted) {
                        setAuthError(error.message || 'Ошибка проверки аутентификации');
                        logout();
                    }
                }
            } else {
                if (import.meta.env.DEV) console.log("AuthContext: Токен не найден при загрузке.");
                if (isMounted) { setUser(null); setToken(null); }
            }
            if (isMounted) { setIsLoading(false); }
        };
        checkAuth();
        return () => { isMounted = false; if (import.meta.env.DEV) console.log("AuthContext: Провайдер размонтирован."); };
    }, [logout]); // <<<--- Убрал logout из зависимостей, т.к. он useCallback

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'authToken') {
                const newToken = event.newValue;
                if (import.meta.env.DEV) console.log("AuthContext: Обнаружено изменение authToken в localStorage", newToken);
                if (!newToken) { logout(); }
                else {
                    setToken(newToken);
                    if (import.meta.env.DEV) console.log("AuthContext: Токен изменился, перезапрашиваем данные пользователя...");
                    getMe().then(userData => { if (userData) setUser(userData); else logout(); }).catch(() => logout());
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [logout]);


    const contextValue = useMemo(() => ({
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        logout,
        updateUserState, // <<<--- ДОБАВЛЯЕМ ФУНКЦИЮ В КОНТЕКСТ
    }), [user, token, isLoading, authError, login, logout, updateUserState]); // <<<--- ДОБАВЛЯЕМ ЗАВИСИМОСТЬ

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};