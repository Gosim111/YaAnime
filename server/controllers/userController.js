const User = require('../models/User');

// @desc    Получить профиль текущего пользователя
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res, next) => {
    if (req.user) {
        res.json({
            id: req.user._id,
            nickname: req.user.nickname, // Может быть null
            email: req.user.email,
            tag: req.user.tag,
            avatar: req.user.avatar,
            createdAt: req.user.createdAt,
        });
    } else {
        res.status(404).json({ message: 'Пользователь не найден' });
    }
};

// @desc    Получить публичный профиль пользователя по части тега (без @)
// @route   GET /api/users/tag/:tagPart
// @access  Public
exports.getUserByTagPart = async (req, res, next) => { // <<<--- Имя функции изменено
    try {
        // Получаем часть тега без @ из URL
        const tagPart = req.params.tagPart; // <<<--- Имя параметра изменено

        if (!tagPart) {
            return res.status(400).json({ message: 'Тег пользователя не указан' });
        }

        // --- Ищем по полному тегу, добавляя @ ---
        const user = await User.findOne({ tag: `@${tagPart}` }).select('-password -email');
        // --- Конец изменения ---

        if (!user) {
            // Отправляем 404, если пользователь не найден
            return res.status(404).json({ message: 'Пользователь с таким тегом не найден' });
        }

        // Возвращаем публичные данные
        res.json({
            id: user._id,
            nickname: user.nickname, // Может быть null
            tag: user.tag, // Полный тег с @
            avatar: user.avatar,
            createdAt: user.createdAt,
        });

    } catch (error) {
        console.error('Ошибка при получении профиля по тегу:', error);
        next(error);
    }
};


// @desc    Обновить профиль пользователя (например, никнейм)
// @route   PUT /api/users/me
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
    // Получаем пользователя из middleware 'protect'
    const user = await User.findById(req.user.id);

    if (user) {
        // Обновляем никнейм, если он передан и не пустой
        if (req.body.nickname !== undefined) { // Проверяем наличие ключа
            const newNickname = req.body.nickname === null ? null : String(req.body.nickname).trim();
            if (newNickname !== null && newNickname.length > 30) {
                return res.status(400).json({ message: 'Никнейм не может быть длиннее 30 символов' });
            }
            user.nickname = newNickname; // Устанавливаем новое значение (или null)
        }

        // TODO: Добавить обновление других полей (аватар, возможно email/пароль с доп. проверками)

        try {
            const updatedUser = await user.save();
            res.json({
                id: updatedUser._id,
                nickname: updatedUser.nickname,
                email: updatedUser.email,
                tag: updatedUser.tag,
                avatar: updatedUser.avatar,
                createdAt: updatedUser.createdAt,
                message: "Профиль успешно обновлен"
            });
        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
            next(error);
        }

    } else {
        res.status(404).json({ message: 'Пользователь не найден' });
    }
};