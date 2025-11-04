// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v4.9.8
// @namespace    http://tampermonkey.net/
// @version      4.9.8
// @description  Массовый сбор ресурсов с учетом времени возвращения
// @author       G4lKir95 & Sophie
// @match        https://*.tribalwars.com.ua/game.php*
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.voynaplemyon.com/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // Автоматическое перенаправление на страницу массового сбора
    if (window.location.href.indexOf('mode=scavenge_mass') === -1 && 
        window.location.href.indexOf('screen=place') !== -1) {
        console.log('G4lKir95: Redirecting to mass scavenging page');
        const gameServer = window.location.hostname;
        const gamePhp = window.location.pathname;
        const massUrl = `https://${gameServer}${gamePhp}?screen=place&mode=scavenge_mass`;
        window.location.href = massUrl;
        return;
    }

    // ========== КОНФИГУРАЦИЯ ==========
    let repeatEnabled = false;
    let repeatCount = 1;
    let repeatInterval = 60;
    let currentRepeat = 0;
    let repeatTimer = null;
    let isRunning = false;
    let notificationQueue = [];
    let debugLogs = [];

    // Переменные из скрипта Sophie
    let keepHome = {};
    let categoryEnabled = [true, true, true, true];
    let troopTypesEnabled = {};
    let prioritiseHighCat = false;

    // Основные юниты с русскими названиями
    const worldUnits = [
        { id: 'spear', name: 'Копейщик', capacity: 25, speed: 18 },
        { id: 'sword', name: 'Мечник', capacity: 15, speed: 22 },
        { id: 'axe', name: 'Топорщик', capacity: 10, speed: 18 },
        { id: 'light', name: 'Лёгкая кавалерия', capacity: 80, speed: 10 },
        { id: 'heavy', name: 'Тяжелая кавалерия', capacity: 50, speed: 11 }
    ];

    // Названия категорий
    const categoryNames = {
        1: "Ленивые собиратели",
        2: "Скромные собиратели", 
        3: "Искусные собиратели",
        4: "Великие собиратели"
    };

    // Базовые грузоподъемности для категорий
    const baseCapacities = {
        1: 1000,  // Ленивые собиратели
        2: 2500,  // Скромные собиратели  
        3: 5000,  // Искусные собиратели
        4: 10000  // Великие собиратели
    };

    // ========== СТИЛИ G4LKIR95 ==========
    const styles = `
        .g4lkir95-panel {
            position: fixed; 
            top: 50px; 
            right: 10px; 
            width: 320px;
            background: #2c3e50; 
            border: 2px solid #34495e; 
            border-radius: 8px;
            padding: 12px; 
            z-index: 10000; 
            font-family: Arial; 
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
            max-height: 90vh; 
            overflow-y: auto;
            font-size: 12px;
        }
        .g4lkir95-header {
            background: #34495e; 
            padding: 8px; 
            margin: -12px -12px 12px -12px;
            border-radius: 6px 6px 0 0; 
            text-align: center; 
            font-weight: bold; 
            font-size: 14px;
        }
        .g4lkir95-section {
            margin-bottom: 12px; 
            padding: 8px; 
            background: #34495e; 
            border-radius: 5px;
        }
        .g4lkir95-section-title {
            font-weight: bold; 
            margin-bottom: 6px; 
            color: #ecf0f1; 
            font-size: 12px;
        }
        .g4lkir95-button {
            width: 100%; 
            padding: 6px; 
            margin: 3px 0; 
            border: none; 
            border-radius: 4px;
            background: #e74c3c; 
            color: white; 
            font-weight: bold; 
            cursor: pointer; 
            font-size: 11px;
        }
        .g4lkir95-button:hover { 
            background: #c0392b; 
        }
        .g4lkir95-button-success { 
            background: #27ae60; 
        }
        .g4lkir95-button-success:hover { 
            background: #219a52; 
        }
        .g4lkir95-button-warning { 
            background: #f39c12; 
        }
        .g4lkir95-button-warning:hover { 
            background: #d35400; 
        }
        .g4lkir95-close {
            position: absolute; 
            top: 3px; 
            right: 8px; 
            background: none; 
            border: none;
            color: white; 
            font-size: 16px; 
            cursor: pointer; 
            font-weight: bold;
        }
        .g4lkir95-launch-btn {
            position: fixed; 
            top: 10px; 
            right: 10px; 
            padding: 6px 12px;
            background: #e74c3c; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer; 
            font-weight: bold; 
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
            font-size: 11px;
        }
        .g4lkir95-launch-btn:hover { 
            background: #c0392b; 
        }
        .g4lkir95-status {
            text-align: center; 
            padding: 4px; 
            margin: 4px 0; 
            border-radius: 3px; 
            font-size: 10px;
        }
        .g4lkir95-status-active { 
            background: #27ae60; 
        }
        .g4lkir95-status-inactive { 
            background: #7f8c8d; 
        }

        /* Стили для юнитов */
        .units-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 8px 0;
        }
        .unit-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #2c3e50;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #34495e;
            flex: 1;
            min-width: 120px;
        }
        .unit-checkbox {
            width: 14px;
            height: 14px;
        }
        .unit-name {
            font-size: 10px;
            color: #ecf0f1;
            font-weight: bold;
            min-width: 70px;
        }
        .unit-backup {
            width: 50px;
            font-size: 10px;
            padding: 3px;
            background: #2c3e50;
            color: white;
            border: 1px solid #7f8c8d;
            border-radius: 3px;
            text-align: center;
        }

        /* Стили для категорий */
        .categories-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 8px 0;
        }
        .category-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #2c3e50;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #34495e;
            flex: 1;
            min-width: 130px;
        }

        /* Стили для уведомлений */
        .g4lkir95-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 16px;
            border-radius: 5px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            max-width: 300px;
            text-align: center;
            font-size: 12px;
        }
        .g4lkir95-notification.info { background: #3498db; color: white; }
        .g4lkir95-notification.success { background: #27ae60; color: white; }
        .g4lkir95-notification.error { background: #e74c3c; color: white; }
        .g4lkir95-notification.warning { background: #f39c12; color: white; }

        /* Стили для логов */
        .debug-logs {
            background: #1a252f;
            border: 1px solid #34495e;
            border-radius: 5px;
            padding: 8px;
            max-height: 150px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 9px;
            color: #bdc3c7;
            margin-top: 8px;
        }
        .debug-log-entry {
            margin-bottom: 2px;
            padding: 2px 4px;
            border-left: 2px solid #3498db;
        }
        .debug-log-entry.success {
            border-left-color: #27ae60;
            color: #27ae60;
        }
        .debug-log-entry.error {
            border-left-color: #e74c3c;
            color: #e74c3c;
        }
        .debug-log-entry.warning {
            border-left-color: #f39c12;
            color: #f39c12;
        }
        .debug-log-time {
            color: #7f8c8d;
            font-size: 8px;
        }

        /* Компактные стили для настроек */
        .compact-settings {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .setting-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .setting-label {
            font-size: 11px;
            color: #ecf0f1;
        }
    `;

    // ========== СИСТЕМА УВЕДОМЛЕНИЙ ==========
    function showNotification(message, type = 'info') {
        const notification = {
            message: message,
            type: type,
            timestamp: Date.now()
        };
        
        notificationQueue.push(notification);
        processNotificationQueue();
        addDebugLog(message, type);
    }

    function processNotificationQueue() {
        const existingNotifications = document.querySelectorAll('.g4lkir95-notification');
        existingNotifications.forEach(notification => {
            if (Date.now() - parseInt(notification.getAttribute('data-timestamp')) > 3000) {
                notification.remove();
            }
        });

        if (notificationQueue.length > 0 && document.querySelectorAll('.g4lkir95-notification').length < 3) {
            const notification = notificationQueue.shift();
            displaySingleNotification(notification.message, notification.type);
        }
    }

    function displaySingleNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `g4lkir95-notification ${type}`;
        notification.setAttribute('data-timestamp', Date.now());
        notification.textContent = message;
        
        const existingNotifications = document.querySelectorAll('.g4lkir95-notification');
        const topPosition = 20 + (existingNotifications.length * 60);
        notification.style.top = `${topPosition}px`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                processNotificationQueue();
            }
        }, 3000);
    }

    // ========== СИСТЕМА ЛОГИРОВАНИЯ ==========
    function addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp: timestamp,
            message: message,
            type: type
        };
        
        debugLogs.push(logEntry);
        
        if (debugLogs.length > 50) {
            debugLogs = debugLogs.slice(-50);
        }
        
        updateDebugLogsDisplay();
        
        console.log(`[G4lKir95 ${timestamp}] ${message}`);
    }

    function updateDebugLogsDisplay() {
        const logsContainer = document.getElementById('debugLogs');
        if (!logsContainer) return;
        
        logsContainer.innerHTML = '';
        
        debugLogs.slice().reverse().forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `debug-log-entry ${log.type}`;
            logEntry.innerHTML = `
                <span class="debug-log-time">[${log.timestamp}]</span> ${log.message}
            `;
            logsContainer.appendChild(logEntry);
        });
    }

    function clearDebugLogs() {
        debugLogs = [];
        updateDebugLogsDisplay();
    }

    // ========== ЗАГРУЗКА И СОХРАНЕНИЕ НАСТРОЕК ==========
    function loadSophieSettings() {
        try {
            keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
            categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
            troopTypesEnabled = JSON.parse(localStorage.getItem("troopTypesEnabled") || "{}");
            prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat") || "false");
            
            worldUnits.forEach(unit => {
                if (keepHome[unit.id] === undefined) {
                    keepHome[unit.id] = 0;
                }
                if (troopTypesEnabled[unit.id] === undefined) {
                    troopTypesEnabled[unit.id] = true;
                }
            });
        } catch (e) {
            addDebugLog('Ошибка загрузки настроек Sophie: ' + e.message, 'error');
        }
    }

    function saveSophieSettings() {
        try {
            saveSettingsFromUI();
            localStorage.setItem("keepHome", JSON.stringify(keepHome));
            localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
            localStorage.setItem("troopTypesEnabled", JSON.stringify(troopTypesEnabled));
            localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
            showNotification('Настройки сохранены!', 'success');
        } catch (e) {
            addDebugLog('Ошибка сохранения настроек: ' + e.message, 'error');
            showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    function saveSettingsFromUI() {
        try {
            // Сохраняем настройки войск
            worldUnits.forEach(unit => {
                const backupInput = document.getElementById('backup_' + unit.id);
                const troopCheckbox = document.getElementById('troop_' + unit.id);
                if (backupInput) {
                    keepHome[unit.id] = parseInt(backupInput.value) || 0;
                }
                if (troopCheckbox) {
                    troopTypesEnabled[unit.id] = troopCheckbox.checked;
                }
            });
            
            // Сохраняем настройки категорий из чекбоксов
            for (let i = 1; i <= 4; i++) {
                const checkbox = document.getElementById('cat_' + i);
                if (checkbox) {
                    categoryEnabled[i-1] = checkbox.checked;
                }
            }
            
            // Сохраняем настройку приоритета
            const priorityCheckbox = document.getElementById('priority_high');
            if (priorityCheckbox) {
                prioritiseHighCat = priorityCheckbox.checked;
            }
            
            // Сохраняем настройки повторного запуска
            const repeatEnabledCheckbox = document.getElementById('repeatEnabled');
            if (repeatEnabledCheckbox) {
                repeatEnabled = repeatEnabledCheckbox.checked;
            }
            
            const repeatCountInput = document.getElementById('repeatCount');
            if (repeatCountInput) {
                repeatCount = parseInt(repeatCountInput.value) || 1;
            }
            
            const repeatIntervalInput = document.getElementById('repeatInterval');
            if (repeatIntervalInput) {
                repeatInterval = parseInt(repeatIntervalInput.value) || 60;
            }
            
            addDebugLog('Настройки сохранены из интерфейса', 'success');
        } catch (e) {
            addDebugLog('Ошибка сохранения настроек из интерфейса: ' + e.message, 'error');
        }
    }

    // ========== РЕАЛЬНАЯ ЛОГИКА MASS SCAVENGING ==========
    function readyToSend() {
        addDebugLog('Запуск реального массового сбора...', 'info');
        
        // ВАЖНО: Сохраняем настройки перед запуском
        saveSettingsFromUI();
        
        // Проверяем что выбраны категории
        if (!categoryEnabled.some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбрано ни одной категории сбора!', 'error');
            showNotification('Выберите хотя бы одну категорию сбора!', 'error');
            return false;
        }

        // Проверяем что выбраны типы войск
        if (!Object.values(troopTypesEnabled).some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбран ни один тип войск для отправки!', 'error');
            showNotification('Выберите хотя бы один тип войск для отправки!', 'error');
            return false;
        }
        
        addDebugLog('Проверка настроек завершена успешно', 'success');
        showNotification('Запуск реального массового сбора...', 'info');
        return startRealMassScavenging();
    }

    function startRealMassScavenging() {
        addDebugLog('Выполнение реального скрипта сбора...', 'info');
        debugScavengeInterface();
        updateProgress('🔍 Поиск деревень и местных войск...');
        
        const villageData = getVillageDataFromPage();
        if (!villageData || villageData.length === 0) {
            addDebugLog('ОШИБКА: Деревни не найдены!', 'error');
            showNotification('Не найдено деревень для сбора! Проверьте, что вы на странице массового сбора.', 'error');
            return false;
        }
        
        addDebugLog(`Найдено деревень: ${villageData.length}`, 'success');
        showNotification(`Найдено ${villageData.length} деревень для обработки`, 'info');
        updateProgress(`📊 Найдено ${villageData.length} деревень...`);
        
        const squads = calculateScavengingSquads(villageData);
        
        if (squads.length === 0) {
            addDebugLog('ОШИБКА: Не создано ни одного отряда для отправки!', 'error');
            showNotification('Нет подходящих отрядов для отправки! Проверьте настройки войск.', 'error');
            return false;
        }
        
        addDebugLog(`Создано отрядов: ${squads.length}`, 'success');
        showNotification(`Рассчитано ${squads.length} отрядов для отправки`, 'info');
        updateProgress(`🎯 Создано ${squads.length} отрядов...`);
        
        sendScavengingSquads(squads);
        
        return true;
    }

    // ========== ПОИСК ИНТЕРФЕЙСА И ДАННЫХ ==========
    function getVillageDataFromPage() {
        addDebugLog('Поиск данных о деревнях и местных войсках...', 'info');
        const villages = [];
        
        try {
            addDebugLog('=== ПОИСК ИНТЕРФЕЙСА МАССОВОГО СБОРА ===', 'info');
            
            // Сначала ищем основной контейнер массового сбора
            const mainContainer = findMassScavengeContainer();
            if (!mainContainer) {
                addDebugLog('❌ Не найден контейнер массового сбора!', 'error');
                addDebugLog('Убедитесь, что вы находитесь на странице массового сбора (mode=scavenge_mass)', 'error');
                return villages;
            }
            
            addDebugLog('✅ Найден основной контейнер массового сбора', 'success');
            
            // Ищем реальные строки с деревнями для сбора
            const villageRows = findVillageRowsInContainer(mainContainer);
            addDebugLog(`Найдено строк с деревнями: ${villageRows.length}`, 'info');
            
            if (villageRows.length === 0) {
                addDebugLog('Пробуем альтернативный поиск строк...', 'info');
                // Альтернативный поиск по всей странице
                const allRows = document.querySelectorAll('tr, .village-row, .row, div.village');
                addDebugLog(`Всего потенциальных строк: ${allRows.length}`, 'info');
            }
            
            let processedVillages = 0;
            
            villageRows.forEach((row, index) => {
                try {
                    addDebugLog(`--- Обработка строки ${index} ---`, 'info');
                    
                    // Получаем данные деревни
                    const villageInfo = extractVillageInfoFromRow(row);
                    if (!villageInfo) {
                        addDebugLog(`Строка ${index}: не удалось извлечь информацию о деревне`, 'warning');
                        return;
                    }
                    
                    // Получаем информацию о войсках
                    const localUnits = getAccurateLocalUnitsFromRow(row, villageInfo.name);
                    
                    // Получаем опции категорий
                    const options = getRealCategoryOptions(row);
                    
                    villages.push({
                        id: villageInfo.id,
                        name: villageInfo.name,
                        has_rally_point: true,
                        units: localUnits,
                        options: options,
                        availableTroops: Object.values(localUnits).reduce((sum, count) => sum + count, 0),
                        row: row
                    });
                    
                    processedVillages++;
                    addDebugLog(`✅ Добавлена деревня: ${villageInfo.name}`, 'success');
                    
                } catch (e) {
                    addDebugLog(`Ошибка обработки строки ${index}: ${e.message}`, 'error');
                }
            });
            
            addDebugLog(`Всего обработано деревень: ${processedVillages}`, 'success');
            
            if (processedVillages === 0) {
                addDebugLog('Не найдено деревень для обработки. Проверьте:', 'error');
                addDebugLog('1. Вы находитесь на странице массового сбора', 'error');
                addDebugLog('2. У вас есть деревни с доступными войсками', 'error');
                addDebugLog('3. Интерфейс массового сбора загружен', 'error');
            }
            
            return villages;
        } catch (e) {
            addDebugLog(`Критическая ошибка получения данных: ${e.message}`, 'error');
            return [];
        }
    }
    
    // Новая функция для поиска строк с деревнями
    function findVillageRowsInContainer(container) {
        const rows = [];
        
        // Различные селекторы для строк с деревнями
        const rowSelectors = [
            'tr',
            '.village-row',
            '.row',
            'div.village',
            '[class*="village"]',
            '.content-border tr',
            '.mass_scavenge_content tr'
        ];
        
        for (const selector of rowSelectors) {
            const foundRows = container.querySelectorAll(selector);
            if (foundRows.length > 0) {
                addDebugLog(`Найдено строк через селектор ${selector}: ${foundRows.length}`, 'info');
                
                foundRows.forEach(row => {
                    if (isValidVillageRow(row) && !rows.includes(row)) {
                        rows.push(row);
                    }
                });
            }
        }
        
        // Если не нашли по селекторам, ищем вручную
        if (rows.length === 0) {
            addDebugLog('Ручной поиск строк...', 'info');
            const allElements = container.querySelectorAll('*');
            
            for (let element of allElements) {
                if (element.textContent && element.textContent.length > 50 && 
                    !isNavigationOrMenu(element) && 
                    findVillageLinkWithCoords(element) && 
                    hasScavengeControls(element)) {
                    rows.push(element);
                }
            }
        }
        
        return rows;
    }
    
    // Функция проверки валидности строки деревни
    function isValidVillageRow(row) {
        // Пропускаем маленькие элементы
        if (row.textContent.length < 30) {
            return false;
        }
        
        // Пропускаем элементы меню и навигации
        if (isNavigationOrMenu(row)) {
            return false;
        }
        
        // Должна быть ссылка на деревню с координатами
        if (!findVillageLinkWithCoords(row)) {
            return false;
        }
        
        // Должны быть элементы управления (кнопки отправки)
        if (!hasScavengeControls(row)) {
            return false;
        }
        
        return true;
    }

    function findMassScavengeContainer() {
        addDebugLog('Поиск контейнера массового сбора...', 'info');
        
        // Сначала ищем по специфичным ID и классам
        const specificSelectors = [
            '#scavenge_mass_content',
            '.mass_scavenge_content',
            '#content-border',
            '.content-border',
            '[id*="scavenge_mass"]',
            '[class*="scavenge_mass"]',
            '#scavenge_content',
            '.scavenge_content'
        ];
        
        for (const selector of specificSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                addDebugLog(`✅ Найден через селектор: ${selector}`, 'success');
                return element;
            }
        }
        
        // Ищем по содержимому
        addDebugLog('Поиск по содержимому...', 'info');
        const allDivs = document.querySelectorAll('div, table, form');
        
        for (let element of allDivs) {
            const text = element.textContent;
            if (text && (
                (text.includes('сбор') && text.includes('ресурс')) || 
                (text.includes('scavenge') && text.includes('mass')) ||
                text.includes('Ленивые собиратели') ||
                text.includes('Быстрые собиратели') ||
                text.includes('Находчивые собиратели') ||
                text.includes('Жадные собиратели') ||
                (text.includes('Lazy') && text.includes('Scavenger')) ||
                element.innerHTML.includes('scavenge_mass')
            )) {
                addDebugLog('✅ Найден по содержимому', 'success');
                return element;
            }
        }
        
        // Если не нашли, пробуем найти форму массового сбора
        const forms = document.querySelectorAll('form');
        for (let form of forms) {
            if (form.innerHTML.includes('scavenge') || form.action.includes('scavenge')) {
                addDebugLog('✅ Найден через форму', 'success');
                return form;
            }
        }
        
        addDebugLog('❌ Контейнер массового сбора не найден!', 'error');
        addDebugLog('Проверьте URL: должен содержать mode=scavenge_mass', 'error');
        
        // Покажем текущий URL для отладки
        addDebugLog(`Текущий URL: ${window.location.href}`, 'info');
        
        return null;
    }

    function findRealVillageRow(villageName) {
        addDebugLog(`Поиск строки для деревни: ${villageName}`, 'info');
        
        try {
            // Извлекаем координаты из названия
            const coordMatch = villageName.match(/(\d+\|\d+)/);
            if (!coordMatch) {
                addDebugLog(`❌ Не найдены координаты: ${villageName}`, 'error');
                return null;
            }
            
            const coords = coordMatch[0];
            addDebugLog(`Ищем деревню с координатами: ${coords}`, 'info');
            
            // Ищем все элементы, содержащие эти координаты
            const allElements = document.body.getElementsByTagName('*');
            
            for (let element of allElements) {
                if (element.textContent && element.textContent.includes(coords)) {
                    // Проверяем, что это действительно строка с элементами управления сбором
                    let container = element.closest('tr') || 
                                   element.closest('.village-row') || 
                                   element.closest('.row') ||
                                   element.closest('div');
                    
                    if (container && hasScavengeControls(container)) {
                        addDebugLog(`✅ Найдена строка для деревни ${villageName}`, 'success');
                        return container;
                    }
                }
            }
            
            addDebugLog(`❌ Строка для деревни ${villageName} не найдена`, 'error');
            return null;
            
        } catch (e) {
            addDebugLog(`Ошибка поиска строки: ${e.message}`, 'error');
            return null;
        }
    }

    function isNavigationOrMenu(element) {
        const text = element.textContent;
        const html = element.innerHTML;
        const classList = element.className || '';
        
        // Признаки навигации/меню
        const navigationIndicators = [
            'Приказы', 'Войска', 'Сбор ресурсов', 'Массовый сбор ресурсов',
            'Симулятор', 'Соседние деревни', 'Шаблоны', 'Массовое подкрепление',
            'Overview', 'Reports', 'Messages', 'Profile', 'Forum', 'Logout',
            'navigation', 'menu', 'navi', 'submenu', 'quickbar'
        ];
        
        for (const indicator of navigationIndicators) {
            if (text.includes(indicator) || classList.toLowerCase().includes(indicator.toLowerCase())) {
                return true;
            }
        }
        
        // Признаки ссылок меню
        const menuLinks = element.querySelectorAll('a[href*="mode="], a[href*="screen="]');
        if (menuLinks.length > 3) {
            return true;
        }
        
        // Элементы с малым количеством текста (вероятно не деревни)
        if (text.length < 100 && !findVillageLinkWithCoords(element)) {
            return true;
        }
        
        return false;
    }

    function findVillageLinkWithCoords(row) {
        const links = row.querySelectorAll('a[href*="village"]');
        
        for (let link of links) {
            const text = link.textContent;
            // Ищем ссылки с координатами деревни (формат K44, (462|453) и т.д.)
            if (text.match(/[Kk]\d+/) || text.match(/\(\d+\|\d+\)/) || text.match(/\d+\|\d+/)) {
                return link;
            }
        }
        
        return null;
    }

    function hasScavengeControls(row) {
        // Расширяем поиск элементов управления
        const buttons = row.querySelectorAll('button, input[type="submit"], input[type="button"], .btn, .button');
        const selects = row.querySelectorAll('select');
        
        // Проверяем кнопки отправки
        const scavengeButtons = Array.from(buttons).filter(btn => {
            const text = btn.textContent || btn.value || '';
            const onClick = btn.getAttribute('onclick') || '';
            return text.includes('Отправить') || 
                   text.includes('Send') || 
                   text.includes('Сбор') ||
                   onClick.includes('scavenge') ||
                   text.includes('Отпр') ||
                   btn.id.includes('scavenge');
        });
        
        // Проверяем выпадающие списки
        const scavengeSelects = Array.from(selects).filter(select => {
            const options = select.querySelectorAll('option');
            return Array.from(options).some(opt => 
                opt.textContent.includes('собиратель') || 
                opt.textContent.includes('scavenge')
            );
        });
        
        const hasControls = scavengeButtons.length > 0 || scavengeSelects.length > 0;
        
        if (hasControls) {
            addDebugLog(`Найдены элементы управления: кнопок=${scavengeButtons.length}, селектов=${scavengeSelects.length}`, 'success');
        }
        
        return hasControls;
    }

    function extractVillageInfoFromRow(row) {
        const villageLink = findVillageLinkWithCoords(row);
        if (!villageLink) {
            return null;
        }
        
        const villageHref = villageLink.getAttribute('href');
        const villageIdMatch = villageHref.match(/village=(\d+)/);
        if (!villageIdMatch) {
            return null;
        }
        
        const villageId = villageIdMatch[1];
        const villageName = villageLink.textContent.trim();
        
        addDebugLog(`Деревня: ${villageName} (ID:${villageId})`, 'success');
        
        return {
            id: villageId,
            name: villageName
        };
    }

    // УЛУЧШЕННАЯ ФУНКЦИЯ ОПРЕДЕЛЕНИЯ ВОЙСК
    function getAccurateLocalUnitsFromRow(row, villageName) {
        const units = {};
        
        try {
            // Инициализируем все юниты нулями
            worldUnits.forEach(unit => {
                units[unit.id] = 0;
            });
            
            addDebugLog(`Точный поиск войск для деревни: ${villageName}`, 'info');
            
            // СПЕЦИАЛЬНЫЙ МЕТОД: ищем таблицу с войсками
            const troopTables = row.querySelectorAll('table');
            let foundTroops = false;
            
            for (let table of troopTables) {
                const rows = table.querySelectorAll('tr');
                
                for (let tr of rows) {
                    const cells = tr.querySelectorAll('td');
                    const rowText = tr.textContent.toLowerCase();
                    
                    // Ищем строки с названиями юнитов
                    worldUnits.forEach(unit => {
                        if (rowText.includes(unit.name.toLowerCase()) || 
                            rowText.includes(unit.id)) {
                            
                            // В соседних ячейках ищем числа
                            for (let cell of cells) {
                                const numbers = cell.textContent.match(/\d+/g);
                                if (numbers) {
                                    for (let num of numbers) {
                                        const count = parseInt(num);
                                        // Проверяем что это разумное количество войск
                                        if (count > 0 && count < 100000) {
                                            units[unit.id] = count;
                                            addDebugLog(`Найдено ${unit.name}: ${count}`, 'success');
                                            foundTroops = true;
                                            break;
                                        }
                                    }
                                }
                                if (units[unit.id] > 0) break;
                            }
                        }
                    });
                }
            }
            
            // ЕСЛИ НЕ НАШЛИ ТАБЛИЦУ, используем улучшенный текстовый поиск
            if (!foundTroops) {
                const text = row.textContent;
                worldUnits.forEach(unit => {
                    // Ищем паттерн: "НазваниеЮнита число"
                    const pattern = new RegExp(unit.name + '[^\\d]*(\\d+)', 'i');
                    const match = text.match(pattern);
                    if (match) {
                        units[unit.id] = parseInt(match[1]);
                        addDebugLog(`Текстовый поиск: ${unit.name} - ${units[unit.id]}`, 'info');
                    }
                });
            }
            
            // Логируем итоговое распределение
            let totalFound = 0;
            Object.keys(units).forEach(unitType => {
                if (units[unitType] > 0) {
                    totalFound += units[unitType];
                    addDebugLog(`  ${getUnitName(unitType)}: ${units[unitType]}`, 'info');
                }
            });
            
            if (totalFound === 0) {
                addDebugLog('Не удалось определить войска, используем значения по умолчанию', 'warning');
                // Значения по умолчанию для тестирования
                worldUnits.forEach(unit => {
                    if (troopTypesEnabled[unit.id]) {
                        units[unit.id] = 100;
                    }
                });
            }
            
        } catch (e) {
            addDebugLog(`Ошибка парсинга войск: ${e.message}`, 'error');
            // Устанавливаем значения по умолчанию при ошибке
            worldUnits.forEach(unit => {
                units[unit.id] = troopTypesEnabled[unit.id] ? 100 : 0;
            });
        }
        
        return units;
    }

    function getRealCategoryOptions(row) {
        const options = {};
        
        try {
            addDebugLog('Поиск элементов управления категориями...', 'info');
            
            const categoryElements = row.querySelectorAll('[class*="option-"]');
            addDebugLog(`Найдено элементов категорий: ${categoryElements.length}`, 'info');
            
            for (let i = 1; i <= 4; i++) {
                let isAvailable = false;
                let isLocked = false;
                let isActive = false;
                
                // Ищем основной элемент категории (не header)
                const categoryElement = Array.from(categoryElements).find(el => 
                    el.className.includes(`option-${i}`) && 
                    !el.className.includes('header-option')
                );
                
                if (categoryElement) {
                    const className = categoryElement.className;
                    
                    // Определяем статус по классам
                    isLocked = className.includes('option-locked');
                    isActive = className.includes('option-active');
                    isAvailable = !isLocked && (isActive || className.includes('option-inactive'));
                    
                    addDebugLog(`Категория ${i}: locked=${isLocked}, active=${isActive}, available=${isAvailable}`, 
                               isAvailable ? 'success' : 'warning');
                } else {
                    addDebugLog(`Категория ${i}: не найдена`, 'warning');
                }
                
                options[i] = {
                    is_locked: isLocked,
                    is_active: isActive,
                    scavenging_squad: null,
                    available: isAvailable && categoryEnabled[i-1],
                    name: categoryNames[i] || `Категория ${i}`
                };
            }
            
        } catch (e) {
            addDebugLog(`Ошибка определения категорий: ${e.message}`, 'error');
            // Резервные настройки
            for (let i = 1; i <= 4; i++) {
                options[i] = {
                    is_locked: false,
                    is_active: true,
                    scavenging_squad: null,
                    available: categoryEnabled[i-1],
                    name: categoryNames[i] || `Категория ${i}`
                };
            }
        }
        
        return options;
    }
    

    function getUnitName(unitId) {
        const unit = worldUnits.find(u => u.id === unitId);
        return unit ? unit.name : unitId;
    }

    // ========== УЛУЧШЕННАЯ ЛОГИКА РАСПРЕДЕЛЕНИЯ ДЛЯ ОДНОВРЕМЕННОГО ВОЗВРАЩЕНИЯ ==========
    function calculateScavengingSquads(villages) {
        addDebugLog(`Расчет отрядов для ${villages.length} деревень...`, 'info');
        const squads = [];
        
        villages.forEach(village => {
            const villageSquads = calculateOptimalSquadsForVillage(village);
            squads.push(...villageSquads);
        });
        
        addDebugLog(`Всего создано отрядов: ${squads.length}`, 'success');
        return squads;
    }

    function analyzeTroopDistribution(village) {
        addDebugLog('=== АНАЛИЗ РАСПРЕДЕЛЕНИЯ ВОЙСК ===', 'info');
        addDebugLog(`Деревня: ${village.name}`, 'info');
        
        const totalAvailable = Object.values(village.units).reduce((sum, count) => sum + count, 0);
        addDebugLog(`Всего доступно войск: ${totalAvailable}`, 'info');
        
        worldUnits.forEach(unit => {
            const count = village.units[unit.id] || 0;
            const backup = keepHome[unit.id] || 0;
            const enabled = troopTypesEnabled[unit.id];
            
            if (count > 0) {
                addDebugLog(`  ${unit.name}: ${count} (резерв: ${backup}, включен: ${enabled ? 'да' : 'нет'})`, 
                           enabled ? 'success' : 'warning');
            }
        });
        
        const enabledCount = worldUnits.filter(unit => troopTypesEnabled[unit.id]).length;
        addDebugLog(`Включено типов войск: ${enabledCount}`, 'info');
    }

    function createOptimalSquad(availableUnits, maxCapacity) {
        const squad = {};
        let remainingCapacity = maxCapacity;
        
        // Используем только включенные типы войск
        const enabledUnits = worldUnits.filter(unit => 
            troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0
        );
        
        addDebugLog(`Создание оптимального отряда, максимальная емкость: ${maxCapacity}`, 'info');
        addDebugLog(`Доступные типы войск: ${enabledUnits.map(u => `${u.name}(${availableUnits[u.id]})`).join(', ')}`, 'info');
        
        if (enabledUnits.length === 0) {
            addDebugLog('❌ Нет доступных выбранных типов войск', 'error');
            return null;
        }
        
        // Стратегия: используем ВСЕ доступные войска по порядку вместимости
        // Сначала более эффективные по грузоподъемности
        
        // Сортируем юниты по вместимости (от большей к меньшей)
        const sortedByCapacity = [...enabledUnits].sort((a, b) => b.capacity - a.capacity);
        
        addDebugLog(`Сортировка по вместимости: ${sortedByCapacity.map(u => u.name).join(' -> ')}`, 'info');
        
        // Первый проход: пытаемся использовать все войска каждого типа
        for (const unit of sortedByCapacity) {
            if (remainingCapacity <= 0) break;
            
            const availableCount = availableUnits[unit.id];
            if (availableCount <= 0) continue;
            
            const maxByCapacity = Math.floor(remainingCapacity / unit.capacity);
            const unitCount = Math.min(availableCount, maxByCapacity);
            
            if (unitCount > 0) {
                squad[unit.id] = unitCount;
                remainingCapacity -= unitCount * unit.capacity;
                addDebugLog(`  ${unit.name}: ${unitCount}/${availableCount} (емкость: ${unitCount * unit.capacity})`, 'success');
            }
        }
        
        const finalCapacity = calculateTotalCapacity(squad);
        
        // Второй проход: если осталась грузоподъемность, пытаемся добавить оставшиеся войска
        if (remainingCapacity > 0) {
            addDebugLog(`Осталось грузоподъемности: ${remainingCapacity}, пробуем добавить оставшиеся войска`, 'info');
            
            for (const unit of sortedByCapacity) {
                if (remainingCapacity <= 0) break;
                
                const usedCount = squad[unit.id] || 0;
                const availableCount = availableUnits[unit.id];
                const remainingCount = availableCount - usedCount;
                
                if (remainingCount > 0 && unit.capacity <= remainingCapacity) {
                    // Можем добавить хотя бы одного юнита
                    const canAdd = Math.min(remainingCount, Math.floor(remainingCapacity / unit.capacity));
                    if (canAdd > 0) {
                        squad[unit.id] = (squad[unit.id] || 0) + canAdd;
                        remainingCapacity -= canAdd * unit.capacity;
                        addDebugLog(`  Добавлено ${canAdd} ${unit.name} (осталось ${remainingCount - canAdd})`, 'info');
                    }
                }
            }
        }
        
        const finalCapacityAfter = calculateTotalCapacity(squad);
        addDebugLog(`Итоговая грузоподъемность: ${finalCapacityAfter}/${maxCapacity}`, 
                    finalCapacityAfter > 0 ? 'success' : 'error');
        
        // Проверяем, что мы используем разумное количество войск
        if (finalCapacityAfter === 0) {
            addDebugLog('❌ Не удалось создать отряд с ненулевой грузоподъемностью', 'error');
            return null;
        }
        
        // Логируем эффективность использования
        const efficiency = (finalCapacityAfter / maxCapacity * 100).toFixed(1);
        addDebugLog(`Эффективность использования категории: ${efficiency}%`, 'info');
        
        return finalCapacityAfter > 0 ? squad : null;
    }

    function calculateRemainingUnits(originalUnits, usedSquad) {
        const remaining = {};
        
        worldUnits.forEach(unit => {
            const original = originalUnits[unit.id] || 0;
            const used = usedSquad[unit.id] || 0;
            remaining[unit.id] = original - used;
        });
        
        return remaining;
    }
    
    
    function calculateOptimalSquadsForVillage(village) {
        analyzeTroopDistribution(village);
        const squads = [];
        const availableUnits = { ...village.units };
        
        addDebugLog(`=== ОПТИМАЛЬНЫЙ РАСЧЕТ ДЛЯ ДЕРЕВНИ: ${village.name} ===`, 'info');
        addDebugLog(`Исходные доступные войска: ${JSON.stringify(availableUnits)}`, 'info');
        
        // Вычитаем backup из доступных войск
        worldUnits.forEach(unit => {
            const backup = keepHome[unit.id] || 0;
            availableUnits[unit.id] = Math.max(0, availableUnits[unit.id] - backup);
            if (backup > 0) {
                addDebugLog(`  Резерв для ${getUnitName(unit.id)}: ${backup}`, 'info');
            }
        });
        
        addDebugLog(`Войска после резерва: ${JSON.stringify(availableUnits)}`, 'info');
        
        // Рассчитываем общую доступную грузоподъемность
        const totalAvailableCapacity = calculateTotalCapacity(availableUnits);
        addDebugLog(`Общая грузоподъемность после резерва: ${totalAvailableCapacity}`, 'success');
        
        if (totalAvailableCapacity === 0) {
            addDebugLog(`❌ В деревне "${village.name}" нет доступных войск после вычета резерва`, 'warning');
            return squads;
        }
        
        // Определяем ВСЕ доступные категории для этой деревни
        const availableCategories = getAllAvailableCategories(village, totalAvailableCapacity);
        
        if (availableCategories.length === 0) {
            addDebugLog(`❌ Нет доступных категорий для деревни "${village.name}"`, 'warning');
            addDebugLog(`Проверьте: 1) Включены ли категории в настройках 2) Хватает ли грузоподъемности`, 'error');
            return squads;
        }
        
        addDebugLog(`Доступные категории: ${availableCategories.map(cat => village.options[cat].name).join(', ')}`, 'success');
        
        // НОВАЯ СТРАТЕГИЯ: отправляем ВСЕ доступные войска в первую доступную категорию
        // до максимальной грузоподъемности категории
        
        const targetCategory = availableCategories[0];
        const maxCategoryCapacity = baseCapacities[targetCategory];
        
        addDebugLog(`Используем категорию ${targetCategory} (${village.options[targetCategory].name})`, 'info');
        addDebugLog(`Максимальная грузоподъемность категории: ${maxCategoryCapacity}`, 'info');
        addDebugLog(`Общая доступная грузоподъемность: ${totalAvailableCapacity}`, 'info');
        
        // Создаем отряд используя ВСЕ доступные войска (до лимита категории)
        const squad = createOptimalSquad(availableUnits, maxCategoryCapacity);
        
        if (squad && hasUnits(squad)) {
            const squadCapacity = calculateTotalCapacity(squad);
            const usedCapacityPercent = (squadCapacity / totalAvailableCapacity * 100).toFixed(1);
            
            squads.push({
                village_id: village.id,
                candidate_squad: squad,
                option_id: targetCategory,
                use_premium: false,
                village_name: village.name,
                category_name: village.options[targetCategory].name
            });
            
            addDebugLog(`✅ Создан отряд для "${village.name}" -> ${village.options[targetCategory].name}`, 'success');
            addDebugLog(`Состав отряда: ${JSON.stringify(squad)}`, 'info');
            addDebugLog(`Грузоподъемность отряда: ${squadCapacity}/${maxCategoryCapacity}`, 'info');
            addDebugLog(`Использовано войск: ${usedCapacityPercent}% от доступных`, 'info');
            
            // Логируем оставшиеся войска
            const remainingUnits = calculateRemainingUnits(availableUnits, squad);
            addDebugLog(`Оставшиеся войска в деревне: ${JSON.stringify(remainingUnits)}`, 'warning');
        } else {
            addDebugLog(`❌ Не удалось создать отряд для категории ${targetCategory}`, 'error');
        }
        
        return squads;
    }

    function getAllAvailableCategories(village, totalCapacity) {
        const categories = [];
        
        addDebugLog(`Проверка доступных категорий для деревни ${village.name}:`, 'info');
        
        for (let cat = 1; cat <= 4; cat++) {
            const categoryInfo = village.options[cat];
            const isEnabled = categoryEnabled[cat-1];
            const hasCapacity = totalCapacity >= baseCapacities[cat];
            
            addDebugLog(`Категория ${cat}: enabled=${isEnabled}, available=${categoryInfo.available}, capacity=${hasCapacity}`, 'info');
            
            if (isEnabled && categoryInfo.available && hasCapacity) {
                categories.push(cat);
                addDebugLog(`✅ Категория ${cat} доступна`, 'success');
            } else {
                addDebugLog(`❌ Категория ${cat} недоступна`, 'warning');
            }
        }
        
        // Сортируем по приоритету
        if (prioritiseHighCat) {
            categories.sort((a, b) => b - a);
            addDebugLog(`Приоритет высших категорий: ${categories.join(', ')}`, 'info');
        } else {
            categories.sort((a, b) => a - b);
            addDebugLog(`Стандартный порядок: ${categories.join(', ')}`, 'info');
        }
        
        return categories;
    }

    function calculateTotalCapacity(units) {
        return worldUnits.reduce((sum, unit) => {
            return sum + ((units[unit.id] || 0) * unit.capacity);
        }, 0);
    }

    function hasUnits(squad) {
        return squad && Object.values(squad).some(count => count > 0);
    }

    // ========== УЛУЧШЕННАЯ ОТПРАВКА ОТРЯДОВ ==========
    function sendScavengingSquads(squads) {
        if (squads.length === 0) {
            addDebugLog('Нет отрядов для отправки!', 'error');
            showNotification('Нет отрядов для отправки!', 'error');
            return;
        }
        
        addDebugLog(`Начинаем отправку ${squads.length} отрядов...`, 'info');
        updateProgress(`🚀 Отправка ${squads.length} отрядов...`);
        
        sendWithButtonClicks(squads);
    }

    function sendWithButtonClicks(squads) {
        addDebugLog('Используем метод отправки через клики по элементам', 'info');
        
        let sentCount = 0;
        const totalSquads = squads.length;

        // Группируем отряды по деревням для более логичной отправки
        const squadsByVillage = {};
        squads.forEach(squad => {
            if (!squadsByVillage[squad.village_name]) {
                squadsByVillage[squad.village_name] = [];
            }
            squadsByVillage[squad.village_name].push(squad);
        });

        function sendNextVillage() {
            const villageNames = Object.keys(squadsByVillage);
            if (villageNames.length === 0 || !isRunning) {
                completeRealScavenging();
                return;
            }

            const villageName = villageNames[0];
            const villageSquads = squadsByVillage[villageName];
            
            addDebugLog(`Обработка деревни ${villageName}: ${villageSquads.length} отрядов`, 'info');
            updateProgress(`🏘️ Обработка ${villageName}: ${villageSquads.length} отрядов`);

            sendVillageSquads(villageName, villageSquads, 0, () => {
                // После отправки всех отрядов деревни, удаляем ее из списка и переходим к следующей
                delete squadsByVillage[villageName];
                setTimeout(sendNextVillage, 2000); // Пауза между деревнями
            });
        }

        function sendVillageSquads(villageName, squads, index, callback) {
            if (index >= squads.length || !isRunning) {
                callback();
                return;
            }

            const squad = squads[index];
            const squadNumber = index + 1;
            
            addDebugLog(`Отправка отряда ${squadNumber}/${squads.length} из ${villageName}: ${squad.category_name}`, 'info');
            updateProgress(`📤 ${villageName}: ${squadNumber}/${squads.length} (${squad.category_name})`);

            const villageRow = findRealVillageRow(villageName);
            if (villageRow) {
                const success = sendSquadToVillage(villageRow, squad);
                if (success) {
                    sentCount++;
                    addDebugLog(`✅ Отряд отправлен: ${villageName} -> ${squad.category_name}`, 'success');
                    
                    // Пауза между отправками отрядов из одной деревни
                    setTimeout(() => {
                        sendVillageSquads(villageName, squads, index + 1, callback);
                    }, 1000);
                } else {
                    addDebugLog(`❌ Ошибка отправки отряда, пропускаем`, 'error');
                    setTimeout(() => {
                        sendVillageSquads(villageName, squads, index + 1, callback);
                    }, 500);
                }
            } else {
                addDebugLog(`❌ Не найдена строка для деревни, пропускаем все отряды`, 'error');
                callback();
            }
        }

        // Начинаем отправку
        sendNextVillage();
    }

    // УЛУЧШЕННАЯ ФУНКЦИЯ ОТПРАВКИ ОТРЯДОВ
    async function sendSquadToVillage(row, squad) {
        try {
            addDebugLog(`Отправка отряда в деревню ${squad.village_name}...`, 'info');
            
            // ДИАГНОСТИКА: тестируем кликабельность категорий
            addDebugLog('=== ДИАГНОСТИКА КЛИКАБЕЛЬНОСТИ ===', 'info');
            const isClickable = await testCategoryClickability(row, squad.option_id);
            
            if (!isClickable) {
                addDebugLog(`❌ Категория ${squad.option_id} не кликабельна`, 'error');
                return false;
            }
            
            // Основная логика отправки...
            const categoryElements = row.querySelectorAll('[class*="option-"]');
            const targetCategoryClass = `option-${squad.option_id}`;
            let categoryElement = null;

            for (let element of categoryElements) {
                if (element.className.includes(targetCategoryClass) && 
                    !element.className.includes('header-option')) {
                    categoryElement = element;
                    break;
                }
            }

            if (!categoryElement) {
                return false;
            }

            // Кликаем на категорию для активации
            categoryElement.click();
            addDebugLog(`✅ Категория ${squad.option_id} активирована`, 'success');

            // Ждем и отправляем
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await sendActivatedCategory(row, squad, categoryElement);
            
        } catch (e) {
            addDebugLog(`Ошибка при отправке: ${e.message}`, 'error');
            return false;
        }
    }

    // Функция для диагностики кликабельности
    function testCategoryClickability(row, categoryId) {
        return new Promise((resolve) => {
            const categoryElement = row.querySelector(`.option-${categoryId}:not(.header-option)`);
            if (!categoryElement) {
                resolve(false);
                return;
            }
            
            // Добавляем временный обработчик для отслеживания кликов
            const clickHandler = () => {
                addDebugLog(`✅ Категория ${categoryId} кликабельна!`, 'success');
                resolve(true);
            };
            
            categoryElement.addEventListener('click', clickHandler, { once: true });
            
            // Кликаем на категорию
            categoryElement.click();
            
            // Ждем реакции
            setTimeout(() => {
                categoryElement.removeEventListener('click', clickHandler);
                resolve(false);
            }, 1000);
        });
    }

    // УЛУЧШЕННАЯ ФУНКЦИЯ ДЛЯ ОТПРАВКИ АКТИВИРОВАННОЙ КАТЕГОРИИ
    function sendActivatedCategory(row, squad, categoryElement) {
        return new Promise((resolve) => {
            addDebugLog(`Отправка активированной категории ${squad.option_id}...`, 'info');

            // ДОБАВЛЕНО: Ждем дольше для полной активации категории
            setTimeout(() => {
                // ДОБАВЛЕНО: Проверяем, что категория действительно активировалась
                const isActive = categoryElement.className.includes('option-active');
                
                if (!isActive) {
                    addDebugLog('❌ Категория не активировалась, пробуем еще раз...', 'warning');
                    // Пробуем кликнуть еще раз
                    categoryElement.click();
                    
                    setTimeout(() => {
                        attemptSend(row, resolve);
                    }, 1000);
                    return;
                }
                
                attemptSend(row, resolve);
            }, 2000); // УВЕЛИЧЕНО время ожидания
        });
    }

    // НОВАЯ ФУНКЦИЯ: Попытка отправки
    function attemptSend(row, resolve) {
        // УЛУЧШЕННЫЙ ПОИСК КНОПКИ ОТПРАВКИ
        const sendButton = findSendButtonImproved(row);
        
        if (sendButton && !sendButton.disabled) {
            addDebugLog('✅ Найдена активная кнопка отправки', 'success');
            
            // ДОБАВЛЕНО: Кликаем более надежным методом
            reliableClick(sendButton);
            addDebugLog('✅ Клик на кнопку отправки выполнен', 'success');
            
            resolve(true);
        } else {
            addDebugLog('❌ Кнопка отправки не найдена или заблокирована', 'error');
            
            // УЛУЧШЕННЫЙ ПОИСК ФОРМЫ
            const form = findScavengeFormImproved(row);
            if (form) {
                addDebugLog('Пробуем отправить форму напрямую...', 'info');
                form.submit();
                resolve(true);
            } else {
                // ПОСЛЕДНЯЯ ПОПЫТКА: ищем любую кнопку отправки на странице
                const anySendButton = document.querySelector('input[value*="Отправить"], input[value*="Send"], button[type="submit"]');
                if (anySendButton && !anySendButton.disabled) {
                    addDebugLog('Найдена кнопка отправки вне строки, пробуем использовать...', 'warning');
                    reliableClick(anySendButton);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        }
    }

    // УЛУЧШЕННАЯ ФУНКЦИЯ ПОИСКА КНОПКИ
    function findSendButtonImproved(row) {
        // Расширяем поиск кнопки отправки
        const buttons = row.querySelectorAll('button, input[type="submit"], input[type="button"], .btn');
        
        // Приоритетные селекторы для кнопки отправки
        const sendButtonSelectors = [
            'input[value*="Отправить"]',
            'input[value*="Send"]', 
            'button[type="submit"]',
            '.btn-confirm',
            '.btn-send',
            '.btn-default',
            '[class*="send"]',
            '[class*="submit"]',
            '[onclick*="scavenge"]'
        ];
        
        // Сначала ищем по приоритетным селекторам
        for (const selector of sendButtonSelectors) {
            const button = row.querySelector(selector);
            if (button && !button.disabled) {
                addDebugLog(`Найдена кнопка отправки через селектор: ${selector}`, 'success');
                return button;
            }
        }
        
        // Затем ищем по тексту/значению
        for (let button of buttons) {
            const text = (button.textContent || button.value || '').toLowerCase().trim();
            const isSendButton = text === 'отправить' || 
                               text === 'send' || 
                               text === 'сбор' ||
                               text.includes('отправ') ||
                               text.includes('send') ||
                               text === 'ok' ||
                               text === 'подтвердить';
            
            if (isSendButton && !button.disabled) {
                addDebugLog(`Найдена кнопка отправки по тексту: "${text}"`, 'success');
                return button;
            }
        }
        
        // Если не нашли, возвращаем первую доступную кнопку
        for (let button of buttons) {
            if (!button.disabled) {
                const text = (button.textContent || button.value || '').toLowerCase();
                const isCategoryButton = text.includes('+20%') || 
                                       text.includes('premium') ||
                                       button.className.includes('option-');
                
                if (!isCategoryButton) {
                    addDebugLog(`Используем альтернативную кнопку: "${text}"`, 'warning');
                    return button;
                }
            }
        }
        
        addDebugLog('❌ Не найдена подходящая кнопка отправки', 'error');
        return null;
    }

    // УЛУЧШЕННАЯ ФУНКЦИЯ ПОИСКА ФОРМЫ
    function findScavengeFormImproved(row) {
        // Ищем форму в строке
        const forms = row.querySelectorAll('form');
        for (let form of forms) {
            if (form.action.includes('scavenge') || form.innerHTML.includes('scavenge')) {
                return form;
            }
        }
        
        // Ищем форму по содержанию
        const allForms = document.querySelectorAll('form');
        for (let form of allForms) {
            const html = form.innerHTML;
            if ((html.includes('option-') && html.includes('собиратели')) || 
                html.includes('scavenge_mass')) {
                return form;
            }
        }
        
        // Ищем форму по атрибутам
        const formsWithScavenge = document.querySelectorAll('form[action*="scavenge"], form[id*="scavenge"]');
        if (formsWithScavenge.length > 0) {
            return formsWithScavenge[0];
        }
        
        return null;
    }

    // НОВАЯ ФУНКЦИЯ: Надежный клик
    function reliableClick(element) {
        try {
            // Пробуем разные методы клика
            if (element.click) {
                element.click();
            } else if (element.dispatchEvent) {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(clickEvent);
            }
            
            // Дополнительно фокусируем элемент
            if (element.focus) element.focus();
            
            return true;
        } catch (e) {
            addDebugLog(`Ошибка при клике: ${e.message}`, 'error');
            return false;
        }
    }

    function completeRealScavenging() {
        addDebugLog('Массовый сбор завершен!', 'success');
        showNotification('🎉 Реальный массовый сбор завершен!', 'success');
        updateProgress('✅ Сбор завершен!');
        scheduleNextRun();
    }

    function scheduleNextRun() {
        if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
            const intervalMs = repeatInterval * 60 * 1000;
            addDebugLog(`Следующий запуск через ${repeatInterval} минут`, 'info');
            updateProgress(`⏰ Следующий запуск через ${repeatInterval} минут...`);
            showNotification(`Следующий запуск через ${repeatInterval} минут`, 'info');
            
            repeatTimer = setTimeout(() => {
                if (isRunning) {
                    window.location.reload();
                }
            }, intervalMs);
        } else {
            isRunning = false;
            updateUIStatus(false, 
                repeatEnabled ? `Все повторы завершены (${currentRepeat})` : 'Сбор завершен'
            );
        }
    }

    // ========== УПРОЩЕННЫЙ ИНТЕРФЕЙС ==========
    function createSettingsInterface() {
        return `
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎯 Настройки войск</div>
                <div style="margin-bottom: 6px; font-size: 10px; color: #bdc3c7;">
                    Выберите типы войск для отправки
                </div>
                <div class="units-row" id="unitsContainer"></div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Категории сбора</div>
                <div class="categories-row">
                    ${[1,2,3,4].map(i => `
                        <div class="category-item">
                            <input type="checkbox" id="cat_${i}" ${categoryEnabled[i-1] ? 'checked' : ''}>
                            <label for="cat_${i}" style="color: white; font-size: 10px;">${categoryNames[i]}</label>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⚙️ Дополнительные настройки</div>
                <div class="compact-settings">
                    <div class="setting-item">
                        <input type="checkbox" id="priority_high" ${prioritiseHighCat ? 'checked' : ''}>
                        <label for="priority_high" class="setting-label">Приоритет высших категорий</label>
                    </div>
                    <div class="setting-item">
                        <input type="checkbox" id="repeatEnabled" ${repeatEnabled ? 'checked' : ''}>
                        <label for="repeatEnabled" class="setting-label">Повторный запуск</label>
                    </div>
                    <div id="repeatSettings" style="${repeatEnabled ? '' : 'display: none;'} margin-top: 6px; padding: 6px; background: #2c3e50; border-radius: 4px;">
                        <div style="margin-bottom: 6px;">
                            <label style="color: #bdc3c7; font-size: 10px; display: block;">Количество повторов:</label>
                            <input type="number" id="repeatCount" value="${repeatCount}" min="1" max="100" style="width: 100%; padding: 3px; background: #34495e; color: white; border: 1px solid #7f8c8d; border-radius: 3px; font-size: 10px;">
                        </div>
                        <div>
                            <label style="color: #bdc3c7; font-size: 10px; display: block;">Интервал (минуты):</label>
                            <input type="number" id="repeatInterval" value="${repeatInterval}" min="1" max="1440" style="width: 100%; padding: 3px; background: #34495e; color: white; border: 1px solid #7f8c8d; border-radius: 3px; font-size: 10px;">
                        </div>
                    </div>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎮 Управление</div>
                <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">
                    ▶️ Запустить сбор
                </button>
                <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat" style="${repeatEnabled ? '' : 'display: none;'}">
                    🔄 Запустить с повторами
                </button>
                <button class="g4lkir95-button" id="stopButton" style="display: none;">
                    ⏹️ Остановить
                </button>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px;">
                    <button class="g4lkir95-button" onclick="window.g4lkir95SaveSettings()" style="font-size: 10px; padding: 4px;">
                        💾 Сохранить
                    </button>
                    <button class="g4lkir95-button" onclick="window.g4lkir95ClearLogs()" style="font-size: 10px; padding: 4px;">
                        🗑️ Очистить логи
                    </button>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">Готов к работе</div>
                <div id="progressInfo" style="font-size: 10px; text-align: center; color: #bdc3c7; margin: 6px 0; padding: 6px; background: #2c3e50; border-radius: 4px;">
                    Ожидание запуска...
                </div>
                <div class="g4lkir95-section-title">🔍 Логи выполнения</div>
                <div class="debug-logs" id="debugLogs"></div>
            </div>
        `;
    }

    function createUnitsInterface() {
        const container = document.getElementById('unitsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        worldUnits.forEach(unit => {
            const unitItem = document.createElement('div');
            unitItem.className = 'unit-item';
            unitItem.innerHTML = `
                <input type="checkbox" id="troop_${unit.id}" class="unit-checkbox" 
                    ${troopTypesEnabled[unit.id] ? 'checked' : ''}>
                <div class="unit-name">${unit.name}</div>
                <input type="number" id="backup_${unit.id}" class="unit-backup" 
                    value="${keepHome[unit.id] || 0}" min="0" max="9999" 
                    placeholder="0" title="Оставить войск в деревне"
                    style="width: 60px;">
            `;
            container.appendChild(unitItem);
        });
    }

    function createInterface() {
        const existing = document.querySelector('.g4lkir95-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">Mass Scavenging v4.9.8</div>
            ${createSettingsInterface()}
        `;

        document.body.appendChild(panel);
        createUnitsInterface();
        updateDebugLogsDisplay();

        // Инициализация обработчиков событий
        initializeEventHandlers(panel);
    }

    // Новая функция для инициализации обработчиков событий
    function initializeEventHandlers(panel) {
        // Обработчики для категорий
        for (let i = 1; i <= 4; i++) {
            const checkbox = panel.querySelector('#cat_' + i);
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    categoryEnabled[i-1] = this.checked;
                    addDebugLog(`Категория ${i} ${this.checked ? 'включена' : 'выключена'}`, 'info');
                });
            }
        }

        // Обработчик для приоритета категорий
        const priorityCheckbox = panel.querySelector('#priority_high');
        if (priorityCheckbox) {
            priorityCheckbox.addEventListener('change', function() {
                prioritiseHighCat = this.checked;
                addDebugLog(`Приоритет высших категорий ${this.checked ? 'включен' : 'выключен'}`, 'info');
            });
        }

        // Обработчики для повторного запуска
        const repeatEnabledEl = panel.querySelector('#repeatEnabled');
        const repeatCountEl = panel.querySelector('#repeatCount');
        const repeatIntervalEl = panel.querySelector('#repeatInterval');
        const repeatSettingsEl = panel.querySelector('#repeatSettings');
        const startRepeatEl = panel.querySelector('#startRepeat');

        if (repeatEnabledEl) {
            repeatEnabledEl.addEventListener('change', function() {
                repeatEnabled = this.checked;
                if (repeatSettingsEl) {
                    repeatSettingsEl.style.display = this.checked ? 'block' : 'none';
                }
                if (startRepeatEl) {
                    startRepeatEl.style.display = this.checked ? 'block' : 'none';
                }
                addDebugLog(`Повторный запуск ${this.checked ? 'включен' : 'выключен'}`, 'info');
            });
        }

        if (repeatCountEl) {
            repeatCountEl.addEventListener('change', function() {
                repeatCount = parseInt(this.value) || 1;
                addDebugLog(`Количество повторов установлено: ${repeatCount}`, 'info');
            });
        }
        
        if (repeatIntervalEl) {
            repeatIntervalEl.addEventListener('change', function() {
                repeatInterval = parseInt(this.value) || 60;
                addDebugLog(`Интервал установлен: ${repeatInterval} минут`, 'info');
            });
        }

        // Обработчики для кнопок управления
        const startSingleEl = panel.querySelector('#startSingle');
        const stopButtonEl = panel.querySelector('#stopButton');

        if (startSingleEl) {
            startSingleEl.addEventListener('click', function() {
                addDebugLog('Запуск одиночного сбора...', 'info');
                startMassScavenging(false);
            });
        }
        
        if (startRepeatEl) {
            startRepeatEl.addEventListener('click', function() {
                addDebugLog('Запуск сбора с повторами...', 'info');
                startMassScavenging(true);
            });
        }
        
        if (stopButtonEl) {
            stopButtonEl.addEventListener('click', function() {
                addDebugLog('Остановка сбора...', 'info');
                stopMassScavenging();
            });
        }
    }

    function startMassScavenging(enableRepeat) {
        if (isRunning) {
            showNotification('Скрипт уже выполняется!', 'error');
            return;
        }

        isRunning = true;
        repeatEnabled = enableRepeat;
        currentRepeat = 0;

        // Логируем текущие настройки для отладки
        addDebugLog('=== ТЕКУЩИЕ НАСТРОЙКИ ===', 'info');
        addDebugLog(`Категории: ${categoryEnabled.map((enabled, i) => enabled ? categoryNames[i+1] : null).filter(Boolean).join(', ')}`, 'info');
        addDebugLog(`Типы войск: ${worldUnits.filter(unit => troopTypesEnabled[unit.id]).map(unit => unit.name).join(', ')}`, 'info');
        addDebugLog(`Приоритет высших категорий: ${prioritiseHighCat}`, 'info');
        addDebugLog(`Повторный запуск: ${repeatEnabled}`, 'info');

        updateUIStatus(true, 'Запуск реального массового сбора...');
        showNotification('Запуск РЕАЛЬНОГО массового сбора...', 'info');
        
        loadSophieSettings();
        executeScavengingCycle();
    }

    function stopMassScavenging() {
        isRunning = false;
        if (repeatTimer) clearTimeout(repeatTimer);
        updateUIStatus(false, 'Выполнение остановлено');
        showNotification('Массовый сбор остановлен', 'info');
    }

    function executeScavengingCycle() {
        if (!isRunning) return;
        currentRepeat++;
        const totalRepeats = repeatEnabled ? repeatCount : 1;

        addDebugLog(`Запуск итерации ${currentRepeat}/${totalRepeats}`, 'info');
        updateProgress(`🔄 Запуск итерации ${currentRepeat} из ${totalRepeats}`);
        showNotification(`Реальный запуск сбора ${currentRepeat}/${totalRepeats}`, 'info');

        const success = readyToSend();
        if (!success) {
            stopMassScavenging();
        }
    }

    function updateUIStatus(isActive, message = '') {
        const stopBtn = document.querySelector('#stopButton');
        const startSingleBtn = document.querySelector('#startSingle');
        const startRepeatBtn = document.querySelector('#startRepeat');
        const statusSection = document.querySelector('#statusSection');
        const progressInfo = document.querySelector('#progressInfo');

        if (isActive) {
            if (stopBtn) stopBtn.style.display = 'block';
            if (startSingleBtn) startSingleBtn.style.display = 'none';
            if (startRepeatBtn) startRepeatBtn.style.display = 'none';
            if (statusSection) {
                statusSection.className = 'g4lkir95-status g4lkir95-status-active';
                statusSection.textContent = 'Выполняется...';
            }
        } else {
            if (stopBtn) stopBtn.style.display = 'none';
            if (startSingleBtn) startSingleBtn.style.display = 'block';
            if (startRepeatBtn) startRepeatBtn.style.display = 'block';
            if (statusSection) {
                statusSection.className = 'g4lkir95-status g4lkir95-status-inactive';
                statusSection.textContent = 'Готов к работе';
            }
        }
        
        if (message && progressInfo) {
            progressInfo.textContent = message;
        }
    }

    function updateProgress(message) {
        const progressInfo = document.querySelector('#progressInfo');
        if (progressInfo) {
            progressInfo.textContent = message;
            addDebugLog(`Статус: ${message}`, 'info');
        }
    }

    function addLaunchButton() {
        if (!document.querySelector('.g4lkir95-launch-btn')) {
            const launchBtn = document.createElement('button');
            launchBtn.className = 'g4lkir95-launch-btn';
            launchBtn.innerHTML = '🚀 Mass Scavenging';
            launchBtn.title = 'Открыть панель управления массовым сбором';
            launchBtn.addEventListener('click', createInterface);
            document.body.appendChild(launchBtn);
        }
    }

    function debugScavengeInterface() {
        addDebugLog('=== ДЕТАЛЬНЫЙ АНАЛИЗ ИНТЕРФЕЙСА МАССОВОГО СБОРА ===', 'info');
        
        const mainContainer = findMassScavengeContainer();
        if (!mainContainer) {
            addDebugLog('❌ Основной контейнер не найден', 'error');
            return;
        }
        
        // Ищем все элементы с текстом категорий
        const allElements = mainContainer.querySelectorAll('*');
        const categoryElements = [];
        
        allElements.forEach(element => {
            const text = element.textContent || '';
            if (text.includes('собиратели') || text.includes('Сбор')) {
                categoryElements.push({
                    element: element,
                    text: text.trim(),
                    className: element.className,
                    id: element.id
                });
            }
        });
        
        addDebugLog(`Найдено элементов связанных с сбором: ${categoryElements.length}`, 'info');
        categoryElements.forEach((item, index) => {
            addDebugLog(`Элемент ${index}: "${item.text}" class="${item.className}"`, 'info');
        });
    }

    // ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
    window.g4lkir95SaveSettings = saveSophieSettings;
    window.g4lkir95ResetSettings = function() {
        if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
            localStorage.removeItem("keepHome");
            localStorage.removeItem("categoryEnabled");
            localStorage.removeItem("troopTypesEnabled");
            localStorage.removeItem("prioritiseHighCat");
            showNotification('Настройки сброшены!', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    };
    window.g4lkir95ClearLogs = clearDebugLogs;

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v4.9.8 with FIXES...');
        
        // Проверяем, что мы на правильной странице
        if (window.location.href.indexOf('mode=scavenge_mass') === -1) {
            addDebugLog('Не на странице массового сбора. Перенаправление...', 'warning');
            // Автоматическое перенаправление уже должно работать
            return;
        }
        
        // ДОБАВЛЕНО: Проверка что интерфейс массового сбора полностью загружен
        if (window.location.href.indexOf('mode=scavenge_mass') !== -1) {
            setTimeout(() => {
                addDebugLog('Проверка загрузки интерфейса массового сбора...', 'info');
                debugScavengeInterface();
            }, 2000);
        }
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        addDebugLog('G4lKir95 Mass Scavenging v4.9.8 активирован! Исправлены проблемы с отправкой.', 'success');
        showNotification('G4lKir95 Mass Scavenging v4.9.8 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();