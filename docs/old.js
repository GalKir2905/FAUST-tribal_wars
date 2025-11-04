// ==UserScript==
// @name         Resource Search Shinka
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enhanced resource search with Russian localization
// @author       Your Name
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Russian localization
    const localization = {
        // Основные элементы интерфейса
        "search_placeholder": "Поиск ресурсов...",
        "search_button": "Поиск",
        "clear_button": "Очистить",
        "loading": "Загрузка...",
        "no_results": "Результаты не найдены",
        "error_loading": "Ошибка загрузки данных",
        "resource_search": "Поиск ресурсов",
        "search_description": "Расширенный поиск ресурсов с фильтрацией",

        // Фильтры и категории
        "filter_all": "Все ресурсы",
        "filter_images": "Изображения",
        "filter_documents": "Документы",
        "filter_videos": "Видео",
        "filter_audio": "Аудио",
        "filter_other": "Другое",

        // Информация о ресурсах
        "file_name": "Имя файла",
        "file_size": "Размер",
        "file_type": "Тип файла",
        "date_modified": "Дата изменения",
        "download": "Скачать",
        "preview": "Просмотр",

        // Пагинация
        "previous_page": "Предыдущая",
        "next_page": "Следующая",
        "page": "Страница",
        "of": "из",

        // Сообщения
        "searching": "Поиск...",
        "results_found": "найдено результатов",
        "select_file_type": "Выберите тип файла",
        "all_file_types": "Все типы файлов",

        // Статусы
        "success": "Успешно",
        "warning": "Предупреждение",
        "error": "Ошибка",

        // Действия
        "confirm": "Подтвердить",
        "cancel": "Отмена",
        "delete": "Удалить",
        "edit": "Редактировать",
        "save": "Сохранить",

        // Настройки
        "settings": "Настройки",
        "language": "Язык",
        "theme": "Тема",
        "results_per_page": "Результатов на странице",

        // Помощь
        "help": "Помощь",
        "about": "О программе",
        "version": "Версия"
    };

    // Конфигурация
    const config = {
        resultsPerPage: 10,
        apiEndpoint: 'https://api.example.com/search',
        enablePreview: true,
        maxFileSize: 100 * 1024 * 1024 // 100MB
    };

    // Состояние приложения
    let state = {
        currentPage: 1,
        totalResults: 0,
        currentQuery: '',
        currentFilter: 'all',
        isLoading: false,
        searchResults: []
    };

    // Функция для получения локализованного текста
    function getLocalizedText(key) {
        return localization[key] || key;
    }

    // Функция для применения локализации
    function applyLocalization() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const localizedText = getLocalizedText(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
                element.placeholder = localizedText;
            } else if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = localizedText;
            } else {
                element.textContent = localizedText;
            }
        });
    }

    // Создание интерфейса поиска
    function createSearchInterface() {
        const searchContainer = document.createElement('div');
        searchContainer.id = 'resource-search-shinka';
        searchContainer.innerHTML = `
            <div class="rss-container">
                <div class="rss-header">
                    <h2 data-i18n="resource_search">Resource Search</h2>
                </div>
                
                <div class="rss-search-bar">
                    <input type="search" id="rss-search-input" data-i18n="search_placeholder" placeholder="${getLocalizedText('search_placeholder')}" class="rss-search-input">
                    <button id="rss-search-btn" data-i18n="search_button" class="rss-search-btn">${getLocalizedText('search_button')}</button>
                    <button id="rss-clear-btn" data-i18n="clear_button" class="rss-clear-btn">${getLocalizedText('clear_button')}</button>
                </div>

                <div class="rss-filters">
                    <select id="rss-type-filter" class="rss-filter-select">
                        <option value="all" data-i18n="filter_all">${getLocalizedText('filter_all')}</option>
                        <option value="image" data-i18n="filter_images">${getLocalizedText('filter_images')}</option>
                        <option value="document" data-i18n="filter_documents">${getLocalizedText('filter_documents')}</option>
                        <option value="video" data-i18n="filter_videos">${getLocalizedText('filter_videos')}</option>
                        <option value="audio" data-i18n="filter_audio">${getLocalizedText('filter_audio')}</option>
                        <option value="other" data-i18n="filter_other">${getLocalizedText('filter_other')}</option>
                    </select>
                </div>

                <div class="rss-results-container">
                    <div id="rss-loading" class="rss-loading hidden" data-i18n="loading">${getLocalizedText('loading')}</div>
                    <div id="rss-results" class="rss-results"></div>
                    <div id="rss-no-results" class="rss-no-results hidden" data-i18n="no_results">${getLocalizedText('no_results')}</div>
                    <div id="rss-error" class="rss-error hidden" data-i18n="error_loading">${getLocalizedText('error_loading')}</div>
                </div>

                <div class="rss-pagination hidden">
                    <button id="rss-prev-btn" class="rss-pagination-btn" data-i18n="previous_page">${getLocalizedText('previous_page')}</button>
                    <span class="rss-page-info">
                        <span data-i18n="page">${getLocalizedText('page')}</span> 
                        <span id="rss-current-page">1</span> 
                        <span data-i18n="of">${getLocalizedText('of')}</span> 
                        <span id="rss-total-pages">1</span>
                    </span>
                    <button id="rss-next-btn" class="rss-pagination-btn" data-i18n="next_page">${getLocalizedText('next_page')}</button>
                </div>
            </div>
        `;

        // Стили
        const styles = `
            <style>
                #resource-search-shinka {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
                    margin: 20px auto;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .rss-container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                }

                .rss-header h2 {
                    color: #333;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .rss-search-bar {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .rss-search-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }

                .rss-search-btn, .rss-clear-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .rss-search-btn {
                    background: #007cba;
                    color: white;
                }

                .rss-search-btn:hover {
                    background: #005a87;
                }

                .rss-clear-btn {
                    background: #6c757d;
                    color: white;
                }

                .rss-clear-btn:hover {
                    background: #545b62;
                }

                .rss-filters {
                    margin-bottom: 20px;
                }

                .rss-filter-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                }

                .rss-results-container {
                    min-height: 200px;
                }

                .rss-loading, .rss-no-results, .rss-error {
                    text-align: center;
                    padding: 40px;
                    font-size: 16px;
                    color: #666;
                }

                .rss-error {
                    color: #dc3545;
                }

                .rss-results {
                    display: grid;
                    gap: 15px;
                }

                .rss-result-item {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 5px;
                    transition: background-color 0.2s;
                }

                .rss-result-item:hover {
                    background: #e9ecef;
                }

                .rss-file-icon {
                    width: 40px;
                    height: 40px;
                    margin-right: 15px;
                    background: #007cba;
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                }

                .rss-file-info {
                    flex: 1;
                }

                .rss-file-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #333;
                }

                .rss-file-meta {
                    font-size: 12px;
                    color: #666;
                }

                .rss-file-actions {
                    display: flex;
                    gap: 10px;
                }

                .rss-download-btn, .rss-preview-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .rss-download-btn {
                    background: #28a745;
                    color: white;
                }

                .rss-download-btn:hover {
                    background: #218838;
                }

                .rss-preview-btn {
                    background: #17a2b8;
                    color: white;
                }

                .rss-preview-btn:hover {
                    background: #138496;
                }

                .rss-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }

                .rss-pagination-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .rss-pagination-btn:hover:not(:disabled) {
                    background: #007cba;
                    color: white;
                }

                .rss-pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .rss-page-info {
                    font-size: 14px;
                    color: #666;
                }

                .hidden {
                    display: none !important;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.insertAdjacentElement('afterbegin', searchContainer);

        // Инициализация событий
        initializeEvents();
        applyLocalization();
    }

    // Инициализация событий
    function initializeEvents() {
        const searchInput = document.getElementById('rss-search-input');
        const searchBtn = document.getElementById('rss-search-btn');
        const clearBtn = document.getElementById('rss-clear-btn');
        const typeFilter = document.getElementById('rss-type-filter');
        const prevBtn = document.getElementById('rss-prev-btn');
        const nextBtn = document.getElementById('rss-next-btn');

        searchBtn.addEventListener('click', performSearch);
        clearBtn.addEventListener('click', clearSearch);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        typeFilter.addEventListener('change', () => {
            state.currentFilter = typeFilter.value;
            if (state.currentQuery) {
                performSearch();
            }
        });

        prevBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                performSearch();
            }
        });

        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(state.totalResults / config.resultsPerPage);
            if (state.currentPage < totalPages) {
                state.currentPage++;
                performSearch();
            }
        });
    }

    // Выполнение поиска
    function performSearch() {
        const searchInput = document.getElementById('rss-search-input');
        const query = searchInput.value.trim();

        if (!query) {
            showMessage('no_results');
            return;
        }

        state.currentQuery = query;
        state.currentPage = 1;

        showLoading();
        executeSearch(query, state.currentFilter, state.currentPage);
    }

    // Выполнение поискового запроса
    function executeSearch(query, filter, page) {
        state.isLoading = true;

        // Имитация API запроса (замените на реальный API)
        setTimeout(() => {
            const mockResults = generateMockResults(query, filter, page);
            displayResults(mockResults);
            state.isLoading = false;
        }, 1000);
    }

    // Генерация mock-результатов для демонстрации
    function generateMockResults(query, filter, page) {
        const fileTypes = {
            'image': ['jpg', 'png', 'gif', 'webp'],
            'document': ['pdf', 'doc', 'docx', 'txt'],
            'video': ['mp4', 'avi', 'mov', 'mkv'],
            'audio': ['mp3', 'wav', 'ogg', 'flac'],
            'other': ['zip', 'rar', 'exe', 'iso']
        };

        const results = [];
        const startIndex = (page - 1) * config.resultsPerPage;
        const totalResults = 47; // Mock total

        for (let i = 0; i < config.resultsPerPage; i++) {
            const index = startIndex + i;
            if (index >= totalResults) break;

            let fileType;
            let extension;

            if (filter === 'all') {
                const allTypes = Object.values(fileTypes).flat();
                extension = allTypes[Math.floor(Math.random() * allTypes.length)];
            } else {
                extension = fileTypes[filter][Math.floor(Math.random() * fileTypes[filter].length)];
            }

            const fileName = `${query}_file_${index + 1}.${extension}`;
            const fileSize = Math.floor(Math.random() * 10000000) + 1000; // 1KB - 10MB

            results.push({
                id: index,
                name: fileName,
                size: fileSize,
                type: extension,
                url: `https://example.com/files/${fileName}`,
                modified: new Date(Date.now() - Math.random() * 10000000000).toISOString()
            });
        }

        state.totalResults = totalResults;
        return results;
    }

    // Отображение результатов
    function displayResults(results) {
        hideAllMessages();
        
        if (results.length === 0) {
            showMessage('no_results');
            return;
        }

        const resultsContainer = document.getElementById('rss-results');
        resultsContainer.innerHTML = '';

        results.forEach(result => {
            const resultElement = createResultElement(result);
            resultsContainer.appendChild(resultElement);
        });

        updatePagination();
        showElement('rss-results');
    }

    // Создание элемента результата
    function createResultElement(result) {
        const div = document.createElement('div');
        div.className = 'rss-result-item';
        
        const fileExtension = result.type.toUpperCase();
        const fileSize = formatFileSize(result.size);
        const modifiedDate = new Date(result.modified).toLocaleDateString('ru-RU');

        div.innerHTML = `
            <div class="rss-file-icon">${fileExtension}</div>
            <div class="rss-file-info">
                <div class="rss-file-name">${result.name}</div>
                <div class="rss-file-meta">
                    <span>${getLocalizedText('file_size')}: ${fileSize}</span> • 
                    <span>${getLocalizedText('file_type')}: ${fileExtension}</span> • 
                    <span>${getLocalizedText('date_modified')}: ${modifiedDate}</span>
                </div>
            </div>
            <div class="rss-file-actions">
                <button class="rss-download-btn" onclick="downloadFile('${result.url}')" data-i18n="download">${getLocalizedText('download')}</button>
                ${config.enablePreview ? `<button class="rss-preview-btn" onclick="previewFile('${result.url}')" data-i18n="preview">${getLocalizedText('preview')}</button>` : ''}
            </div>
        `;

        return div;
    }

    // Обновление пагинации
    function updatePagination() {
        const totalPages = Math.ceil(state.totalResults / config.resultsPerPage);
        const currentPageElem = document.getElementById('rss-current-page');
        const totalPagesElem = document.getElementById('rss-total-pages');
        const prevBtn = document.getElementById('rss-prev-btn');
        const nextBtn = document.getElementById('rss-next-btn');
        const pagination = document.querySelector('.rss-pagination');

        currentPageElem.textContent = state.currentPage;
        totalPagesElem.textContent = totalPages;

        prevBtn.disabled = state.currentPage <= 1;
        nextBtn.disabled = state.currentPage >= totalPages;

        if (totalPages > 1) {
            showElement('rss-pagination');
        } else {
            hideElement('rss-pagination');
        }
    }

    // Вспомогательные функции для работы с DOM
    function showLoading() {
        hideAllMessages();
        showElement('rss-loading');
        hideElement('rss-results');
    }

    function showMessage(type) {
        hideAllMessages();
        showElement(`rss-${type}`);
        hideElement('rss-results');
    }

    function hideAllMessages() {
        hideElement('rss-loading');
        hideElement('rss-no-results');
        hideElement('rss-error');
    }

    function showElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.remove('hidden');
    }

    function hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    }

    // Очистка поиска
    function clearSearch() {
        const searchInput = document.getElementById('rss-search-input');
        const typeFilter = document.getElementById('rss-type-filter');
        
        searchInput.value = '';
        typeFilter.value = 'all';
        
        state.currentQuery = '';
        state.currentFilter = 'all';
        state.currentPage = 1;
        
        hideAllMessages();
        hideElement('rss-results');
        hideElement('rss-pagination');
    }

    // Форматирование размера файла
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Функции для действий с файлами
    function downloadFile(url) {
        window.open(url, '_blank');
    }

    function previewFile(url) {
        window.open(url, '_blank');
    }

    // Экспорт функций в глобальную область видимости
    window.downloadFile = downloadFile;
    window.previewFile = previewFile;

    // Инициализация при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        createSearchInterface();
        
        // Загрузка сохраненных настроек
        const savedSettings = GM_getValue('rss_settings');
        if (savedSettings) {
            Object.assign(config, savedSettings);
        }
    });

})();