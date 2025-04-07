const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

// --- Схема для элемента списка аниме ---
const AnimeListItemSchema = new mongoose.Schema({
    kitsuId: { // ID из Kitsu API (важно для получения деталей аниме)
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['watching', 'planned', 'completed', 'on_hold', 'dropped'], // Возможные статусы
        default: 'planned',
    },
    rating: { // Оценка пользователя (например, от 1 до 10 или null)
        type: Number,
        min: 1,
        max: 10,
        default: null,
    },
    progress: { // Количество просмотренных серий
        type: Number,
        default: 0,
        min: 0,
    },
    // Можно добавить другие поля, например, rewatchCount, notes
    addedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { _id: false }); // Не создаем отдельный _id для поддокументов списка

// --- Обновление UserSchema ---
const UserSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: [true, 'Тег обязателен'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^@[a-zA-Z0-9_]{3,20}$/.test(v) && /[a-zA-Z]/.test(v.substring(1));
            },
            message: props => `${props.value} не является валидным тегом. Требования: @ + 3-20 символов (латиница, цифры, _), должна быть хотя бы одна буква.`
        }
    },
    email: {
        type: String,
        required: [true, 'Email обязателен'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Пожалуйста, введите корректный email']
    },
    password: {
        type: String,
        required: [true, 'Пароль обязателен'],
        minlength: [6, 'Пароль должен быть не менее 6 символов'],
        select: false
    },
    nickname: {
        type: String,
        trim: true,
        maxlength: [30, 'Никнейм не может быть длиннее 30 символов'],
        default: null
    },
    avatar: {
        type: String,
        default: '/default-avatar.png'
    },
    // --- ДОБАВЛЯЕМ ПОЛЕ СПИСКА АНИМЕ ---
    animeList: {
        type: [AnimeListItemSchema], // Массив поддокументов
        default: [],
    },
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Pre-save хуки (генерация тега УДАЛЕНА, хэширование пароля ОСТАЛОСЬ) ---
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { return next(); }
    if (!this.password) { return next(new Error('Пароль отсутствует перед хэшированием')); }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) { next(error); }
});

// --- Метод сравнения пароля (без изменений) ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        const user = await this.constructor.findById(this._id).select('+password');
        if (!user || !user.password) { return false; }
        return await bcrypt.compare(enteredPassword, user.password);
    } catch (error) {
        console.error("[User Model] Ошибка при сравнении пароля:", error);
        return false;
    }
};


const User = mongoose.model('User', UserSchema);

module.exports = User;