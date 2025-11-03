// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v4.6
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  Массовый сбор ресурсов с полным функционалом
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

    // Фиксированные настройки времени
    const time = { 'off': 4, 'def': 12 };

    // Основные юниты с русскими названиями
    const worldUnits = [
        { id: 'spear', name: 'Копейщик', capacity: 25 },
        { id: 'sword', name: 'Мечник', capacity: 15 },
        { id: 'axe', name: 'Топорщик', capacity: 10 },
        { id: 'light', name: 'Лёгкая кавалерия', capacity: 80 },
        { id: 'heavy', name: 'Тяжелая кавалерия', capacity: 50 }
    ];

    // Названия категорий
    const categoryNames = {
        1: "Ленивые собиратели",
        2: "Быстрые собиратели", 
        3: "Находчивые собиратели",
        4: "Жадные собиратели"
    };

    // ========== СТИЛИ G4LKIR95 ==========
    const styles = `
        .g4lkir95-panel {
            position: fixed; 
            top: 50px; 
            right: 10px; 
            width: 450px;
            background: #2c3e50; 
            border: 2px solid #34495e; 
            border-radius: 8px;
            padding: 15px; 
            z-index: 10000; 
            font-family: Arial; 
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
            max-height: 90vh; 
            overflow-y: auto;
        }
        .g4lkir95-header {
            background: #34495e; 
            padding: 10px; 
            margin: -15px -15px 15px -15px;
            border-radius: 6px 6px 0 0; 
            text-align: center; 
            font-weight: bold; 
            font-size: 16px;
        }
        .g4lkir95-section {
            margin-bottom: 15px; 
            padding: 10px; 
            background: #34495e; 
            border-radius: 5px;
        }
        .g4lkir95-section-title {
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #ecf0f1; 
            font-size: 14px;
        }
        .g4lkir95-button {
            width: 100%; 
            padding: 8px; 
            margin: 5px 0; 
            border: none; 
            border-radius: 4px;
            background: #e74c3c; 
            color: white; 
            font-weight: bold; 
            cursor: pointer; 
            font-size: 12px;
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
            top: 5px; 
            right: 10px; 
            background: none; 
            border: none;
            color: white; 
            font-size: 18px; 
            cursor: pointer; 
            font-weight: bold;
        }
        .g4lkir95-launch-btn {
            position: fixed; 
            top: 10px; 
            right: 10px; 
            padding: 8px 15px;
            background: #e74c3c; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer; 
            font-weight: bold; 
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
            font-size: 12px;
        }
        .g4lkir95-launch-btn:hover { 
            background: #c0392b; 
        }
        .g4lkir95-status {
            text-align: center; 
            padding: 5px; 
            margin: 5px 0; 
            border-radius: 3px; 
            font-size: 11px;
        }
        .g4lkir95-status-active { 
            background: #27ae60; 
        }
        .g4lkir95-status-inactive { 
            background: #7f8c8d; 
        }

        /* Стили для юнитов */
        .units-grid {
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 10px; 
            margin: 10px 0;
        }
        .unit-item {
            background: #2c3e50; 
            border: 1px solid #34495e; 
            border-radius: 5px; 
            padding: 10px;
            text-align: center;
        }
        .unit-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        .unit-checkbox {
            width: 16px;
            height: 16px;
        }
        .unit-img {
            background: #202225; 
            padding: 5px; 
            border-radius: 3px;
        }
        .unit-name {
            font-size: 11px; 
            color: #ecf0f1; 
            font-weight: bold;
        }
        .unit-controls {
            display: flex; 
            flex-direction: column; 
            gap: 5px;
        }
        .unit-backup {
            width: 80px; 
            font-size: 11px; 
            padding: 4px; 
            text-align: center;
            background: #2c3e50; 
            color: white; 
            border: 1px solid #7f8c8d; 
            border-radius: 3px;
            margin: 0 auto;
        }
        .backup-label {
            font-size: 10px; 
            color: #bdc3c7; 
            margin-bottom: 3px;
        }

        /* Стили для категорий */
        .categories-grid {
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 10px; 
            margin: 10px 0;
        }
        .category-item {
            background: #2c3e50; 
            border: 1px solid #34495e; 
            border-radius: 5px; 
            padding: 10px;
            text-align: center; 
            cursor: pointer;
        }
        .category-item.selected {
            background: #27ae60; 
            border-color: #219a52;
        }
        .category-name {
            font-size: 11px; 
            font-weight: bold; 
            margin-bottom: 5px;
        }

        /* Стили для уведомлений */
        .g4lkir95-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            max-width: 400px;
            text-align: center;
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
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            color: #bdc3c7;
            margin-top: 10px;
        }
        .debug-log-entry {
            margin-bottom: 3px;
            padding: 2px 5px;
            border-left: 3px solid #3498db;
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
            font-size: 9px;
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
        const topPosition = 20 + (existingNotifications.length * 70);
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
        
        for (let i = 1; i <= 4; i++) {
            const checkbox = document.getElementById('cat_' + i);
            if (checkbox) {
                categoryEnabled[i-1] = checkbox.checked;
            }
        }
        
        const priorityCheckbox = document.getElementById('priority_high');
        if (priorityCheckbox) {
            prioritiseHighCat = priorityCheckbox.checked;
        }
    }

    // ========== РЕАЛЬНАЯ ЛОГИКА MASS SCAVENGING ==========
    function readyToSend() {
        addDebugLog('Запуск реального массового сбора...', 'info');
        saveSettingsFromUI();
        
        if (!categoryEnabled.some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбрано ни одной категории сбора!', 'error');
            showNotification('Выберите хотя бы одну категории сбора!', 'error');
            return false;
        }

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

    function getVillageDataFromPage() {
        addDebugLog('Поиск данных о деревнях и местных войсках...', 'info');
        const villages = [];
        
        try {
            addDebugLog('=== ТОЧНЫЙ ПОИСК ИНТЕРФЕЙСА МАССОВОГО СБОРА ===', 'info');
            
            // Сначала ищем основной контейнер массового сбора
            const mainContainer = findMassScavengeContainer();
            if (!mainContainer) {
                addDebugLog('❌ Не найден контейнер массового сбора!', 'error');
                return villages;
            }
            
            addDebugLog('✅ Найден основной контейнер массового сбора', 'success');
            
            // Ищем реальные строки с деревнями для сбора
            const villageRows = findRealVillageRows(mainContainer);
            addDebugLog(`Найдено реальных строк с деревнями: ${villageRows.length}`, 'info');
            
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
            return villages;
        } catch (e) {
            addDebugLog(`Критическая ошибка получения данных: ${e.message}`, 'error');
            return [];
        }
    }

    // ========== ПОИСК ЭЛЕМЕНТОВ ИНТЕРФЕЙСА ==========
    function findMassScavengeContainer() {
        // Ищем контейнер массового сбора по специфичным признакам
        const possibleSelectors = [
            '#scavenge_mass_content',
            '.mass_scavenge_content',
            '[id*="scavenge"]',
            '[class*="scavenge"]',
            '.content-border',
            '#content-border'
        ];
        
        for (const selector of possibleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                addDebugLog(`Найден элемент через селектор: ${selector}`, 'success');
                return element;
            }
        }
        
        // Если не нашли по селекторам, ищем по содержимому
        addDebugLog('Поиск по содержимому...', 'info');
        const allDivs = document.querySelectorAll('div');
        
        for (let div of allDivs) {
            const text = div.textContent;
            if ((text.includes('сбор') && text.includes('ресурс')) || 
                (text.includes('scavenge') && text.includes('mass')) ||
                text.includes('Ленивые собиратели') ||
                text.includes('Быстрые собиратели')) {
                addDebugLog('Найден контейнер по содержимому', 'success');
                return div;
            }
        }
        
        return null;
    }

    function findRealVillageRows(container) {
        const rows = [];
        
        // Ищем строки, которые содержат реальные деревни для сбора (не меню)
        const potentialRows = container.querySelectorAll('tr, .village-row, [class*="village"], div');
        
        potentialRows.forEach(row => {
            // Пропускаем маленькие элементы
            if (row.textContent.length < 50) {
                return;
            }
            
            // Пропускаем элементы меню и навигации
            if (isNavigationOrMenu(row)) {
                return;
            }
            
            // Должна быть ссылка на деревню с координатами
            const villageLink = findVillageLinkWithCoords(row);
            if (!villageLink) {
                return;
            }
            
            // Должны быть элементы управления (кнопки отправки)
            const hasControls = hasScavengeControls(row);
            if (!hasControls) {
                return;
            }
            
            rows.push(row);
        });
        
        return rows;
    }

    function isNavigationOrMenu(element) {
        const text = element.textContent;
        const html = element.innerHTML;
        
        // Признаки навигации/меню
        if (text.includes('Приказы') || 
            text.includes('Войска') || 
            text.includes('Сбор ресурсов') ||
            text.includes('Массовый сбор ресурсов') ||
            text.includes('Симулятор') ||
            text.includes('Соседние деревни') ||
            text.includes('Шаблоны') ||
            text.includes('Массовое подкрепление')) {
            return true;
        }
        
        // Признаки ссылок меню
        const menuLinks = element.querySelectorAll('a[href*="mode="]');
        if (menuLinks.length > 2) {
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
        // Ищем кнопки отправки на сбор
        const buttons = row.querySelectorAll('button, input[type="submit"], .btn');
        const scavengeButtons = Array.from(buttons).filter(btn => {
            const text = btn.textContent;
            return text.includes('Отправить') || 
                   text.includes('Send') || 
                   text.includes('Сбор') ||
                   btn.getAttribute('onclick')?.includes('scavenge');
        });
        
        if (scavengeButtons.length > 0) {
            return true;
        }
        
        // Ищем выпадающие списки категорий
        const selects = row.querySelectorAll('select');
        if (selects.length > 0) {
            return true;
        }
        
        return false;
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

    function getAccurateLocalUnitsFromRow(row, villageName) {
        const units = {};
        
        try {
            // Инициализируем все юниты нулями
            worldUnits.forEach(unit => {
                units[unit.id] = 0;
            });
            
            addDebugLog(`Точный поиск войск для деревни: ${villageName}`, 'info');
            
            // Получаем весь текст строки для анализа
            const text = row.textContent;
            addDebugLog(`Текст строки: ${text.substring(0, 200)}...`, 'info');
            
            // Ищем реальное количество доступных войск
            let availableTroops = findRealAvailableTroops(row, text);
            
            // Если не нашли точное количество, используем альтернативные методы
            if (availableTroops === 0) {
                availableTroops = findTroopsByAlternativeMethods(row, text);
            }
            
            addDebugLog(`Определено доступных войск: ${availableTroops}`, 'success');
            
            // Распределяем войска пропорционально вместимости выбранных типов
            distributeTroopsToUnits(units, availableTroops);
            
            // Логируем результат
            Object.keys(units).forEach(unitType => {
                if (units[unitType] > 0) {
                    addDebugLog(`  ${getUnitName(unitType)}: ${units[unitType]}`, 'info');
                }
            });
            
        } catch (e) {
            addDebugLog(`Ошибка парсинга войск: ${e.message}`, 'error');
            // Устанавливаем значения по умолчанию при ошибке
            worldUnits.forEach(unit => {
                units[unit.id] = troopTypesEnabled[unit.id] ? 100 : 0;
            });
        }
        
        return units;
    }

    function findRealAvailableTroops(row, text) {
        let availableTroops = 0;
        
        // Паттерны для поиска количества войск в разных форматах
        const troopPatterns = [
            // Формат "доступно/всего" - берем первое число
            /(\d+)\s*\/\s*\d+/,
            // Формат "число доступно"
            /(\d+)\s+(?:доступно|available|в строю)/i,
            // Формат "Войска: число"
            /[Вв]ойска[:\s]*(\d+)/i,
            // Формат "Troops: число"  
            /[Tt]roops[:\s]*(\d+)/i,
            // Просто большие числа в контексте войск
            /(\d{3,})\s*(?:шт|units|войск)/i
        ];
        
        // Сначала ищем по паттернам
        for (const pattern of troopPatterns) {
            const match = text.match(pattern);
            if (match) {
                const foundTroops = parseInt(match[1]);
                if (foundTroops > 0) {
                    availableTroops = foundTroops;
                    addDebugLog(`Найдено войск по паттерну "${pattern}": ${availableTroops}`, 'success');
                    break;
                }
            }
        }
        
        // Если не нашли по паттернам, ищем таблицу с войсками
        if (availableTroops === 0) {
            availableTroops = findTroopsFromTable(row);
        }
        
        return availableTroops;
    }

    function findTroopsFromTable(row) {
        let availableTroops = 0;
        
        // Ищем таблицу с войсками внутри строки
        const troopTables = row.querySelectorAll('table');
        
        for (let table of troopTables) {
            const tableText = table.textContent;
            
            // Ищем числа в таблице, которые могут быть количеством войск
            const numbers = tableText.match(/\d+/g);
            if (numbers) {
                for (let num of numbers) {
                    const troopCount = parseInt(num);
                    // Предполагаем, что количество войск обычно в диапазоне 10-100000
                    if (troopCount >= 10 && troopCount <= 100000) {
                        availableTroops = troopCount;
                        addDebugLog(`Найдено войск из таблицы: ${availableTroops}`, 'success');
                        break;
                    }
                }
            }
            
            if (availableTroops > 0) break;
        }
        
        return availableTroops;
    }

    function findTroopsByAlternativeMethods(row, text) {
        let availableTroops = 0;
        
        // Метод 1: Ищем большие числа в тексте
        const numbers = text.match(/\d+/g);
        if (numbers) {
            // Сортируем числа по убыванию и берем самое большое разумное
            const largeNumbers = numbers.map(num => parseInt(num))
                .filter(num => num >= 50 && num <= 50000)
                .sort((a, b) => b - a);
                
            if (largeNumbers.length > 0) {
                availableTroops = largeNumbers[0];
                addDebugLog(`Найдено войск по большому числу: ${availableTroops}`, 'info');
            }
        }
        
        // Метод 2: Если все еще не нашли, используем эвристику
        if (availableTroops === 0) {
            // Для массового сбора обычно отправляют много войск
            availableTroops = 1000; // консервативное значение по умолчанию
            addDebugLog(`Используем войска по умолчанию: ${availableTroops}`, 'warning');
        }
        
        return availableTroops;
    }

    function distributeTroopsToUnits(units, availableTroops) {
        const enabledTroopTypes = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
        
        if (enabledTroopTypes.length === 0) {
            addDebugLog('❌ Нет выбранных типов войск для распределения!', 'error');
            return;
        }
        
        // Рассчитываем общую вместимость выбранных типов
        const totalCapacity = enabledTroopTypes.reduce((sum, unit) => sum + unit.capacity, 0);
        
        addDebugLog(`Распределение ${availableTroops} войск по ${enabledTroopTypes.length} типам`, 'info');
        
        // Распределяем пропорционально вместимости
        let remainingTroops = availableTroops;
        
        enabledTroopTypes.forEach((unit, index) => {
            if (remainingTroops <= 0) return;
            
            const share = unit.capacity / totalCapacity;
            let unitCount = Math.floor(availableTroops * share);
            
            // Гарантируем минимум 1 юнит каждого типа
            if (unitCount === 0 && remainingTroops > 0) {
                unitCount = 1;
            }
            
            // Не превышаем оставшиеся войска
            unitCount = Math.min(unitCount, remainingTroops);
            
            units[unit.id] = unitCount;
            remainingTroops -= unitCount;
            
            addDebugLog(`  ${unit.name}: ${unitCount} (вместимость: ${unit.capacity})`, 'info');
        });
        
        // Если остались нераспределенные войска, добавляем к первому типу
        if (remainingTroops > 0 && enabledTroopTypes.length > 0) {
            const firstUnit = enabledTroopTypes[0].id;
            units[firstUnit] += remainingTroops;
            addDebugLog(`  Добавлено ${remainingTroops} к ${getUnitName(firstUnit)}`, 'info');
        }
        
        // Рассчитываем итоговую грузоподъемность
        const finalCapacity = worldUnits.reduce((sum, unit) => {
            return sum + (units[unit.id] * unit.capacity);
        }, 0);
        
        addDebugLog(`Итоговая грузоподъемность: ${finalCapacity}`, 'success');
    }

    function getRealCategoryOptions(row) {
        const options = {};
        
        try {
            addDebugLog('Поиск элементов управления категориями...', 'info');
            
            const buttons = row.querySelectorAll('button, input[type="submit"], .btn');
            const selects = row.querySelectorAll('select');
            
            addDebugLog(`Найдено: кнопок=${buttons.length}, селектов=${selects.length}`, 'info');
            
            if (selects.length > 0) {
                // Используем выпадающий список
                const select = selects[0];
                for (let i = 1; i <= 4; i++) {
                    options[i] = {
                        is_locked: false,
                        scavenging_squad: null,
                        available: true,
                        name: categoryNames[i] || `Категория ${i}`
                    };
                }
                addDebugLog('Используем выпадающий список категорий', 'success');
            } else if (buttons.length >= 4) {
                // Используем отдельные кнопки для каждой категории
                for (let i = 1; i <= 4; i++) {
                    const button = buttons[i-1];
                    const isLocked = button.disabled || 
                                    button.classList.contains('disabled') ||
                                    button.textContent.includes('Locked') ||
                                    button.textContent.includes('Заблокировано');
                    
                    options[i] = {
                        is_locked: isLocked,
                        scavenging_squad: null,
                        available: !isLocked,
                        name: categoryNames[i] || `Категория ${i}`
                    };
                    
                    addDebugLog(`Категория ${i}: ${isLocked ? 'заблокирована' : 'доступна'}`, isLocked ? 'warning' : 'success');
                }
            } else {
                // Если не удалось определить, считаем все доступными
                for (let i = 1; i <= 4; i++) {
                    options[i] = {
                        is_locked: false,
                        scavenging_squad: null,
                        available: true,
                        name: categoryNames[i] || `Категория ${i}`
                    };
                }
                addDebugLog('Категории: все доступны (по умолчанию)', 'info');
            }
            
        } catch (e) {
            addDebugLog(`Ошибка определения категорий: ${e.message}`, 'error');
            for (let i = 1; i <= 4; i++) {
                options[i] = {
                    is_locked: false,
                    scavenging_squad: null,
                    available: true,
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

    function calculateScavengingSquads(villages) {
        addDebugLog(`Расчет отрядов для ${villages.length} деревень...`, 'info');
        const squads = [];
        
        villages.forEach(village => {
            const villageSquads = calculateSquadsForVillage(village);
            squads.push(...villageSquads);
        });
        
        addDebugLog(`Всего создано отрядов: ${squads.length}`, 'success');
        return squads;
    }

    function calculateSquadsForVillage(village) {
        const squads = [];
        const availableUnits = { ...village.units };
        
        addDebugLog(`=== Расчет для деревни: ${village.name} ===`, 'info');
        
        // Вычитаем backup из доступных войск
        worldUnits.forEach(unit => {
            const backup = keepHome[unit.id] || 0;
            availableUnits[unit.id] = Math.max(0, availableUnits[unit.id] - backup);
            if (backup > 0) {
                addDebugLog(`  Резерв для ${getUnitName(unit.id)}: ${backup}`, 'info');
            }
        });
        
        addDebugLog(`Войск после резерва:`, 'info');
        let totalAvailable = 0;
        Object.keys(availableUnits).forEach(unit => {
            if (availableUnits[unit] > 0) {
                addDebugLog(`  ${getUnitName(unit)}: ${availableUnits[unit]}`, 'info');
                totalAvailable += availableUnits[unit];
            }
        });
        
        if (totalAvailable === 0) {
            addDebugLog(`❌ В деревне "${village.name}" нет доступных войск после вычета резерва`, 'warning');
            return squads;
        }
        
        // Рассчитываем общую доступную грузоподъемность
        const totalAvailableCapacity = worldUnits.reduce((sum, unit) => {
            return sum + (availableUnits[unit.id] * unit.capacity);
        }, 0);
        
        addDebugLog(`Общая грузоподъемность: ${totalAvailableCapacity}`, 'success');
        
        // Пробуем отправить отряды по категориям в порядке приоритета
        const categoriesToTry = prioritiseHighCat ? [4, 3, 2, 1] : [1, 2, 3, 4];
        
        for (let cat of categoriesToTry) {
            if (categoryEnabled[cat-1] && village.options[cat] && 
                !village.options[cat].is_locked && village.options[cat].available) {
                
                const requiredCapacity = calculateRequiredCapacity(cat);
                
                addDebugLog(`Проверка категории ${village.options[cat].name}: требуется ${requiredCapacity}`, 'info');
                
                // Проверяем, достаточно ли грузоподъемности для этой категории
                if (totalAvailableCapacity >= requiredCapacity) {
                    const squad = calculateSquadForCategory(availableUnits, cat);
                    if (squad && hasUnits(squad)) {
                        squads.push({
                            village_id: village.id,
                            candidate_squad: squad,
                            option_id: cat,
                            use_premium: false,
                            village_name: village.name,
                            category_name: village.options[cat].name
                        });
                        
                        addDebugLog(`✅ Создан отряд для "${village.name}" -> ${village.options[cat].name}`, 'success');
                        
                        // Вычитаем использованные войска
                        subtractSquadFromAvailable(availableUnits, squad);
                        
                        // Пересчитываем оставшуюся грузоподъемность
                        const remainingCapacity = worldUnits.reduce((sum, unit) => {
                            return sum + (availableUnits[unit.id] * unit.capacity);
                        }, 0);
                        
                        addDebugLog(`Оставшаяся грузоподъемность: ${remainingCapacity}`, 'info');
                        
                        // Если осталось мало войск, прекращаем для этой деревни
                        if (remainingCapacity < calculateRequiredCapacity(1)) {
                            addDebugLog(`Оставшейся грузоподъемности недостаточно даже для минимальной категории`, 'info');
                            break;
                        }
                    } else {
                        addDebugLog(`❌ Не удалось создать отряд для "${village.name}" -> ${village.options[cat].name}`, 'warning');
                    }
                } else {
                    addDebugLog(`❌ Недостаточно грузоподъемности для "${village.name}" -> ${village.options[cat].name} (${totalAvailableCapacity}/${requiredCapacity})`, 'warning');
                }
            } else {
                const reason = !categoryEnabled[cat-1] ? 'отключена в настройках' : 
                             village.options[cat].is_locked ? 'заблокирована' : 'недоступна';
                addDebugLog(`Категория ${village.options[cat].name} для "${village.name}" пропущена: ${reason}`, 'warning');
            }
        }
        
        return squads;
    }

    function calculateSquadForCategory(availableUnits, category) {
        const squad = {};
        let totalCapacity = 0;
        
        const requiredCapacity = calculateRequiredCapacity(category);
        
        addDebugLog(`Расчет отряда для категории ${categoryNames[category]}: требуется ${requiredCapacity}`, 'info');
        
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0);
        if (enabledUnits.length === 0) {
            addDebugLog('❌ Нет доступных выбранных типов войск', 'error');
            return null;
        }
        
        // Сортируем юниты по эффективности (вместимость)
        const unitOrder = enabledUnits.sort((a, b) => b.capacity - a.capacity);
        
        addDebugLog(`Доступные типы войск: ${unitOrder.map(u => u.name).join(', ')}`, 'info');
        
        for (const unit of unitOrder) {
            if (availableUnits[unit.id] > 0 && totalCapacity < requiredCapacity) {
                const unitCapacity = unit.capacity;
                const maxUnits = availableUnits[unit.id];
                const neededCapacity = requiredCapacity - totalCapacity;
                const neededUnits = Math.min(maxUnits, Math.ceil(neededCapacity / unitCapacity));
                
                if (neededUnits > 0) {
                    squad[unit.id] = neededUnits;
                    totalCapacity += neededUnits * unitCapacity;
                    addDebugLog(`  Добавлено ${neededUnits} ${unit.name} (вместимость: ${unit.capacity})`, 'info');
                }
            }
        }
        
        const capacityStatus = totalCapacity >= requiredCapacity ? 'success' : 'warning';
        addDebugLog(`Итоговый отряд: грузоподъемность ${totalCapacity}/${requiredCapacity}`, capacityStatus);
        
        return totalCapacity >= requiredCapacity ? squad : null;
    }

    function calculateRequiredCapacity(category) {
        const baseCapacity = [1000, 2500, 5000, 10000][category-1] || 1000;
        const timeFactor = category <= 2 ? time.def : time.off;
        return baseCapacity * timeFactor;
    }

    function hasUnits(squad) {
        const has = squad && Object.values(squad).some(count => count > 0);
        return has;
    }

    function subtractSquadFromAvailable(availableUnits, squad) {
        Object.keys(squad).forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - squad[unit]);
        });
    }

    // ========== ОТПРАВКА ОТРЯДОВ ==========
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

        function sendNextSquad() {
            if (sentCount < totalSquads && isRunning) {
                const squad = squads[sentCount];
                const squadNumber = sentCount + 1;
                
                addDebugLog(`Отправка отряда ${squadNumber}/${totalSquads}: ${squad.village_name} -> ${squad.category_name}`, 'info');
                updateProgress(`📤 Отправка ${squadNumber}/${totalSquads}: ${squad.village_name}`);
                
                const villageRow = findRealVillageRow(squad.village_name);
                if (villageRow) {
                    const success = sendSquadToVillage(villageRow, squad);
                    if (success) {
                        sentCount++;
                        addDebugLog(`✅ Отряд ${squadNumber} отправлен успешно!`, 'success');
                        showNotification(`Отряд ${squadNumber}/${totalSquads} отправлен!`, 'success');
                        
                        setTimeout(sendNextSquad, 1500);
                    } else {
                        addDebugLog(`❌ Ошибка отправки отряда ${squadNumber}`, 'error');
                        sentCount++;
                        setTimeout(sendNextSquad, 1000);
                    }
                } else {
                    addDebugLog(`❌ Не найдена строка для деревни: ${squad.village_name}`, 'error');
                    sentCount++;
                    setTimeout(sendNextSquad, 500);
                }
            } else {
                if (sentCount >= totalSquads) {
                    addDebugLog(`🎉 Все отряды отправлены! Успешно: ${sentCount}/${totalSquads}`, 'success');
                    showNotification(`Все отряды отправлены! Успешно: ${sentCount}/${totalSquads}`, 'success');
                }
                completeRealScavenging();
            }
        }
        
        sendNextSquad();
    }

    function findRealVillageRow(villageName) {
        // Ищем элемент с названием деревни (с координатами)
        const elements = document.querySelectorAll('a[href*="village"]');
        for (let element of elements) {
            const text = element.textContent;
            if (text.includes(villageName) && (text.match(/[Kk]\d+/) || text.match(/\(\d+\|\d+\)/))) {
                // Возвращаем родительский контейнер
                const row = element.closest('tr, div, li, .village-item') || element.parentElement;
                if (hasScavengeControls(row)) {
                    return row;
                }
            }
        }
        return null;
    }

    function sendSquadToVillage(row, squad) {
        try {
            addDebugLog(`Отправка отряда в деревню ${squad.village_name}...`, 'info');
            
            const buttons = row.querySelectorAll('button, input[type="submit"], .btn');
            const selects = row.querySelectorAll('select');
            
            addDebugLog(`Найдено элементов: кнопок=${buttons.length}, селектов=${selects.length}`, 'info');
            
            if (selects.length > 0) {
                // Используем выпадающий список
                const select = selects[0];
                select.value = squad.option_id;
                addDebugLog(`Установлен выбор категории: ${squad.category_name}`, 'success');
                
                // Ищем кнопку отправки
                const sendButton = findSendButton(row);
                if (sendButton && !sendButton.disabled) {
                    addDebugLog('Найдена кнопка отправки, кликаем...', 'info');
                    sendButton.click();
                    return true;
                } else {
                    addDebugLog('Кнопка отправки не найдена или заблокирована', 'error');
                    return false;
                }
            } else if (buttons.length >= 4) {
                // Используем отдельные кнопки для каждой категории
                const buttonIndex = squad.option_id - 1;
                if (buttonIndex < buttons.length) {
                    const button = buttons[buttonIndex];
                    if (button && !button.disabled) {
                        addDebugLog(`Найдена кнопка для категории ${squad.category_name}, кликаем...`, 'info');
                        button.click();
                        return true;
                    } else {
                        addDebugLog(`Кнопка для категории ${squad.category_name} заблокирована`, 'error');
                        return false;
                    }
                } else {
                    addDebugLog(`Не найдена кнопка для категории ${squad.category_name}`, 'error');
                    return false;
                }
            } else {
                addDebugLog('Не найдены элементы управления для отправки', 'error');
                return false;
            }
        } catch (e) {
            addDebugLog(`Ошибка при отправке: ${e.message}`, 'error');
            return false;
        }
    }

    function findSendButton(row) {
        // Ищем кнопку отправки по тексту или классам
        const buttons = row.querySelectorAll('button, input[type="submit"], .btn');
        
        for (let button of buttons) {
            const text = button.textContent.toLowerCase();
            if (text.includes('отправить') || text.includes('send') || text.includes('сбор')) {
                return button;
            }
        }
        
        // Если не нашли по тексту, возвращаем первую доступную кнопку
        for (let button of buttons) {
            if (!button.disabled) {
                return button;
            }
        }
        
        return null;
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

    // ========== ИНТЕРФЕЙС И УПРАВЛЕНИЕ ==========
    function createSettingsInterface() {
        return `
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎯 Настройки войск</div>
                <div style="margin-bottom: 10px; font-size: 11px; color: #bdc3c7;">
                    Выберите типы войск для отправки
                </div>
                <div class="units-grid" id="unitsContainer"></div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Категории сбора</div>
                <div class="categories-grid">
                    <div class="category-item ${categoryEnabled[0] ? 'selected' : ''}" onclick="toggleCategory(1)">
                        <div class="category-name">${categoryNames[1]}</div>
                        <input type="checkbox" id="cat_1" ${categoryEnabled[0] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[1] ? 'selected' : ''}" onclick="toggleCategory(2)">
                        <div class="category-name">${categoryNames[2]}</div>
                        <input type="checkbox" id="cat_2" ${categoryEnabled[1] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[2] ? 'selected' : ''}" onclick="toggleCategory(3)">
                        <div class="category-name">${categoryNames[3]}</div>
                        <input type="checkbox" id="cat_3" ${categoryEnabled[2] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[3] ? 'selected' : ''}" onclick="toggleCategory(4)">
                        <div class="category-name">${categoryNames[4]}</div>
                        <input type="checkbox" id="cat_4" ${categoryEnabled[3] ? 'checked' : ''} style="display: none;">
                    </div>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⏰ Время возвращения</div>
                <div style="text-align: center; color: #bdc3c7; font-size: 12px;">
                    <div>⚔️ Атакующие деревни: <b>4 часа</b></div>
                    <div>🛡️ Защитные деревни: <b>12 часов</b></div>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⚖️ Настройка приоритета</div>
                <div style="margin: 10px 0;">
                    <input type="checkbox" id="priority_high" ${prioritiseHighCat ? 'checked' : ''}>
                    <label for="priority_high" style="color: white; margin-left: 5px;">
                        Приоритет высших категорий
                    </label>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">💾 Управление настройками</div>
                <button class="g4lkir95-button g4lkir95-button-success" onclick="window.g4lkir95SaveSettings()">
                    💾 Сохранить настройки
                </button>
                <button class="g4lkir95-button" onclick="window.g4lkir95ResetSettings()">
                    🔄 Сбросить настройки
                </button>
                <button class="g4lkir95-button" onclick="window.g4lkir95ClearLogs()">
                    🗑️ Очистить логи
                </button>
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
                <div class="unit-header">
                    <input type="checkbox" id="troop_${unit.id}" class="unit-checkbox" 
                           ${troopTypesEnabled[unit.id] ? 'checked' : ''}>
                    <div class="unit-img">
                        <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${unit.id}.png" 
                             title="${unit.name}" style="height:25px; width:25px;"
                             onerror="this.style.display='none'">
                    </div>
                    <div class="unit-name">${unit.name}</div>
                </div>
                <div class="unit-controls">
                    <div class="backup-label">Оставить в деревне:</div>
                    <input type="number" id="backup_${unit.id}" class="unit-backup" 
                           value="${keepHome[unit.id] || 0}" min="0" max="9999" 
                           placeholder="0" title="Оставить войск в деревне">
                </div>
            `;
            container.appendChild(unitItem);
        });
    }

    function toggleCategory(catNumber) {
        const checkbox = document.getElementById('cat_' + catNumber);
        const item = document.querySelector(`[onclick="toggleCategory(${catNumber})"]`);
        
        if (checkbox && item) {
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    }

    // ========== СИСТЕМА ПОВТОРНОГО ЗАПУСКА ==========
    function startMassScavenging(enableRepeat) {
        if (isRunning) {
            showNotification('Скрипт уже выполняется!', 'error');
            return;
        }

        isRunning = true;
        repeatEnabled = enableRepeat;
        currentRepeat = 0;

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

    // ========== ИНТЕРФЕЙС G4LKIR95 ==========
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

    function createInterface() {
        const existing = document.querySelector('.g4lkir95-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging v4.3</div>
            ${createSettingsInterface()}

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⚙️ Настройки повторного запуска</div>
                <div style="margin: 10px 0;">
                    <input type="checkbox" id="repeatEnabled" ${repeatEnabled ? 'checked' : ''}>
                    <label for="repeatEnabled" style="color: white; margin-left: 5px;">Включить повторный запуск</label>
                </div>
                <div style="margin: 10px 0;">
                    <label style="color: #bdc3c7; font-size: 12px;">Количество повторов:</label>
                    <input type="number" id="repeatCount" value="${repeatCount}" min="1" max="100" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                </div>
                <div style="margin: 10px 0;">
                    <label style="color: #bdc3c7; font-size: 12px;">Интервал (минуты):</label>
                    <input type="number" id="repeatInterval" value="${repeatInterval}" min="1" max="1440" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                </div>
                <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">Готов к работе</div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎮 Управление запуском</div>
                <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">▶️ Запустить РЕАЛЬНЫЙ сбор</button>
                <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">🔄 Запустить РЕАЛЬНЫЙ с повторами</button>
                <button class="g4lkir95-button" id="stopButton" style="display: none;">⏹️ Остановить</button>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7; margin-bottom: 10px;">Ожидание запуска...</div>
                <div class="g4lkir95-section-title">🔍 Детальные логи выполнения</div>
                <div class="debug-logs" id="debugLogs"></div>
            </div>
        `;

        document.body.appendChild(panel);
        createUnitsInterface();
        updateDebugLogsDisplay();

        // Обработчики событий
        const repeatEnabledEl = panel.querySelector('#repeatEnabled');
        const repeatCountEl = panel.querySelector('#repeatCount');
        const repeatIntervalEl = panel.querySelector('#repeatInterval');
        const startSingleEl = panel.querySelector('#startSingle');
        const startRepeatEl = panel.querySelector('#startRepeat');
        const stopButtonEl = panel.querySelector('#stopButton');

        if (repeatEnabledEl) {
            repeatEnabledEl.addEventListener('change', () => repeatEnabled = repeatEnabledEl.checked);
        }
        if (repeatCountEl) {
            repeatCountEl.addEventListener('change', () => repeatCount = parseInt(repeatCountEl.value) || 1);
        }
        if (repeatIntervalEl) {
            repeatIntervalEl.addEventListener('change', () => repeatInterval = parseInt(repeatIntervalEl.value) || 60);
        }
        if (startSingleEl) {
            startSingleEl.addEventListener('click', () => startMassScavenging(false));
        }
        if (startRepeatEl) {
            startRepeatEl.addEventListener('click', () => startMassScavenging(true));
        }
        if (stopButtonEl) {
            stopButtonEl.addEventListener('click', stopMassScavenging);
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

    // ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
    window.toggleCategory = toggleCategory;
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
        console.log('G4lKir95: Initializing v4.6 with complete functionality...');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        addDebugLog('G4lKir95 Mass Scavenging v4.6 активирован! Полный функционал.', 'success');
        showNotification('G4lKir95 Mass Scavenging v4.6 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();