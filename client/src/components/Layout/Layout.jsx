import React from 'react';
import Header from '../Header/Header'; // Относительный путь к Header
import Footer from '../Footer/Footer'; // Относительный путь к Footer
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    // Этот компонент просто рендерит Header, children и Footer
    // Он не должен влиять на контекст, так как сам рендерится ВНУТРИ App,
    // который обернут в AuthProvider.

    if (import.meta.env.DEV) {
        console.log("Layout component rendered"); // Лог для проверки рендера
    }

    return (
        <div className={styles.layout}>
            {/* Header рендерится здесь */}
            <Header />
            <main className={styles.mainContent}>
                {children} {/* Сюда подставляются Route */}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;