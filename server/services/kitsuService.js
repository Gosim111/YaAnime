// [server/services/kitsuService.js]

const axios = require('axios');
const KITSU_API_BASE_URL = 'https://kitsu.io/api/edge';
const BATCH_SIZE = 20; // Kitsu рекомендует не более 20 для filter[id]

// Поля, которые нам нужны для карточки в профиле (и для страницы деталей)
// Можно расширить при необходимости
const DEFAULT_FIELDS = 'titles,canonicalTitle,slug,startDate,subtype,posterImage,status,episodeCount,averageRating';

const kitsuApiClient = axios.create({
    baseURL: KITSU_API_BASE_URL,
    headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
    },
    // Добавим таймаут, чтобы не ждать вечно
    timeout: 15000 // 15 секунд
});

/**
 * Форматирует данные аниме из Kitsu API в более удобный формат.
 * @param {object} item - Объект аниме из Kitsu API (data[...])
 * @returns {object|null} Отформатированный объект аниме или null при ошибке.
 */
const formatKitsuAnime = (item) => {
    if (!item || !item.id || !item.attributes) return null;
    const attr = item.attributes;

    // Выбираем лучшее доступное название
    const title = attr.titles?.ru || attr.titles?.en_jp || attr.canonicalTitle || attr.titles?.en || 'Без названия';

    return {
        kitsuId: parseInt(item.id, 10), // Убедимся, что ID числовой
        slug: attr.slug,
        title: title,
        startDate: attr.startDate,
        subtype: attr.subtype,
        status: attr.status, // Статус выхода (current, finished, etc.)
        episodeCount: attr.episodeCount,
        averageRating: attr.averageRating,
        posterImage: attr.posterImage ? {
            tiny: attr.posterImage.tiny,
            small: attr.posterImage.small,
            medium: attr.posterImage.medium,
            // large и original могут быть избыточны для карточек в списке,
            // но оставим их пока, если AnimeCard их использует
            large: attr.posterImage.large,
            original: attr.posterImage.original,
        } : null,
        // Можно добавить другие поля при необходимости (genres, etc.) если передать include
    };
};

/**
 * Получает детали для нескольких аниме из Kitsu API батчами.
 * @param {number[]} ids - Массив Kitsu ID.
 * @param {string} [fields=DEFAULT_FIELDS] - Строка запрашиваемых полей.
 * @returns {Promise<Map<number, object>>} Promise, который разрешается с Map, где ключ - kitsuId, значение - отформатированный объект аниме.
 */
const getMultipleAnimeDetails = async (ids, fields = DEFAULT_FIELDS) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return new Map(); // Возвращаем пустую Map, если нет ID
    }

    // Убираем дубликаты и невалидные значения (не числа)
    const uniqueValidIds = [...new Set(ids)].filter(id => typeof id === 'number' && !isNaN(id) && id > 0);

    if (uniqueValidIds.length === 0) {
        return new Map();
    }

    const results = new Map();
    const idChunks = [];

    // Разбиваем ID на чанки
    for (let i = 0; i < uniqueValidIds.length; i += BATCH_SIZE) {
        idChunks.push(uniqueValidIds.slice(i, i + BATCH_SIZE));
    }

    try {
        // Создаем массив промисов для всех запросов
        const requests = idChunks.map(chunk => {
            const params = {
                'filter[id]': chunk.join(','),
                'fields[anime]': fields,
                'page[limit]': chunk.length // Запрашиваем столько, сколько в чанке
            };
            if (process.env.NODE_ENV === 'development') {
                console.log(`[KitsuService] Запрос чанка ID: ${chunk.join(',')}`);
            }
            return kitsuApiClient.get('/anime', { params });
        });

        // Выполняем все запросы параллельно и ждем результатов
        const responses = await Promise.allSettled(requests);

        // Обрабатываем результаты
        responses.forEach((response, index) => {
            const chunkIds = idChunks[index];
            if (response.status === 'fulfilled' && response.value?.data?.data) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[KitsuService] Успех для чанка ${chunkIds.join(',')}: получено ${response.value.data.data.length} записей.`);
                }
                response.value.data.data.forEach(item => {
                    const formatted = formatKitsuAnime(item);
                    if (formatted) {
                        results.set(formatted.kitsuId, formatted);
                    } else {
                        console.warn(`[KitsuService] Не удалось отформатировать элемент с ID ${item.id} из чанка ${chunkIds.join(',')}`);
                    }
                });
            } else {
                // Логируем ошибку, но не прерываем процесс
                const errorInfo = response.reason?.response?.data || response.reason?.message || response.reason || 'Неизвестная ошибка';
                console.error(`[KitsuService] Ошибка при запросе чанка ID ${chunkIds.join(',')}:`, JSON.stringify(errorInfo));
                // Можно добавить логику для повторных попыток или пометить эти ID как недоступные
            }
        });

        if (process.env.NODE_ENV === 'development') {
            const foundIds = Array.from(results.keys());
            const missedIds = uniqueValidIds.filter(id => !results.has(id));
            console.log(`[KitsuService] Итог: Получено ${results.size} деталей для ${uniqueValidIds.length} уник. ID. Найдено: [${foundIds.join(', ')}]. Не найдено/ошибка: [${missedIds.join(', ')}]`);
        }
        return results; // Возвращаем Map с результатами

    } catch (error) {
        // Обработка общих ошибок сети или axios
        console.error('[KitsuService] Непредвиденная ошибка в getMultipleAnimeDetails:', error.message);
        // Можно выбросить ошибку дальше или вернуть пустую Map
        // Выбросим ошибку, чтобы контроллер мог её поймать
        throw new Error('Ошибка при получении данных от Kitsu API');
    }
};

module.exports = { getMultipleAnimeDetails, formatKitsuAnime }; // Экспортируем и форматер, если понадобится где-то еще