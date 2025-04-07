import axios from 'axios';

// Базовый URL Kitsu API v3 (edge)
const KITSU_API_BASE_URL = 'https://kitsu.io/api/edge';

// Создаем экземпляр axios для Kitsu API
const kitsuApiClient = axios.create({
    baseURL: KITSU_API_BASE_URL,
    // Kitsu API требует специфический Accept header для JSON:API
    headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
    }
});

/**
 * Извлекает связанные данные (например, жанры) из included массива ответа Kitsu
 * @param {Array} included - Массив included из ответа Kitsu
 * @param {object} relationships - Объект relationships из основного ресурса
 * @param {string} relationName - Имя связи (например, 'genres')
 * @returns {Array} - Массив отформатированных связанных данных
 */
const extractIncludedData = (included, relationships, relationName) => {
    if (!included || !relationships || !relationships[relationName]?.data) {
        return [];
    }
    const relationData = relationships[relationName].data;
    const relationIds = Array.isArray(relationData)
        ? relationData.map(item => item.id)
        : [relationData.id]; // Если связь одна

    return included
        .filter(item => item.type === relationName && relationIds.includes(item.id))
        .map(item => ({
            id: item.id,
            name: item.attributes?.name, // или другое нужное поле
            slug: item.attributes?.slug,
        }))
        .filter(item => item.name); // Убираем те, у которых нет имени
};

/**
 * Извлекает и форматирует данные из ответа Kitsu JSON:API
 * @param {object} item - Элемент из массива data ответа Kitsu
 * @param {Array} [included] - Массив included из ответа Kitsu (для связей)
 * @returns {object | null} - Отформатированный объект аниме или null
 */
const formatKitsuAnime = (item, included) => {
    if (!item || !item.id || !item.attributes) {
        return null;
    }

    const attr = item.attributes;

    // Выбираем наиболее подходящее название
    const title = attr.titles?.ru
        || attr.titles?.en_jp
        || attr.canonicalTitle
        || attr.titles?.en
        || 'Без названия';

    // Извлекаем жанры, если included передан
    const genres = included ? extractIncludedData(included, item.relationships, 'genres') : [];

    return {
        id: item.id, // Kitsu ID
        slug: attr.slug,
        title: title,
        titles: attr.titles,
        synopsis: attr.synopsis,
        canonicalTitle: attr.canonicalTitle,
        averageRating: attr.averageRating,
        startDate: attr.startDate,
        endDate: attr.endDate,
        subtype: attr.subtype,
        status: attr.status,
        posterImage: attr.posterImage ? {
            tiny: attr.posterImage.tiny,
            small: attr.posterImage.small,
            medium: attr.posterImage.medium,
            large: attr.posterImage.large,
            original: attr.posterImage.original,
        } : null,
        coverImage: attr.coverImage ? {
            tiny: attr.coverImage.tiny,
            small: attr.coverImage.small,
            large: attr.coverImage.large,
            original: attr.coverImage.original,
        } : null,
        episodeCount: attr.episodeCount,
        episodeLength: attr.episodeLength,
        youtubeVideoId: attr.youtubeVideoId,
        ageRating: attr.ageRating,
        ageRatingGuide: attr.ageRatingGuide,
        genres: genres, // Добавили жанры
        // Можно добавить другие связи по аналогии (студии, персонажи и т.д.)
        meta: item.meta, // Для totalCount и других метаданных
    };
};

/**
 * Получает список трендовых аниме с Kitsu
 * @param {object} params - Параметры запроса
 * @param {number} [params.limit=18] - Количество элементов
 * @param {string} [params.fields] - Запрашиваемые поля аниме
 * @returns {Promise<{list: Array<object>, error: any | null}>} - Промис с отформатированным списком или ошибкой
 */
export const getTrendingAnime = async ({
                                           limit = 18,
                                           fields = 'titles,canonicalTitle,slug,synopsis,averageRating,startDate,endDate,subtype,status,posterImage,episodeCount,ageRating',
                                       } = {}) => {
    try {
        const response = await kitsuApiClient.get('/trending/anime', {
            params: {
                'page[limit]': limit,
                [`fields[anime]`]: fields,
            }
        });

        if (response.data && Array.isArray(response.data.data)) {
            const formattedList = response.data.data
                .map(item => formatKitsuAnime(item)) // Передаем только item, included здесь нет
                .filter(item => item !== null);
            return { list: formattedList, error: null };
        } else {
            console.error('Неожиданная структура ответа от Kitsu API (getTrendingAnime):', response.data);
            return { list: [], error: new Error('Некорректный ответ от Kitsu API') };
        }

    } catch (error) {
        console.error('Ошибка при получении трендовых аниме с Kitsu API:', error.response?.data || error.message || error);
        return { list: [], error: error };
    }
};


/**
 * Получает список аниме с Kitsu с фильтрами и сортировкой
 * @param {object} options - Опции запроса
 * @param {number} [options.page=1] - Номер страницы
 * @param {number} [options.limit=20] - Элементов на странице
 * @param {string} [options.sort='-user_count'] - Сортировка
 * @param {object} [options.filters={}] - Объект с фильтрами
 * @param {string} [options.fields='titles,canonicalTitle,slug,startDate,subtype,status,posterImage,averageRating'] - Запрашиваемые поля
 * @param {string} [options.include] - Включаемые связи (например, 'genres')
 * @returns {Promise<{list: Array<object>, totalCount: number | null, error: any | null}>}
 */
export const getAnimeList = async ({
                                       page = 1,
                                       limit = 20,
                                       sort = '-user_count',
                                       filters = {},
                                       fields = 'titles,canonicalTitle,slug,startDate,subtype,status,posterImage,averageRating',
                                       include = '', // Опционально включаем связи
                                   } = {}) => {
    const actualLimit = Math.min(limit, 20);
    const offset = (page - 1) * actualLimit;

    const params = {
        'page[limit]': actualLimit,
        'page[offset]': offset,
        'sort': sort,
        [`fields[anime]`]: fields,
    };
    if (include) {
        params.include = include;
    }

    for (const key in filters) {
        if (filters.hasOwnProperty(key)) {
            params[`filter[${key}]`] = filters[key];
        }
    }

    try {
        console.log('Запрос к Kitsu API (getAnimeList) с параметрами:', params);
        const response = await kitsuApiClient.get('/anime', { params });
        console.log('УСПЕШНЫЙ Ответ от Kitsu API (getAnimeList):', response.data);

        if (response.data && Array.isArray(response.data.data)) {
            const includedData = response.data.included; // Получаем included данные
            const formattedList = response.data.data
                // Передаем included в форматировщик
                .map(item => formatKitsuAnime(item, includedData))
                .filter(item => item !== null);
            const totalCount = response.data.meta?.count || null;
            return { list: formattedList, totalCount: totalCount, error: null };
        } else {
            console.error('Неожиданная структура ответа от Kitsu API (getAnimeList):', response.data);
            return { list: [], totalCount: null, error: new Error('Некорректный ответ от Kitsu API') };
        }
    } catch (error) {
        console.error('Ошибка при получении списка аниме с Kitsu API:');
        if (error.response) {
            console.error('Статус:', error.response.status);
            console.error('Данные:', JSON.stringify(error.response.data, null, 2));
            console.error('Заголовки:', error.response.headers);
        } else if (error.request) {
            console.error('Запрос:', error.request);
        } else {
            console.error('Ошибка настройки:', error.message);
        }
        console.error('Конфиг запроса:', error.config);
        const errorData = error.response?.data?.errors?.[0] || { detail: error.message || 'Неизвестная ошибка' };
        return { list: [], totalCount: null, error: new Error(errorData.detail || 'Ошибка запроса к Kitsu API') };
    }
};

/**
 * Получает детальную информацию об аниме по ID с Kitsu
 * @param {string} id - Kitsu ID аниме
 * @param {string} [include='genres,categories'] - Включаемые связи (жанры, категории)
 * @returns {Promise<{data: object | null, error: any | null}>} - Промис с данными
 */
export const getAnimeDetails = async (id, include = 'genres,categories') => {
    // Запрашиваем основные поля и включаем жанры/категории
    const params = {
        include: include,
        // Можно добавить fields[anime]=... если нужно ограничить поля самого аниме
    };

    try {
        console.log(`Запрос к Kitsu API (getAnimeDetails) для ID: ${id} с параметрами:`, params);
        const response = await kitsuApiClient.get(`/anime/${id}`, { params });
        console.log('УСПЕШНЫЙ Ответ от Kitsu API (getAnimeDetails):', response.data);

        if (response.data && response.data.data) {
            // Передаем основной объект (data) и связанные данные (included) в форматировщик
            const formattedData = formatKitsuAnime(response.data.data, response.data.included);
            return { data: formattedData, error: null };
        } else {
            console.error('Неожиданная структура ответа от Kitsu API (getAnimeDetails):', response.data);
            return { data: null, error: new Error('Некорректный ответ от Kitsu API') };
        }

    } catch (error) {
        console.error(`Ошибка при получении деталей аниме (${id}) с Kitsu API:`);
        if (error.response) {
            console.error('Статус:', error.response.status);
            console.error('Данные:', JSON.stringify(error.response.data, null, 2));
            console.error('Заголовки:', error.response.headers);
            // Если 404, возвращаем null без ошибки в консоль компонента
            if (error.response.status === 404) {
                return { data: null, error: null }; // Аниме не найдено
            }
        } else if (error.request) {
            console.error('Запрос:', error.request);
        } else {
            console.error('Ошибка настройки:', error.message);
        }
        console.error('Конфиг запроса:', error.config);
        const errorData = error.response?.data?.errors?.[0] || { detail: error.message || 'Неизвестная ошибка' };
        return { data: null, error: new Error(errorData.detail || 'Ошибка запроса к Kitsu API') };
    }
}