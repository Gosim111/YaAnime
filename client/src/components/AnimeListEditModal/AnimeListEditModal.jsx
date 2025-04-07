// [client/src/components/AnimeListEditModal/AnimeListEditModal.jsx]

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../Modal/Modal';
import styles from './AnimeListEditModal.module.css';

const AnimeListEditModal = ({
                                isOpen, onClose, animeDetails, initialListItem,
                                onSave, onDelete, isProcessing, error
                            }) => {
    const [currentStatus, setCurrentStatus] = useState('');
    const [currentRating, setCurrentRating] = useState('');
    const [currentProgress, setCurrentProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentStatus(initialListItem?.status || '');
            setCurrentRating(initialListItem?.rating?.toString() || '');
            setCurrentProgress(initialListItem?.progress || 0);
        }
    }, [isOpen, initialListItem]);

    const isProgressEditable = useMemo(() => ['watching', 'on_hold', 'rewatching'].includes(currentStatus), [currentStatus]);
    const isRatingEditable = useMemo(() => ['watching', 'completed', 'on_hold', 'dropped', 'rewatching'].includes(currentStatus), [currentStatus]);

    const handleSave = () => {
        if (isProcessing || !currentStatus) return;
        const saveData = {
            status: currentStatus,
            rating: isRatingEditable && currentRating !== '' ? parseInt(currentRating, 10) : null,
            // ! Прогресс 0 для нередактируемых статусов (кроме completed)
            progress: isProgressEditable ? parseInt(currentProgress, 10) : (currentStatus === 'completed' ? currentProgress : 0),
        };
        // Устанавливаем макс. прогресс для completed
        if (currentStatus === 'completed') {
            const maxEpisodes = animeDetails?.episodeCount;
            if (maxEpisodes && maxEpisodes > 0) saveData.progress = maxEpisodes;
            else if (animeDetails?.subtype?.toUpperCase() === 'MOVIE') saveData.progress = 1;
            // Иначе оставляем 0, если кол-во серий неизвестно
            else saveData.progress = 0; // Или можно оставить как есть? Решили 0.
        }
        onSave(saveData);
    };

    const handleDelete = () => {
        if (isProcessing) return;
        if (window.confirm(`Убрать "${animeDetails?.title || 'это аниме'}" из списка?`)) { onDelete(); }
    };

    const progressOptions = useMemo(() => {
        const options = [<option key={-1} value={0}>0 серий</option>];
        const maxEpisodes = animeDetails?.episodeCount;
        if (maxEpisodes && maxEpisodes > 0) {
            for (let i = 1; i <= maxEpisodes; i++) { let seriesText = (i === 1) ? "серия" : (i < 5 ? "серии" : "серий"); options.push(<option key={i} value={i}>{`${i} ${seriesText}`}</option>); }
        } else if (animeDetails?.subtype?.toUpperCase() === 'MOVIE') {
            if (currentStatus === 'completed') { return [<option key={1} value={1}>Просмотрен</option>]; }
            else { return [ <option key={0} value={0}>Не смотрел</option>, <option key={1} value={1}>Просмотрен</option> ]; }
        } else { for (let i = 1; i <= 50; i++) { let seriesText = (i === 1) ? "серия" : (i < 5 ? "серии" : "серий"); options.push(<option key={i} value={i}>{`${i} ${seriesText}`}</option>); } }
        return options;
    }, [animeDetails?.episodeCount, animeDetails?.subtype, currentStatus]);

    const ratingOptions = useMemo(() => { const options = [<option key="" value="">Нет оценки</option>]; for (let i = 10; i >= 1; i--) { options.push(<option key={i} value={i}>{i}</option>); } return options; }, []);

    // Авто-установка прогресса для completed
    useEffect(() => {
        if (isOpen && currentStatus === 'completed') {
            const maxEpisodes = animeDetails?.episodeCount;
            if (maxEpisodes && maxEpisodes > 0) { setCurrentProgress(maxEpisodes); }
            else if (animeDetails?.subtype?.toUpperCase() === 'MOVIE') { setCurrentProgress(1); }
            // Не сбрасываем в 0 для неизвестного кол-ва, оставляем как есть
        }
        // Сбрасываем прогресс для planned, если не был установлен ранее
        if (isOpen && currentStatus === 'planned' && (!initialListItem || initialListItem.status !== 'planned')) {
            setCurrentProgress(0);
        }
    }, [currentStatus, animeDetails?.episodeCount, animeDetails?.subtype, isOpen, initialListItem]);


    const modalTitle = initialListItem ? 'Редактировать запись' : 'Добавить в список';
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <div className={styles.modalForm}>
                <div className={styles.formRow}>
                    <label htmlFor="modal-status" className={styles.label}>Статус</label>
                    <select id="modal-status" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)} className={styles.selectInput} disabled={isProcessing} required > <option value="" disabled>-- Выберите --</option> <option value="watching">Смотрю</option> <option value="planned">Запланировано</option> <option value="completed">Просмотрено</option> <option value="on_hold">Отложено</option> <option value="dropped">Брошено</option> </select>
                </div>
                <div className={`${styles.formRow} ${!isRatingEditable ? styles.rowDisabled : ''}`}>
                    <label htmlFor="modal-rating" className={styles.label}>Оценка</label>
                    <select id="modal-rating" value={currentRating} onChange={(e) => setCurrentRating(e.target.value)} className={styles.selectInput} disabled={isProcessing || !isRatingEditable} > {ratingOptions} </select>
                </div>
                {animeDetails?.subtype?.toUpperCase() !== 'MOVIE' && (
                    <div className={`${styles.formRow} ${!isProgressEditable ? styles.rowDisabled : ''}`}>
                        <label htmlFor="modal-progress" className={styles.label}>Прогресс</label>
                        <select id="modal-progress" value={currentProgress} onChange={(e) => setCurrentProgress(parseInt(e.target.value, 10))} className={styles.selectInput} disabled={isProcessing || !isProgressEditable} > {progressOptions} </select>
                    </div>
                )}
                {error && <p className={styles.errorMessage}>{error}</p>}
                <div className={styles.buttonContainer}>
                    {initialListItem ? ( <button type="button" onClick={handleDelete} className={`${styles.modalButton} ${styles.deleteButton}`} disabled={isProcessing}> {isProcessing ? '...' : 'Удалить'} </button> ) : ( <div className={styles.buttonSpacer}></div> /* Распорка */ )}
                    <div className={styles.confirmButtons}> <button type="button" onClick={onClose} className={`${styles.modalButton} ${styles.secondaryButton}`} disabled={isProcessing}>Отмена</button> <button type="button" onClick={handleSave} className={`${styles.modalButton} ${styles.primaryButton}`} disabled={isProcessing || !currentStatus}> {isProcessing ? '...' : 'Сохранить'} </button> </div>
                </div>
            </div>
        </Modal>
    );
};

export default AnimeListEditModal;