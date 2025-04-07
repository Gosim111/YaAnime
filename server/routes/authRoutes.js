const express = require('express');
const router = express.Router();
// <<<--- ИМПОРТ КОНТРОЛЛЕРОВ ---
const { registerUser, loginUser } = require('../controllers/authController');
// <<<--- КОНЕЦ ИМПОРТА ---

// @route   POST api/auth/register
// @desc    Регистрация пользователя
// @access  Public
// <<<--- ИСПОЛЬЗОВАНИЕ КОНТРОЛЛЕРА ---
router.post('/register', registerUser);
// <<<--- КОНЕЦ ИСПОЛЬЗОВАНИЯ ---

// @route   POST api/auth/login
// @desc    Аутентификация пользователя и получение токена
// @access  Public
// <<<--- ИСПОЛЬЗОВАНИЕ КОНТРОЛЛЕРА ---
router.post('/login', loginUser);
// <<<--- КОНЕЦ ИСПОЛЬЗОВАНИЯ ---

module.exports = router;