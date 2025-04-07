const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Загружаем переменные окружения из .env файла
dotenv.config();

// Получаем строку подключения из переменных окружения или используем дефолтную
const db = process.env.MONGO_URI;
// Получаем секрет JWT
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiration = process.env.JWT_EXPIRES_IN || '7d';

const connectDB = async () => {
    try {
        if (!db) {
            throw new Error('MONGO_URI не определена в переменных окружения');
        }
        if (!jwtSecret) {
            throw new Error('JWT_SECRET не определена в переменных окружения');
        }

        await mongoose.connect(db, {
            // Опции для нового драйвера MongoDB (уже не требуются в Mongoose 6+)
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Больше не поддерживается
            // useFindAndModify: false // Больше не поддерживается
        });

        console.log('MongoDB подключена...');
    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err.message);
        // Выход из процесса при ошибке подключения
        process.exit(1);
    }
};

module.exports = { connectDB, jwtSecret, jwtExpiration };