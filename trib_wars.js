// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v4.7
// @namespace    http://tampermonkey.net/
// @version      4.7
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
        2: "Быстрые собиратели", 
        3: "Находчивые собиратели",
        4: "Жадные собиратели"
    };

    // Базовые грузоподъемности для категорий
    const baseCapacities = {
        1: 1000,  // Ленивые собиратели
        2: 2500,  // Быстрые собиратели
        3: 5000,  // Находчивые собиратели
        4: 10000  // Жадные собиратели
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

    // ========== ОСНОВНАЯ ЛОГИКА РАСПРЕДЕЛЕНИЯ ==========
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
        const totalAvailableCapacity = calculateTotalCapacity(availableUnits);
        addDebugLog(`Общая грузоподъемность: ${totalAvailableCapacity}`, 'success');
        
        // Определяем доступные категории
        const availableCategories = getAvailableCategories(village, totalAvailableCapacity);
        
        if (availableCategories.length === 0) {
            addDebugLog(`❌ Нет доступных категорий для деревни "${village.name}"`, 'warning');
            return squads;
        }
        
        // Для каждой доступной категории создаем отряд
        for (let cat of availableCategories) {
            const squad = createBalancedSquad(availableUnits, cat);
            if (squad && hasUnits(squad)) {
                squads.push({
                    village_id: village.id,
                    candidate_squad: squad,
                    option_id: cat,
                    use_premium: false,
                    village_name: village.name,
                    category_name: categoryNames[cat]
                });
                
                addDebugLog(`✅ Создан отряд для "${village.name}" -> ${categoryNames[cat]}`, 'success');
                
                // Вычитаем использованные войска
                subtractSquadFromAvailable(availableUnits, squad);
                
                // Пересчитываем оставшуюся грузоподъемность
                const remainingCapacity = calculateTotalCapacity(availableUnits);
                addDebugLog(`Оставшаяся грузоподъемность: ${remainingCapacity}`, 'info');
                
                // Если осталось мало войск, прекращаем для этой деревни
                if (remainingCapacity < baseCapacities[1]) {
                    addDebugLog(`Оставшейся грузоподъемности недостаточно даже для минимальной категории`, 'info');
                    break;
                }
            }
        }
        
        return squads;
    }

    function getAvailableCategories(village, totalCapacity) {
        const categories = [];
        const categoryOrder = prioritiseHighCat ? [4, 3, 2, 1] : [1, 2, 3, 4];
        
        for (let cat of categoryOrder) {
            if (categoryEnabled[cat-1] && 
                village.options[cat] && 
                !village.options[cat].is_locked && 
                village.options[cat].available &&
                totalCapacity >= baseCapacities[cat]) {
                categories.push(cat);
                addDebugLog(`✅ Категория ${categoryNames[cat]} доступна (требуется: ${baseCapacities[cat]})`, 'success');
            } else {
                const reason = !categoryEnabled[cat-1] ? 'отключена в настройках' : 
                             !village.options[cat] ? 'недоступна' :
                             village.options[cat].is_locked ? 'заблокирована' :
                             totalCapacity < baseCapacities[cat] ? `недостаточно грузоподъемности (${totalCapacity}/${baseCapacities[cat]})` : 'недоступна';
                addDebugLog(`❌ Категория ${categoryNames[cat]} пропущена: ${reason}`, 'warning');
            }
        }
        
        return categories;
    }

    function createBalancedSquad(availableUnits, category) {
        const requiredCapacity = baseCapacities[category];
        addDebugLog(`Создание сбалансированного отряда для ${categoryNames[category]}: требуется ${requiredCapacity}`, 'info');
        
        const enabledUnits = worldUnits.filter(unit => 
            troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0
        );
        
        if (enabledUnits.length === 0) {
            addDebugLog('❌ Нет доступных выбранных типов войск', 'error');
            return null;
        }
        
        // Сортируем юниты по скорости (быстрые сначала для равномерного возвращения)
        const sortedUnits = enabledUnits.sort((a, b) => a.speed - b.speed);
        addDebugLog(`Доступные типы войск (по скорости): ${sortedUnits.map(u => `${u.name}(${u.speed})`).join(', ')}`, 'info');
        
        const squad = {};
        let totalCapacity = 0;
        let remainingCapacity = requiredCapacity;
        
        // Распределяем войска равномерно по типам
        const unitsPerType = Math.max(1, Math.floor(remainingCapacity / sortedUnits.length / 10));
        
        for (const unit of sortedUnits) {
            if (availableUnits[unit.id] > 0 && totalCapacity < requiredCapacity) {
                // Рассчитываем максимальное количество этого типа, которое можно отправить
                const maxPossibleByCapacity = Math.floor(remainingCapacity / unit.capacity);
                const maxAvailable = availableUnits[unit.id];
                
                // Берем минимум из: доступного количества, необходимого по грузоподъемности и базового распределения
                let unitCount = Math.min(
                    maxAvailable,
                    maxPossibleByCapacity,
                    unitsPerType
                );
                
                // Гарантируем хотя бы 1 юнит если есть возможность
                if (unitCount === 0 && maxAvailable > 0 && remainingCapacity >= unit.capacity) {
                    unitCount = 1;
                }
                
                if (unitCount > 0) {
                    squad[unit.id] = unitCount;
                    totalCapacity += unitCount * unit.capacity;
                    remainingCapacity = requiredCapacity - totalCapacity;
                    
                    addDebugLog(`  ${unit.name}: ${unitCount} (емкость: ${unitCount * unit.capacity})`, 'info');
                }
            }
        }
        
        // Если после первого прохода осталась грузоподъемность, заполняем оставшееся
        if (remainingCapacity > 0) {
            for (const unit of sortedUnits) {
                if (availableUnits[unit.id] > squad[unit.id] && totalCapacity < requiredCapacity) {
                    const additionalNeeded = Math.ceil(remainingCapacity / unit.capacity);
                    const maxAdditional = availableUnits[unit.id] - (squad[unit.id] || 0);
                    const addCount = Math.min(additionalNeeded, maxAdditional);
                    
                    if (addCount > 0) {
                        squad[unit.id] = (squad[unit.id] || 0) + addCount;
                        totalCapacity += addCount * unit.capacity;
                        remainingCapacity = requiredCapacity - totalCapacity;
                        
                        addDebugLog(`  Добавлено ${addCount} ${unit.name}`, 'info');
                    }
                }
                
                if (remainingCapacity <= 0) break;
            }
        }
        
        const capacityStatus = totalCapacity >= requiredCapacity ? 'success' : 'warning';
        addDebugLog(`Итоговый отряд: грузоподъемность ${totalCapacity}/${requiredCapacity}`, capacityStatus);
        
        // Логируем состав отряда
        if (hasUnits(squad)) {
            addDebugLog(`Состав отряда:`, 'info');
            Object.keys(squad).forEach(unitId => {
                const unit = worldUnits.find(u => u.id === unitId);
                addDebugLog(`  ${unit.name}: ${squad[unitId]} (емкость: ${squad[unitId] * unit.capacity})`, 'info');
            });
        }
        
        return totalCapacity >= requiredCapacity ? squad : null;
    }

    function calculateTotalCapacity(units) {
        return worldUnits.reduce((sum, unit) => {
            return sum + ((units[unit.id] || 0) * unit.capacity);
        }, 0);
    }

    function hasUnits(squad) {
        return squad && Object.values(squad).some(count => count > 0);
    }

    function subtractSquadFromAvailable(availableUnits, squad) {
        Object.keys(squad).forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - squad[unit]);
        });
    }

    function getUnitName(unitId) {
        const unit = worldUnits.find(u => u.id === unitId);
        return unit ? unit.name : unitId;
    }

    // ========== ПОИСК ИНТЕРФЕЙСА И ДАННЫХ ==========
    // ... (функции поиска интерфейса остаются такими же как в v4.6)

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

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v4.7 with balanced troop distribution...');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        addDebugLog('G4lKir95 Mass Scavenging v4.7 активирован! Сбалансированное распределение.', 'success');
        showNotification('G4lKir95 Mass Scavenging v4.7 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();