// [client/src/components/Catalog/FilterSidebar.jsx]
import React, { useState, useEffect, useMemo } from 'react';
import FilterGroup from './FilterGroup';
import styles from './FilterSidebar.module.css';
import CloseIcon from '../../assets/icons/CloseIcon';
import SearchIcon from '../../assets/icons/SearchIcon';

// Константы (без изменений)
const ANIME_TYPES = [ { value: 'tv', label: 'TV Сериал' }, { value: 'movie', label: 'Фильм' }, { value: 'ova', label: 'OVA' }, { value: 'ona', label: 'ONA' }, { value: 'special', label: 'Спешл' }, { value: 'music', label: 'Клип' }, ];
const ANIME_STATUSES = [ { value: 'anons', label: 'Анонс' }, { value: 'ongoing', label: 'Онгоинг' }, { value: 'released', label: 'Вышло' }, ];
const CURRENT_YEAR = new Date().getFullYear();

const FilterSidebar = ({
                           initialFilters, availableGenres, availableStudios,
                           onApplyFilters, onResetFilters, isMobileOpen, onMobileClose,
                           isLoadingGenres, isLoadingStudios
                       }) => {
    // Локальное состояние (без изменений)
    const [selectedTypes, setSelectedTypes] = useState(initialFilters.kind || []);
    const [selectedStatuses, setSelectedStatuses] = useState(initialFilters.status || []);
    const [selectedGenres, setSelectedGenres] = useState(initialFilters.genre || []);
    const [selectedStudios, setSelectedStudios] = useState(initialFilters.studio || []);
    const [yearFrom, setYearFrom] = useState(initialFilters.yearFrom || '');
    const [yearTo, setYearTo] = useState(initialFilters.yearTo || '');
    const [scoreFrom, setScoreFrom] = useState(initialFilters.scoreFrom || '');
    const [scoreTo, setScoreTo] = useState(initialFilters.scoreTo || '');
    const [genreSearchTerm, setGenreSearchTerm] = useState('');
    const [studioSearchTerm, setStudioSearchTerm] = useState('');

    // Логирование и обновление состояния при смене initialFilters (без изменений)
    useEffect(() => { /* ... */ }, [availableGenres, availableStudios]);
    useEffect(() => { /* ... */ }, [initialFilters]);

    // Фильтрация списков (без изменений)
    const filteredGenres = useMemo(() => { const genres = Array.isArray(availableGenres)?availableGenres:[]; if(!genreSearchTerm)return genres; const lcs=genreSearchTerm.toLowerCase(); return genres.filter(g=>(g.russian||'').toLowerCase().includes(lcs)||(g.name||'').toLowerCase().includes(lcs)); }, [availableGenres, genreSearchTerm]);
    const filteredStudios = useMemo(() => { const studios = Array.isArray(availableStudios)?availableStudios:[]; if(!studioSearchTerm)return studios; const lcs=studioSearchTerm.toLowerCase(); return studios.filter(s=>(s.name||'').toLowerCase().includes(lcs)); }, [availableStudios, studioSearchTerm]);

    // Обработчик чекбоксов (без изменений)
    const handleCheckboxChange = (setter, value, currentSelection) => { const newSelection = currentSelection.includes(value) ? currentSelection.filter(item => item !== value) : [...currentSelection, value]; setter(newSelection); };

    // !!! Исправленный handleApply !!!
    const handleApply = () => {
        // Собираем ВСЕ текущие значения из локального состояния
        const filtersToApply = {
            kind: selectedTypes,
            status: selectedStatuses,
            genre: selectedGenres,
            studio: selectedStudios,
            // Передаем yearFrom/To и scoreFrom/To как есть
            // Они будут обработаны в CatalogPage перед запросом к API
            yearFrom: yearFrom,
            yearTo: yearTo,
            scoreFrom: scoreFrom,
            scoreTo: scoreTo,
        };
        console.log("[FilterSidebar] Вызов onApplyFilters с:", filtersToApply);
        onApplyFilters(filtersToApply); // Передаем собранный объект
        if (isMobileOpen) onMobileClose();
    };

    // handleReset (без изменений)
    const handleReset = () => { setGenreSearchTerm(''); setStudioSearchTerm(''); setSelectedTypes([]); setSelectedStatuses([]); setSelectedGenres([]); setSelectedStudios([]); setYearFrom(''); setYearTo(''); setScoreFrom(''); setScoreTo(''); onResetFilters(); if (isMobileOpen) onMobileClose(); };

    // Рендер чекбоксов (без изменений)
    const renderCheckboxes = (items, selectedItems, setter) => (items.map(item => (<label key={item.value || item.id} className={styles.checkboxLabel}><input type="checkbox" value={item.value || item.id} checked={selectedItems.includes(String(item.value || item.id))} onChange={() => handleCheckboxChange(setter, String(item.value || item.id), selectedItems)}/><span>{item.label || item.russian || item.name}</span></label>)) );

    // Рендеринг компонента (без изменений)
    return ( <aside className={`${styles.filterSidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}> <div className={styles.sidebarHeader}><h3>Фильтры</h3><button onClick={onMobileClose} className={styles.mobileCloseButton} aria-label="Закрыть фильтры"><CloseIcon size={22} /></button></div> <div className={styles.sidebarContent}> <FilterGroup title="Тип" initialOpen={true}><div className={styles.checkboxGroup}>{renderCheckboxes(ANIME_TYPES, selectedTypes, setSelectedTypes)}</div></FilterGroup> <FilterGroup title="Статус" initialOpen={true}><div className={styles.checkboxGroup}>{renderCheckboxes(ANIME_STATUSES, selectedStatuses, setSelectedStatuses)}</div></FilterGroup> <FilterGroup title="Год выхода"><div className={styles.inputRangeGroup}><input type="number" placeholder="От" min="1900" max={CURRENT_YEAR} value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} className={styles.rangeInput}/><span>-</span><input type="number" placeholder="До" min="1900" max={CURRENT_YEAR} value={yearTo} onChange={(e) => setYearTo(e.target.value)} className={styles.rangeInput}/></div></FilterGroup> <FilterGroup title="Рейтинг"><div className={styles.inputRangeGroup}><input type="number" placeholder="От" min="1" max="10" step="0.1" value={scoreFrom} onChange={(e) => setScoreFrom(e.target.value)} className={styles.rangeInput}/><span>-</span><input type="number" placeholder="До" min="1" max="10" step="0.1" value={scoreTo} onChange={(e) => setScoreTo(e.target.value)} className={styles.rangeInput}/></div></FilterGroup> <FilterGroup title="Жанры"><div className={styles.listSearchInputWrapper}><input type="search" placeholder="Поиск жанра..." value={genreSearchTerm} onChange={(e) => setGenreSearchTerm(e.target.value)} className={styles.listSearchInput}/><SearchIcon className={styles.listSearchIcon} size={16} /></div> {isLoadingGenres && <div className={styles.filterLoading}>Загрузка...</div>} {!isLoadingGenres && (!availableGenres || availableGenres.length === 0) && <div className={styles.filterError}>Не удалось загрузить жанры.</div>} {!isLoadingGenres && availableGenres && availableGenres.length > 0 && ( <div className={`${styles.checkboxGroup} ${styles.scrollableList}`}>{filteredGenres.length > 0 ? renderCheckboxes(filteredGenres, selectedGenres, setSelectedGenres) : <div className={styles.filterNotFound}>Жанры не найдены</div>}</div> )} </FilterGroup> <FilterGroup title="Студии"><div className={styles.listSearchInputWrapper}><input type="search" placeholder="Поиск студии..." value={studioSearchTerm} onChange={(e) => setStudioSearchTerm(e.target.value)} className={styles.listSearchInput}/><SearchIcon className={styles.listSearchIcon} size={16} /></div> {isLoadingStudios && <div className={styles.filterLoading}>Загрузка...</div>} {!isLoadingStudios && (!availableStudios || availableStudios.length === 0) && <div className={styles.filterError}>Не удалось загрузить студии.</div>} {!isLoadingStudios && availableStudios && availableStudios.length > 0 && ( <div className={`${styles.checkboxGroup} ${styles.scrollableList}`}>{filteredStudios.length > 0 ? renderCheckboxes(filteredStudios, selectedStudios, setSelectedStudios) : <div className={styles.filterNotFound}>Студии не найдены</div>}</div> )} </FilterGroup> </div> <div className={styles.sidebarFooter}><button onClick={handleApply} className={`${styles.applyButton} ${styles.buttonPrimary}`}>Применить</button><button onClick={handleReset} className={`${styles.resetButton} ${styles.buttonSecondary}`}>Сбросить</button></div> </aside> );
};
export default FilterSidebar;