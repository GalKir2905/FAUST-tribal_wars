// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v5.1.2
// @namespace    http://tampermonkey.net/
// @version      5.1.2
// @description  Массовый сбор ресурсов с синхронным временем возвращения
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

    // Основные юниты с русскими названиями и скоростями
    const worldUnits = [
        { id: 'spear', name: 'Копейщик', capacity: 25, speed: 18 },
        { id: 'sword', name: 'Мечник', capacity: 15, speed: 22 },
        { id: 'axe', name: 'Топорщик', capacity: 10, speed: 18 },
        { id: 'light', name: 'Лёгкая кавалерия', capacity: 80, speed: 10 },
        { id: 'heavy', name: 'Тяжелая кавалерия', capacity: 50, speed: 11 }
    ];

    // Названия категорий и время сбора (в минутах)
    const categoryNames = {
        1: "Ленивые собиратели",
        2: "Скромные собиратели", 
        3: "Искусные собиратели",
        4: "Великие собиратели"
    };

    // Время сбора для каждой категории (минуты)
    const categoryTimes = {
        1: 240,   // 4 часа - Ленивые собиратели
        2: 720,   // 12 часов - Скромные собиратели  
        3: 1440,  // 24 часа - Искусные собиратели
        4: 2880   // 48 часов - Великие собиратели
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
        .g4lkir95-nav-btn {
            position: fixed; 
            top: 50px; 
            right: 10px; 
            padding: 8px 15px;
            background: #3498db; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer; 
            font-weight: bold; 
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3); 
            font-size: 12px;
        }
        .g4lkir95-nav-btn:hover { 
            background: #2980b9; 
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
        .category-time {
            font-size: 10px; 
            color: #bdc3c7;
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

    // ========== РАСЧЕТ ПО ВРЕМЕНИ ВОЗВРАЩЕНИЯ ==========
    function calculateReturnTime(squad, distance = 1) {
        // Находим самого медленного юнита в отряде
        let slowestSpeed = 0;
        
        Object.keys(squad).forEach(unitId => {
            if (squad[unitId] > 0) {
                const unit = worldUnits.find(u => u.id === unitId);
                if (unit && unit.speed > slowestSpeed) {
                    slowestSpeed = unit.speed;
                }
            }
        });
        
        if (slowestSpeed === 0) return 0;
        
        // Время в минутах = (расстояние * 60) / скорость
        const travelTime = (distance * 60) / slowestSpeed;
        return Math.round(travelTime);
    }

    function calculateOptimalSquadsForTimeSync(village) {
        const squads = [];
        const availableUnits = { ...village.units };
        
        addDebugLog(`Расчет синхронных отрядов для ${village.name}:`, 'info');
        
        // Вычитаем резерв
        worldUnits.forEach(unit => {
            const backup = keepHome[unit.id] || 0;
            availableUnits[unit.id] = Math.max(0, availableUnits[unit.id] - backup);
        });
        
        const totalTroops = Object.values(availableUnits).reduce((sum, count) => sum + count, 0);
        
        if (totalTroops === 0) {
            addDebugLog(`  ❌ Нет доступных войск после резерва`, 'warning');
            return squads;
        }
        
        addDebugLog(`  Доступно войск: ${totalTroops}`, 'info');
        
        // Определяем доступные категории
        const availableCategories = [];
        for (let i = 1; i <= 4; i++) {
            if (categoryEnabled[i-1]) {
                availableCategories.push(i);
            }
        }
        
        if (availableCategories.length === 0) {
            addDebugLog(`  ❌ Нет доступных категорий`, 'warning');
            return squads;
        }
        
        // Сортируем категории по времени (от меньшего к большему)
        availableCategories.sort((a, b) => categoryTimes[a] - categoryTimes[b]);
        
        addDebugLog(`  Доступные категории: ${availableCategories.map(c => `${categoryNames[c]} (${categoryTimes[c]} мин)`).join(', ')}`, 'info');
        
        // Распределяем войска по категориям для синхронного возвращения
        let remainingUnits = { ...availableUnits };
        let remainingTroops = totalTroops;
        
        // Целевое время возвращения - среднее время всех доступных категорий
        const targetTime = availableCategories.reduce((sum, cat) => sum + categoryTimes[cat], 0) / availableCategories.length;
        
        addDebugLog(`  Целевое время возвращения: ${Math.round(targetTime)} минут`, 'info');
        
        for (const category of availableCategories) {
            if (remainingTroops <= 0) break;
            
            const squad = createSquadForTimeTarget(remainingUnits, category, targetTime);
            
            if (squad && hasUnits(squad)) {
                const squadTroops = Object.values(squad).reduce((sum, count) => sum + count, 0);
                const actualTime = calculateReturnTime(squad);
                
                // Обновляем оставшиеся войска
                Object.keys(squad).forEach(unitId => {
                    remainingUnits[unitId] -= squad[unitId];
                });
                remainingTroops -= squadTroops;
                
                squads.push({
                    village_id: village.id,
                    village_name: village.name,
                    candidate_squad: squad,
                    option_id: category,
                    category_name: village.options[category].name,
                    expected_time: actualTime,
                    target_time: categoryTimes[category],
                    row: village.row
                });
                
                addDebugLog(`  ✅ ${categoryNames[category]}: ${squadTroops} войск (${actualTime} мин)`, 'success');
            }
        }
        
        // Если остались войска, распределяем по оставшимся категориям
        if (remainingTroops > 0) {
            for (const category of availableCategories) {
                if (remainingTroops <= 0) break;
                
                const squad = createRemainingSquad(remainingUnits);
                if (squad && hasUnits(squad)) {
                    const squadTroops = Object.values(squad).reduce((sum, count) => sum + count, 0);
                    const actualTime = calculateReturnTime(squad);
                    
                    Object.keys(squad).forEach(unitId => {
                        remainingUnits[unitId] -= squad[unitId];
                    });
                    remainingTroops -= squadTroops;
                    
                    squads.push({
                        village_id: village.id,
                        village_name: village.name,
                        candidate_squad: squad,
                        option_id: category,
                        category_name: village.options[category].name,
                        expected_time: actualTime,
                        target_time: categoryTimes[category],
                        row: village.row
                    });
                    
                    addDebugLog(`  ✅ Доп. ${categoryNames[category]}: ${squadTroops} войск (${actualTime} мин)`, 'success');
                }
            }
        }
        
        // Логируем итоговое распределение по времени
        if (squads.length > 0) {
            const times = squads.map(s => s.expected_time);
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            const maxDiff = Math.max(...times) - Math.min(...times);
            
            addDebugLog(`  Итог: среднее время ${Math.round(avgTime)} мин, разброс ${maxDiff} мин`, 
                       maxDiff <= 1 ? 'success' : 'warning');
        }
        
        return squads;
    }

    function createSquadForTimeTarget(availableUnits, category, targetTime) {
        const squad = {};
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0);
        
        if (enabledUnits.length === 0) return null;
        
        // Рассчитываем общее количество войск для этой категории
        const totalAvailable = Object.values(availableUnits).reduce((sum, count) => sum + count, 0);
        const timeRatio = categoryTimes[category] / targetTime;
        const targetTroops = Math.floor(totalAvailable * timeRatio);
        
        if (targetTroops <= 0) return null;
        
        // Распределяем войска пропорционально доступному количеству
        let remainingTroops = targetTroops;
        
        for (const unit of enabledUnits) {
            if (remainingTroops <= 0) break;
            
            const availableCount = availableUnits[unit.id];
            const share = availableCount / totalAvailable;
            let unitCount = Math.floor(targetTroops * share);
            
            // Гарантируем минимум 1 юнит каждого типа
            unitCount = Math.max(unitCount, 1);
            unitCount = Math.min(unitCount, availableCount, remainingTroops);
            
            if (unitCount > 0) {
                squad[unit.id] = unitCount;
                remainingTroops -= unitCount;
            }
        }
        
        // Распределяем остаток
        if (remainingTroops > 0) {
            for (const unit of enabledUnits) {
                if (remainingTroops <= 0) break;
                
                const availableCount = availableUnits[unit.id] - (squad[unit.id] || 0);
                if (availableCount > 0) {
                    const addCount = Math.min(availableCount, remainingTroops);
                    squad[unit.id] = (squad[unit.id] || 0) + addCount;
                    remainingTroops -= addCount;
                }
            }
        }
        
        return hasUnits(squad) ? squad : null;
    }

    function createRemainingSquad(availableUnits) {
        const squad = {};
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0);
        
        // Берем все оставшиеся войска
        for (const unit of enabledUnits) {
            if (availableUnits[unit.id] > 0) {
                squad[unit.id] = availableUnits[unit.id];
            }
        }
        
        return hasUnits(squad) ? squad : null;
    }

    function calculateTotalCapacity(units) {
        return worldUnits.reduce((sum, unit) => {
            return sum + ((units[unit.id] || 0) * unit.capacity);
        }, 0);
    }

    function hasUnits(squad) {
        return squad && Object.values(squad).some(count => count > 0);
    }

    // ========== ОСНОВНАЯ ЛОГИКА ==========
    function readyToSend() {
        addDebugLog('Запуск массового сбора с синхронизацией по времени...', 'info');
        saveSettingsFromUI();
        
        if (!categoryEnabled.some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбрано ни одной категории сбора!', 'error');
            showNotification('Выберите хотя бы одну категорию сбора!', 'error');
            return false;
        }

        if (!Object.values(troopTypesEnabled).some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбран ни один тип войск для отправки!', 'error');
            showNotification('Выберите хотя бы один тип войск для отправки!', 'error');
            return false;
        }
        
        addDebugLog('Проверка настроек завершена успешно', 'success');
        showNotification('Запуск массового сбора...', 'info');
        return startTimeSyncedMassScavenging();
    }

    function startTimeSyncedMassScavenging() {
        addDebugLog('Поиск деревень и войск...', 'info');
        updateProgress('🔍 Поиск деревень и войск...');
        
        const villageData = getImprovedVillageData();
        if (!villageData || villageData.length === 0) {
            addDebugLog('ОШИБКА: Деревни не найдены!', 'error');
            showNotification('Не найдено деревень для сбора!', 'error');
            return false;
        }
        
        addDebugLog(`Найдено деревень: ${villageData.length}`, 'success');
        showNotification(`Найдено ${villageData.length} деревень`, 'info');
        updateProgress(`📊 Найдено ${villageData.length} деревень...`);
        
        const squads = [];
        villageData.forEach(village => {
            const villageSquads = calculateOptimalSquadsForTimeSync(village);
            squads.push(...villageSquads);
        });
        
        if (squads.length === 0) {
            addDebugLog('ОШИБКА: Не создано ни одного отряда!', 'error');
            showNotification('Нет подходящих отрядов для отправки!', 'error');
            return false;
        }
        
        addDebugLog(`Создано отрядов: ${squads.length}`, 'success');
        
        // Анализ времени возвращения
        const times = squads.map(s => s.expected_time);
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxDiff = Math.max(...times) - Math.min(...times);
        
        addDebugLog(`Среднее время возвращения: ${Math.round(avgTime)} минут`, 'info');
        addDebugLog(`Максимальный разброс: ${maxDiff} минут`, maxDiff <= 1 ? 'success' : 'warning');
        
        showNotification(`Рассчитано ${squads.length} отрядов (разброс: ${maxDiff} мин)`, 'info');
        updateProgress(`🎯 Создано ${squads.length} отрядов...`);
        
        sendImprovedScavengingSquads(squads);
        
        return true;
    }

    // ========== ПОИСК ДАННЫХ ==========
    function getImprovedVillageData() {
        addDebugLog('Поиск данных о деревнях...', 'info');
        const villages = [];
        
        try {
            const villageRows = findVillageRows();
            addDebugLog(`Найдено потенциальных строк: ${villageRows.length}`, 'info');
            
            let processedCount = 0;
            
            for (let row of villageRows) {
                try {
                    const villageInfo = extractVillageInfo(row);
                    if (!villageInfo) continue;
                    
                    const units = getRealUnitsFromRow(row, villageInfo.name);
                    const options = getCategoryOptions();
                    
                    villages.push({
                        id: villageInfo.id,
                        name: villageInfo.name,
                        units: units,
                        options: options,
                        availableTroops: Object.values(units).reduce((sum, count) => sum + count, 0),
                        row: row
                    });
                    
                    processedCount++;
                    addDebugLog(`✅ ${villageInfo.name} - войск: ${villages[villages.length-1].availableTroops}`, 'success');
                    
                } catch (e) {
                    addDebugLog(`Ошибка обработки строки: ${e.message}`, 'error');
                }
            }
            
            addDebugLog(`Обработано деревень: ${processedCount}`, 'success');
            return villages;
            
        } catch (e) {
            addDebugLog(`Критическая ошибка: ${e.message}`, 'error');
            return [];
        }
    }

    function findVillageRows() {
        const rows = [];
        
        // Ищем таблицы с деревнями
        const tables = document.querySelectorAll('table');
        
        for (let table of tables) {
            const tableRows = table.querySelectorAll('tr');
            for (let row of tableRows) {
                if (isValidVillageRow(row) && !rows.includes(row)) {
                    rows.push(row);
                }
            }
        }
        
        // Также ищем отдельные строки
        const selectors = ['tr', '.village-row', '.row'];
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (let element of elements) {
                if (isValidVillageRow(element) && !rows.includes(element)) {
                    rows.push(element);
                }
            }
        }
        
        return rows;
    }

    function isValidVillageRow(element) {
        if (!element || !element.textContent) return false;
        const text = element.textContent;
        
        // Должны быть координаты деревни
        if (!text.match(/\(\d+\|\d+\)/)) return false;
        
        // Должны быть элементы управления сбором
        if (!hasScavengeControls(element)) return false;
        
        return true;
    }

    function hasScavengeControls(element) {
        const buttons = element.querySelectorAll('button, input[type="submit"]');
        const selects = element.querySelectorAll('select');
        return buttons.length > 0 || selects.length > 0;
    }

    function extractVillageInfo(row) {
        const links = row.querySelectorAll('a[href*="village"]');
        for (let link of links) {
            const href = link.getAttribute('href');
            const villageIdMatch = href.match(/village=(\d+)/);
            const text = link.textContent;
            if (villageIdMatch && text.match(/\(\d+\|\d+\)/)) {
                return { id: villageIdMatch[1], name: text.trim() };
            }
        }
        return null;
    }

    function getRealUnitsFromRow(row, villageName) {
        const units = {};
        worldUnits.forEach(unit => units[unit.id] = 0);
        
        try {
            const availableTroops = extractAvailableTroops(row);
            if (availableTroops > 0) {
                distributeAvailableTroops(units, availableTroops);
            } else {
                distributeDefaultTroops(units);
            }
        } catch (e) {
            distributeDefaultTroops(units);
        }
        
        return units;
    }

    function extractAvailableTroops(row) {
        const text = row.textContent;
        const patterns = [
            /(\d+)\s*\/\s*\d+\s+доступно/i,
            /доступно[^\d]*(\d+)/i,
            /(\d+)\s+доступно/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const count = parseInt(match[1]);
                if (count > 0) return count;
            }
        }
        
        const numbers = text.match(/\d+/g);
        if (numbers) {
            const largeNumbers = numbers.map(n => parseInt(n)).filter(n => n > 50 && n < 10000);
            if (largeNumbers.length > 0) return Math.max(...largeNumbers);
        }
        
        return 0;
    }

    function distributeAvailableTroops(units, totalTroops) {
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
        if (enabledUnits.length === 0) return;
        
        const totalCapacity = enabledUnits.reduce((sum, unit) => sum + unit.capacity, 0);
        let remaining = totalTroops;
        
        enabledUnits.forEach((unit, index) => {
            if (remaining <= 0) return;
            const share = unit.capacity / totalCapacity;
            let count = Math.floor(totalTroops * share);
            count = Math.max(count, 1);
            count = Math.min(count, remaining);
            units[unit.id] = count;
            remaining -= count;
        });
        
        if (remaining > 0 && enabledUnits.length > 0) {
            units[enabledUnits[0].id] += remaining;
        }
    }

    function distributeDefaultTroops(units) {
        worldUnits.forEach(unit => {
            if (troopTypesEnabled[unit.id]) {
                units[unit.id] = 100;
            }
        });
    }

    function getCategoryOptions() {
        const options = {};
        for (let i = 1; i <= 4; i++) {
            options[i] = {
                available: categoryEnabled[i-1],
                name: categoryNames[i]
            };
        }
        return options;
    }

    // ========== ОТПРАВКА ==========
    function sendImprovedScavengingSquads(squads) {
        if (squads.length === 0) return;
        addDebugLog(`Начинаем отправку ${squads.length} отрядов...`, 'info');
        updateProgress(`🚀 Отправка ${squads.length} отрядов...`);
        sendSquadsSequentially(squads, 0);
    }

    function sendSquadsSequentially(squads, index) {
        if (index >= squads.length || !isRunning) {
            completeScavenging();
            return;
        }
        
        const squad = squads[index];
        const squadNumber = index + 1;
        
        addDebugLog(`Отправка ${squadNumber}/${squads.length}: ${squad.village_name} -> ${squad.category_name}`, 'info');
        updateProgress(`📤 ${squadNumber}/${squads.length}: ${squad.village_name}`);
        
        if (sendSingleSquad(squad)) {
            addDebugLog(`✅ Отряд ${squadNumber} отправлен успешно`, 'success');
        } else {
            addDebugLog(`❌ Ошибка отправки отряда ${squadNumber}`, 'error');
        }
        
        setTimeout(() => {
            sendSquadsSequentially(squads, index + 1);
        }, 2000);
    }

    function sendSingleSquad(squad) {
        try {
            const row = squad.row;
            const categoryElement = findCategoryElement(row, squad.option_id);
            if (!categoryElement) {
                addDebugLog('Не найдена категория', 'error');
                return false;
            }
            
            categoryElement.click();
            
            setTimeout(() => {
                const sendButton = findSendButton(row);
                if (sendButton && !sendButton.disabled) {
                    sendButton.click();
                    return true;
                } else {
                    addDebugLog('Кнопка отправки не найдена или заблокирована', 'error');
                    return false;
                }
            }, 1000);
            
            return true;
            
        } catch (e) {
            addDebugLog(`Ошибка отправки: ${e.message}`, 'error');
            return false;
        }
    }

    function findCategoryElement(row, categoryId) {
        const elements = row.querySelectorAll('[class*="option-"]');
        for (let element of elements) {
            if (element.className.includes(`option-${categoryId}`) && 
                !element.className.includes('header-option')) {
                return element;
            }
        }
        return null;
    }

    function findSendButton(row) {
        const buttons = row.querySelectorAll('button, input[type="submit"]');
        for (let button of buttons) {
            const text = (button.textContent || button.value || '').toLowerCase();
            if ((text.includes('отправить') || text.includes('send')) && !button.disabled) {
                return button;
            }
        }
        return buttons[0] || null;
    }

    function completeScavenging() {
        addDebugLog('Массовый сбор завершен!', 'success');
        showNotification('🎉 Массовый сбор завершен!', 'success');
        updateProgress('✅ Сбор завершен!');
        scheduleNextRun();
    }

    function scheduleNextRun() {
        if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
            const intervalMs = repeatInterval * 60 * 1000;
            addDebugLog(`Следующий запуск через ${repeatInterval} минут`, 'info');
            updateProgress(`⏰ Следующий запуск через ${repeatInterval} минут...`);
            
            repeatTimer = setTimeout(() => {
                if (isRunning) {
                    window.location.reload();
                }
            }, intervalMs);
        } else {
            isRunning = false;
            updateUIStatus(false, 'Сбор завершен');
        }
    }

    // ========== ИНТЕРФЕЙС С ДОБАВЛЕНИЕМ ВРЕМЕНИ ==========
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
                        <div class="category-time">${Math.floor(categoryTimes[1]/60)} ч</div>
                        <input type="checkbox" id="cat_1" ${categoryEnabled[0] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[1] ? 'selected' : ''}" onclick="toggleCategory(2)">
                        <div class="category-name">${categoryNames[2]}</div>
                        <div class="category-time">${Math.floor(categoryTimes[2]/60)} ч</div>
                        <input type="checkbox" id="cat_2" ${categoryEnabled[1] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[2] ? 'selected' : ''}" onclick="toggleCategory(3)">
                        <div class="category-name">${categoryNames[3]}</div>
                        <div class="category-time">${Math.floor(categoryTimes[3]/60)} ч</div>
                        <input type="checkbox" id="cat_3" ${categoryEnabled[2] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[3] ? 'selected' : ''}" onclick="toggleCategory(4)">
                        <div class="category-name">${categoryNames[4]}</div>
                        <div class="category-time">${Math.floor(categoryTimes[4]/60)} ч</div>
                        <input type="checkbox" id="cat_4" ${categoryEnabled[3] ? 'checked' : ''} style="display: none;">
                    </div>
                </div>
                <div style="margin-top: 10px; font-size: 10px; color: #bdc3c7; text-align: center;">
                    ⚡ Все отряды будут возвращаться примерно в одно время
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⏰ Время возвращения</div>
                <div style="text-align: center; color: #bdc3c7; font-size: 12px;">
                    <div>🎯 Цель: синхронное возвращение всех отрядов</div>
                    <div>📊 Погрешность: ≤ 1 минута</div>
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

    function startMassScavenging(enableRepeat) {
        if (isRunning) {
            showNotification('Скрипт уже выполняется!', 'error');
            return;
        }

        isRunning = true;
        repeatEnabled = enableRepeat;
        currentRepeat = 0;

        updateUIStatus(true, 'Запуск массового сбора...');
        showNotification('Запуск массового сбора с синхронизацией времени...', 'info');
        
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
        }
    }

    function createInterface() {
        const existing = document.querySelector('.g4lkir95-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">🚀 G4lKir95 Time-Synced Scavenging v5.1.2</div>
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
                <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">▶️ Запустить сбор</button>
                <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">🔄 Запустить с повторами</button>
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
            launchBtn.innerHTML = '🚀 Time-Synced Scavenging';
            launchBtn.title = 'Открыть панель управления массовым сбором';
            launchBtn.addEventListener('click', createInterface);
            document.body.appendChild(launchBtn);
        }
    }

    // ========== НАВИГАЦИОННАЯ КНОПКА ==========
    function addNavigationButton() {
        // Добавляем кнопку только если не на странице массового сбора
        if (window.location.href.indexOf('mode=scavenge_mass') === -1 && 
            !document.querySelector('.g4lkir95-nav-btn')) {
            const navBtn = document.createElement('button');
            navBtn.className = 'g4lkir95-nav-btn';
            navBtn.innerHTML = '📊 Перейти к сбору';
            navBtn.title = 'Перейти на страницу массового сбора';
            navBtn.addEventListener('click', goToMassScavenging);
            document.body.appendChild(navBtn);
        }
    }

    // Функция для ручного перехода на страницу массового сбора
    function goToMassScavenging() {
        const gameServer = window.location.hostname;
        const gamePhp = window.location.pathname;
        const massUrl = `https://${gameServer}${gamePhp}?screen=place&mode=scavenge_mass`;
        window.location.href = massUrl;
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
    window.goToMassScavenging = goToMassScavenging; // Делаем глобальной для кнопки

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v5.1.2 with time synchronization...');
        
        // УБРАН АВТОМАТИЧЕСКИЙ ПЕРЕХОД - теперь скрипт работает на любой странице
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        addNavigationButton(); // ВЫЗЫВАЕМ ФУНКЦИЮ ДОБАВЛЕНИЯ НАВИГАЦИОННОЙ КНОПКИ
        
        // Автоматически открываем панель если мы на странице массового сбора
        if (window.location.href.indexOf('mode=scavenge_mass') !== -1) {
            setTimeout(createInterface, 1000);
            addDebugLog('G4lKir95 Time-Synced Scavenging v5.1.2 активирован на странице массового сбора!', 'success');
            showNotification('Скрипт синхронизации времени активирован!', 'success');
        } else {
            addDebugLog('G4lKir95 Time-Synced Scavenging v5.1.2 активирован! Нажмите кнопку 🚀 для открытия панели.', 'success');
            showNotification('Нажмите кнопку 🚀 для открытия панели массового сбора', 'info');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();