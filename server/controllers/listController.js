// [server/controllers/listController.js]

const User = require('../models/User');
const { getMultipleAnimeDetails } = require('../services/kitsuService'); // Импортируем новый сервис
const mongoose = require('mongoose'); // Убедимся что он импортирован

// Получить список аниме пользователя (ОБНОВЛЕННАЯ ВЕРСИЯ)
exports.getUserAnimeList = async (req, res, next) => {
    try {
        const tagPart = req.params.tagPart;
        if (!tagPart) {
            return res.status(400).json({ message: 'Тег пользователя не указан' });
        }

        // Находим пользователя и выбираем нужные поля
        const user = await User.findOne({ tag: `@${tagPart}` })
            .select('animeList tag nickname') // Только нужные поля
            .lean(); // Используем lean для повышения производительности

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const { status: statusFilter } = req.query;
        let userListItems = user.animeList || [];

        // Фильтруем по статусу, если он указан в query параметрах
        if (statusFilter && ['watching', 'planned', 'completed', 'on_hold', 'dropped'].includes(statusFilter)) {
            userListItems = userListItems.filter(item => item.status === statusFilter);
        }

        // Сортируем по дате обновления (от новых к старым)
        userListItems.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));

        // Получаем Kitsu IDs из отфильтрованного списка пользователя
        const kitsuIds = userListItems.map(item => item.kitsuId).filter(id => typeof id === 'number' && id > 0); // Убедимся, что это валидные ID

        let enrichedList = [];
        if (kitsuIds.length > 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[ListCtrl] Запрос деталей Kitsu для ${kitsuIds.length} ID: [${kitsuIds.join(', ')}]`);
            }
            // Получаем детали из Kitsu для всех ID разом (возвращает Map)
            const kitsuDetailsMap = await getMultipleAnimeDetails(kitsuIds);
            if (process.env.NODE_ENV === 'development') {
                console.log(`[ListCtrl] Получено ${kitsuDetailsMap.size} деталей от Kitsu.`);
            }

            // Обогащаем список пользователя данными из Kitsu
            enrichedList = userListItems.map(listItem => {
                const kitsuData = kitsuDetailsMap.get(listItem.kitsuId);

                // Создаем базовый объект с данными из списка пользователя
                const enrichedItem = {
                    // Данные из списка пользователя
                    kitsuId: listItem.kitsuId,
                    status: listItem.status,
                    rating: listItem.rating,
                    progress: listItem.progress,
                    addedAt: listItem.addedAt,
                    updatedAt: listItem.updatedAt,
                    // Данные из Kitsu (добавляем, если найдены)
                    title: 'Загрузка...', // Значение по умолчанию
                    posterImage: null,
                    startDate: null,
                    subtype: null,
                    slug: null,
                    kitsuDataFound: false // Флаг, указывающий, найдены ли данные Kitsu
                };

                // Если данные Kitsu найдены, добавляем их
                if (kitsuData) {
                    enrichedItem.title = kitsuData.title;
                    enrichedItem.posterImage = kitsuData.posterImage;
                    enrichedItem.startDate = kitsuData.startDate;
                    enrichedItem.subtype = kitsuData.subtype;
                    enrichedItem.slug = kitsuData.slug;
                    // Добавляем другие поля из kitsuData при необходимости
                    enrichedItem.kitsuDataFound = true;
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`[ListCtrl] Детали Kitsu для ID ${listItem.kitsuId} не найдены в Map.`);
                    }
                    // Оставляем значения по умолчанию (title: 'Загрузка...', posterImage: null)
                    // Можно установить title в 'Информация недоступна' или оставить 'Загрузка...'
                    enrichedItem.title = 'Информация недоступна';
                }

                return enrichedItem;
            });
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[ListCtrl] Список пользователя для статуса "${statusFilter || 'any'}" пуст, Kitsu API не вызывался.`);
            }
        }

        res.json({
            list: enrichedList, // Возвращаем обогащенный список
            owner: { tag: user.tag, nickname: user.nickname }
        });

    } catch (error) {
        console.error(`[ListCtrl] Ошибка при получении обогащенного списка аниме для ${req.params.tagPart}:`, error);
        // Если ошибка пришла из getMultipleAnimeDetails, она уже была залогирована там
        // Возвращаем общую ошибку сервера или специфическую, если она от Kitsu
        if (error.message === 'Ошибка при получении данных от Kitsu API') {
            // Указываем, что проблема во внешнем сервисе
            return res.status(503).json({ message: 'Не удалось получить полные данные от Kitsu API. Попробуйте обновить страницу позже.' });
        }
        // Передаем стандартному обработчику ошибок Express
        next(error);
    }
};

// Обновить/добавить запись в свой список
exports.updateMyAnimeListItem = async (req, res, next) => {
    const kitsuId = parseInt(req.params.kitsuId, 10);
    const userId = req.user.id;
    const { status, rating, progress } = req.body;

    // Валидация входных данных
    if (isNaN(kitsuId) || kitsuId <= 0) { return res.status(400).json({ message: 'Неверный ID аниме' }); }
    const allowedStatuses = ['watching', 'planned', 'completed', 'on_hold', 'dropped'];
    if (status && !allowedStatuses.includes(status)) { return res.status(400).json({ message: 'Неверный статус аниме' }); }
    // Рейтинг: может быть null или числом от 1 до 10
    if (rating !== undefined && rating !== null && (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating))) { return res.status(400).json({ message: 'Неверная оценка (должна быть целым числом от 1 до 10 или null)' }); }
    if (progress !== undefined && progress !== null && (typeof progress !== 'number' || progress < 0 || !Number.isInteger(progress))) { return res.status(400).json({ message: 'Неверный прогресс (должно быть целое неотрицательное число)' }); }

    try {
        const user = await User.findById(userId);
        if (!user) { return res.status(404).json({ message: 'Пользователь не найден' }); }

        const existingItemIndex = user.animeList.findIndex(item => item.kitsuId === kitsuId);
        const now = new Date();
        let updatedItem;
        let operationType = 'updated'; // Для логирования

        if (existingItemIndex > -1) {
            // Обновляем существующую запись
            const itemToUpdate = user.animeList[existingItemIndex];
            let changed = false;
            // Обновляем статус, если он передан и отличается
            if (status && itemToUpdate.status !== status) {
                itemToUpdate.status = status; changed = true;
            }
            // Обновляем рейтинг, если он передан (даже если null) и отличается
            // rating === undefined означает, что поле не было передано, не трогаем
            // rating === null означает, что нужно установить null
            if (rating !== undefined && itemToUpdate.rating !== rating) {
                // Бэкенд ожидает null или число 1-10. Валидация выше это проверила.
                itemToUpdate.rating = rating; // Просто присваиваем (null или число)
                changed = true;
            }
            // Обновляем прогресс, если он передан и отличается
            if (progress !== undefined && progress !== null && itemToUpdate.progress !== progress) {
                itemToUpdate.progress = progress; changed = true;
            }

            // Обновляем дату только если что-то действительно изменилось
            if (changed) {
                itemToUpdate.updatedAt = now;
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[ListCtrl Update] Поля изменены для ${kitsuId}: status=${status}, rating=${rating}, progress=${progress}`);
                }
            } else {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[ListCtrl Update] Нет изменений для ${kitsuId}.`);
                }
            }
            updatedItem = itemToUpdate;
        } else {
            // Добавляем новую запись
            operationType = 'added';
            // Если добавляем новую запись, статус обязателен
            if (!status) {
                return res.status(400).json({ message: 'Статус обязателен при добавлении нового аниме в список.' });
            }
            const newItem = {
                _id: new mongoose.Types.ObjectId(), // Генерируем ID для subdocument
                kitsuId,
                status: status, // Статус берем из запроса
                rating: rating === undefined ? null : rating, // null по умолчанию, если не передан
                progress: progress === undefined || progress === null ? 0 : progress, // 0 по умолчанию, если не передан
                addedAt: now,
                updatedAt: now
            };
            user.animeList.push(newItem);
            updatedItem = newItem;
        }

        await user.save();
        if (process.env.NODE_ENV === 'development') {
            console.log(`[ListCtrl] Запись для kitsuId ${kitsuId} у пользователя ${userId} ${operationType}. Данные:`, updatedItem);
        }
        // Возвращаем только данные элемента списка, как они сохранены в БД
        res.status(operationType === 'added' ? 201 : 200).json({
            kitsuId: updatedItem.kitsuId,
            status: updatedItem.status,
            rating: updatedItem.rating, // Отправляем null если он null
            progress: updatedItem.progress,
            addedAt: updatedItem.addedAt,
            updatedAt: updatedItem.updatedAt
        });

    } catch (error) {
        console.error(`[ListCtrl] Ошибка при обновлении/добавлении записи ${kitsuId} в список:`, error);
        // Обработка ошибок валидации Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            // Формируем более понятное сообщение
            const detailedMessage = messages.join('. ');
            // Логируем для отладки
            console.error(`[ListCtrl] Ошибка валидации Mongoose для ${kitsuId}:`, detailedMessage);
            // Возвращаем ошибку 400
            return res.status(400).json({ message: `Ошибка валидации: ${detailedMessage}` });
        }
        // Передаем другим обработчикам
        next(error);
    }
};


// Удалить запись из своего списка
exports.deleteMyAnimeListItem = async (req, res, next) => {
    const kitsuId = parseInt(req.params.kitsuId, 10);
    const userId = req.user.id;

    if (isNaN(kitsuId) || kitsuId <= 0) {
        return res.status(400).json({ message: 'Неверный ID аниме' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            // Это не должно произойти если protect middleware работает, но проверим
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const initialLength = user.animeList.length;
        // Удаляем элемент из массива
        user.animeList = user.animeList.filter(item => item.kitsuId !== kitsuId);

        if (user.animeList.length === initialLength) {
            // Элемент не был найден
            return res.status(404).json({ message: 'Запись с таким ID аниме не найдена в списке' });
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[ListCtrl] Удаление записи kitsuId ${kitsuId} у пользователя ${userId}. Старая длина: ${initialLength}, новая: ${user.animeList.length}`);
        }
        await user.save();
        // Успешное удаление, возвращаем 200 OK или 204 No Content
        res.status(200).json({ message: 'Запись успешно удалена из списка' });

    } catch (error) {
        console.error(`[ListCtrl] Ошибка при удалении записи ${kitsuId} из списка:`, error);
        next(error);
    }
};