const express = require('express');
const router = express.Router();
const { getUserProfile, getUserByTagPart, updateUserProfile } = require('../controllers/userController');
// <<<--- ИМПОРТ КОНТРОЛЛЕРА СПИСКОВ ---
const { getUserAnimeList, updateMyAnimeListItem, deleteMyAnimeListItem } = require('../controllers/listController');
// <<<--- КОНЕЦ ИМПОРТА ---
const protect = require('../middleware/authMiddleware');

// --- Профиль ---
router.get('/me', protect, getUserProfile); // Свой профиль
router.put('/me', protect, updateUserProfile); // Обновить свой профиль
router.get('/tag/:tagPart', getUserByTagPart); // Публичный профиль

// --- Списки Аниме ---
// Получить список аниме пользователя (публичный, можно фильтровать по ?status=...)
router.get('/tag/:tagPart/list', getUserAnimeList); // <<<--- НОВЫЙ РОУТ

// Обновить/добавить запись в своем списке (приватный)
router.put('/me/list/:kitsuId', protect, updateMyAnimeListItem); // <<<--- НОВЫЙ РОУТ

// Удалить запись из своего списка (приватный)
router.delete('/me/list/:kitsuId', protect, deleteMyAnimeListItem); // <<<--- НОВЫЙ РОУТ

module.exports = router;