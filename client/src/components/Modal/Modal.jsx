import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Эффект для блокировки/разблокировки прокрутки body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        // Очистка при размонтировании
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Эффект для закрытия по Esc
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);


    if (!isOpen) return null;

    // Используем React Portal для рендера модалки в body
    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={onClose}> {/* Закрытие по клику на оверлей */}
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> {/* Предотвращаем закрытие при клике на контент */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть окно">
                        × {/* Крестик */}
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>,
        document.body // Целевой DOM-узел для портала
    );
};

export default Modal;