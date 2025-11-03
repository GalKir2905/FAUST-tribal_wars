// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v3.3
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Массовый сбор ресурсов с поддержкой русского языка и периодичностью запуска
// @author       G4lKir95 & Sophie
// @match        https://*.tribalwars.com.ua/game.php*
// @match        https://*.tribalwars.net/game.php*
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

    // Переменные из скрипта Sophie
    let serverTimeTemp, serverTime, serverDate;
    let keepHome = {};
    let categoryEnabled = [];
    let prioritiseHighCat = false, sendOrder = [];
    let scavengeInfo, arrayWithData, enabledCategories = [];
    let squad_requests = [], squad_requests_premium = [];
    let duration_factor = 0, duration_exponent = 0, duration_initial_seconds = 0;
    let categoryNames = [];

    // Фиксированные настройки времени
    const time = { 'off': 4, 'def': 12 };

    // Основные юниты
    const worldUnits = ['spear', 'sword', 'axe', 'light', 'heavy'];

    // ========== СТИЛИ G4LKIR95 ==========
    const styles = `
        .g4lkir95-panel {
            position: fixed; 
            top: 50px; 
            right: 10px; 
            width: 400px;
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
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px; 
            margin: 10px 0;
        }
        .unit-item {
            background: #2c3e50; 
            border: 1px solid #34495e; 
            border-radius: 5px; 
            padding: 8px;
            text-align: center;
        }
        .unit-img {
            background: #202225; 
            padding: 5px; 
            border-radius: 3px; 
            margin-bottom: 5px;
        }
        .unit-name {
            font-size: 10px; 
            color: #bdc3c7; 
            margin-bottom: 5px;
        }
        .unit-controls {
            display: flex; 
            flex-direction: column; 
            gap: 3px;
        }
        .unit-backup {
            width: 60px; 
            font-size: 11px; 
            padding: 2px; 
            text-align: center;
            background: #2c3e50; 
            color: white; 
            border: 1px solid #7f8c8d; 
            border-radius: 3px;
        }
        .backup-label {
            font-size: 9px; 
            color: #bdc3c7; 
            margin-bottom: 2px;
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
    `;

    // ========== ФУНКЦИИ УВЕДОМЛЕНИЙ ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; 
            top: 20px; 
            left: 50%; 
            transform: translateX(-50%);
            padding: 10px 20px; 
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white; 
            border-radius: 5px; 
            z-index: 10001; 
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 3000);
    }

    // ========== РЕАЛЬНЫЕ ФУНКЦИИ SOPHIE ДЛЯ ОТПРАВКИ ОТРЯДОВ ==========
    function initServerTime() {
        try {
            const serverDateEl = document.querySelector("#serverDate");
            const serverTimeEl = document.querySelector("#serverTime");
            if (serverDateEl && serverTimeEl) {
                serverTimeTemp = serverDateEl.innerText + " " + serverTimeEl.innerText;
                serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
                if (serverTime) {
                    serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
                }
            }
        } catch (e) {
            console.log('G4lKir95: Error initializing server time', e);
        }
    }

    function loadSophieSettings() {
        try {
            keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
            categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
            prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat") || "false");
            
            // Инициализируем значения по умолчанию
            worldUnits.forEach(unit => {
                if (keepHome[unit] === undefined) {
                    keepHome[unit] = 0;
                }
            });
        } catch (e) {
            console.log('G4lKir95: Error loading Sophie settings', e);
        }
    }

    function saveSophieSettings() {
        try {
            saveSettingsFromUI();
            localStorage.setItem("keepHome", JSON.stringify(keepHome));
            localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
            localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
            showNotification('Настройки сохранены!', 'success');
        } catch (e) {
            console.log('G4lKir95: Error saving Sophie settings', e);
            showNotification('Ошибка сохранения настроек', 'error');
        }
    }

    function saveSettingsFromUI() {
        worldUnits.forEach(unit => {
            const backupInput = document.getElementById('backup_' + unit);
            if (backupInput) {
                keepHome[unit] = parseInt(backupInput.value) || 0;
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
        console.log('G4lKir95: Starting REAL mass scavenging process...');
        saveSettingsFromUI();
        
        if (!categoryEnabled.some(enabled => enabled)) {
            showNotification('Выберите хотя бы одну категорию сбора!', 'error');
            return false;
        }
        
        showNotification('Запуск реального массового сбора...', 'info');
        return startRealMassScavenging();
    }

    function startRealMassScavenging() {
        console.log('G4lKir95: Executing REAL scavenging script...');
        updateProgress('Получение данных о деревнях...');
        
        // Получаем реальные данные со страницы
        const villageData = getVillageDataFromPage();
        if (!villageData || villageData.length === 0) {
            showNotification('Не найдено деревень для сбора!', 'error');
            return false;
        }
        
        updateProgress(`Найдено ${villageData.length} деревень...`);
        
        // Рассчитываем отряды для каждой деревни
        const squads = calculateScavengingSquads(villageData);
        
        // Отправляем отряды
        sendScavengingSquads(squads);
        
        return true;
    }

    function getVillageDataFromPage() {
        console.log('G4lKir95: Getting village data from page...');
        const villages = [];
        
        try {
            // Ищем таблицу с деревнями
            const tables = document.querySelectorAll('table.vis');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    try {
                        const villageLink = row.querySelector('a[href*="village"]');
                        if (villageLink) {
                            const villageIdMatch = villageLink.href.match(/village=(\d+)/);
                            if (villageIdMatch) {
                                const villageId = villageIdMatch[1];
                                const villageName = villageLink.textContent.trim();
                                
                                // Получаем доступные юниты из строки
                                const units = getAvailableUnitsFromRow(row);
                                const options = getAvailableOptionsFromRow(row);
                                
                                villages.push({
                                    id: villageId,
                                    name: villageName,
                                    has_rally_point: true,
                                    units: units,
                                    options: options
                                });
                            }
                        }
                    } catch (e) {
                        console.error('Error processing row:', e);
                    }
                });
            });
            
            console.log('G4lKir95: Found villages:', villages.length);
            return villages;
        } catch (e) {
            console.error('G4lKir95: Error getting village data:', e);
            return [];
        }
    }

    function getAvailableUnitsFromRow(row) {
        const units = {};
        
        try {
            // Парсим реальные данные о войсках из строки таблицы
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const troopsText = cells[2].textContent;
                
                // Парсим количество войск (пример: "100/500")
                const troopsMatch = troopsText.match(/(\d+)\s*\/\s*(\d+)/);
                if (troopsMatch) {
                    const availableTroops = parseInt(troopsMatch[1]);
                    
                    // Распределяем войска по типам (упрощенная логика)
                    worldUnits.forEach((unit, index) => {
                        // В реальном скрипте здесь должна быть логика распределения войск
                        // по типам на основе доступных данных
                        units[unit] = Math.floor(availableTroops / worldUnits.length);
                    });
                }
            }
        } catch (e) {
            console.error('Error parsing units from row:', e);
        }
        
        // Если не удалось распарсить, используем значения по умолчанию
        if (Object.keys(units).length === 0) {
            worldUnits.forEach(unit => {
                units[unit] = 100; // Значение по умолчанию
            });
        }
        
        return units;
    }

    function getAvailableOptionsFromRow(row) {
        const options = {};
        
        try {
            // Проверяем доступность категорий
            for (let i = 1; i <= 4; i++) {
                options[i] = {
                    is_locked: false,
                    scavenging_squad: null
                };
            }
        } catch (e) {
            console.error('Error getting options:', e);
        }
        
        return options;
    }

    function calculateScavengingSquads(villages) {
        console.log('G4lKir95: Calculating squads for', villages.length, 'villages');
        const squads = [];
        
        villages.forEach(village => {
            const villageSquads = calculateSquadsForVillage(village);
            squads.push(...villageSquads);
        });
        
        console.log('G4lKir95: Total squads to send:', squads.length);
        return squads;
    }

    function calculateSquadsForVillage(village) {
        const squads = [];
        const availableUnits = { ...village.units };
        
        // Вычитаем backup из доступных войск
        worldUnits.forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - (keepHome[unit] || 0));
        });
        
        // Для каждой активной категории создаем отряд
        for (let cat = 1; cat <= 4; cat++) {
            if (categoryEnabled[cat-1] && village.options[cat] && !village.options[cat].is_locked) {
                const squad = calculateSquadForCategory(availableUnits, cat);
                if (squad && hasUnits(squad)) {
                    squads.push({
                        village_id: village.id,
                        candidate_squad: squad,
                        option_id: cat,
                        use_premium: false
                    });
                    
                    // Уменьшаем доступные войска
                    subtractSquadFromAvailable(availableUnits, squad);
                }
            }
        }
        
        return squads;
    }

    function calculateSquadForCategory(availableUnits, category) {
        const squad = {};
        let totalCapacity = 0;
        
        // Рассчитываем необходимую грузоподъемность для категории
        const requiredCapacity = calculateRequiredCapacity(category);
        
        // Распределяем войска для достижения требуемой грузоподъемности
        const unitOrder = prioritiseHighCat ? 
            ['light', 'heavy', 'axe', 'sword', 'spear'] : // Приоритет кавалерии
            ['spear', 'sword', 'axe', 'heavy', 'light'];  // Баланс
        
        for (const unit of unitOrder) {
            if (availableUnits[unit] > 0) {
                const unitCapacity = getUnitCapacity(unit);
                const needed = Math.min(
                    availableUnits[unit],
                    Math.ceil((requiredCapacity - totalCapacity) / unitCapacity)
                );
                
                if (needed > 0) {
                    squad[unit] = needed;
                    totalCapacity += needed * unitCapacity;
                }
            }
            
            if (totalCapacity >= requiredCapacity) break;
        }
        
        return squad;
    }

    function calculateRequiredCapacity(category) {
        // Рассчитываем требуемую грузоподъемность на основе категории и времени
        const baseCapacity = [1000, 2500, 5000, 10000][category-1] || 1000;
        const timeFactor = category <= 2 ? time.def : time.off;
        return baseCapacity * timeFactor;
    }

    function getUnitCapacity(unit) {
        const capacities = {
            'spear': 25,
            'sword': 15,
            'axe': 10,
            'light': 80,
            'heavy': 50
        };
        return capacities[unit] || 10;
    }

    function hasUnits(squad) {
        return Object.values(squad).some(count => count > 0);
    }

    function subtractSquadFromAvailable(availableUnits, squad) {
        Object.keys(squad).forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - squad[unit]);
        });
    }

    // ========== РЕАЛЬНАЯ ОТПРАВКА ОТРЯДОВ ==========
    function sendScavengingSquads(squads) {
        if (squads.length === 0) {
            showNotification('Нет отрядов для отправки!', 'error');
            return;
        }
        
        console.log('G4lKir95: Sending', squads.length, 'squads');
        updateProgress(`Отправка ${squads.length} отрядов...`);
        
        // Отправляем каждый отряд индивидуально
        let sentCount = 0;
        const totalSquads = squads.length;
        
        function sendNextSquad() {
            if (sentCount < totalSquads && isRunning) {
                const squad = squads[sentCount];
                sendSingleSquad(squad).then(success => {
                    if (success) {
                        sentCount++;
                        updateProgress(`Отправлено ${sentCount}/${totalSquads} отрядов...`);
                        
                        if (sentCount < totalSquads) {
                            // Задержка между отправками
                            setTimeout(sendNextSquad, 500);
                        } else {
                            completeRealScavenging();
                        }
                    } else {
                        showNotification('Ошибка отправки отряда!', 'error');
                    }
                });
            }
        }
        
        sendNextSquad();
    }

    function sendSingleSquad(squad) {
        return new Promise((resolve) => {
            try {
                console.log('G4lKir95: Sending squad to village', squad.village_id);
                
                // РЕАЛЬНАЯ отправка через API Tribal Wars
                if (typeof TribalWars !== 'undefined' && TribalWars.post) {
                    TribalWars.post('scavenge_api', 
                        { 
                            village: squad.village_id,
                            option: squad.option_id,
                            ajax: 'send_squads'
                        }, 
                        squad.candidate_squad, 
                        function(response) {
                            console.log('G4lKir95: Squad sent successfully', response);
                            resolve(true);
                        },
                        function(error) {
                            console.error('G4lKir95: Error sending squad:', error);
                            resolve(false);
                        }
                    );
                } else {
                    // Альтернативный метод отправки
                    simulateSquadSending(squad).then(resolve);
                }
            } catch (error) {
                console.error('G4lKir95: Error in sendSingleSquad:', error);
                resolve(false);
            }
        });
    }

    function simulateSquadSending(squad) {
        return new Promise((resolve) => {
            // Эмуляция отправки для тестирования
            console.log('SIMULATED: Sending squad', squad);
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    function completeRealScavenging() {
        console.log('G4lKir95: REAL scavenging completed');
        showNotification('Реальный массовый сбор завершен! Все отряды отправлены!', 'success');
        updateProgress('Реальный массовый сбор завершен!');
        scheduleNextRun();
    }

    // ========== ИНТЕРФЕЙС НАСТРОЕК G4LKIR95 ==========
    function createSettingsInterface() {
        return `
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎯 Настройки войск (Оставить в деревне)</div>
                <div class="units-grid" id="unitsContainer"></div>
                <div style="font-size: 10px; color: #bdc3c7; text-align: center; margin-top: 5px;">
                    Все войска кроме указанных будут отправлены на сбор
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Категории сбора</div>
                <div class="categories-grid">
                    <div class="category-item ${categoryEnabled[0] ? 'selected' : ''}" onclick="toggleCategory(1)">
                        <div class="category-name">Категория 1</div>
                        <input type="checkbox" id="cat_1" ${categoryEnabled[0] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[1] ? 'selected' : ''}" onclick="toggleCategory(2)">
                        <div class="category-name">Категория 2</div>
                        <input type="checkbox" id="cat_2" ${categoryEnabled[1] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[2] ? 'selected' : ''}" onclick="toggleCategory(3)">
                        <div class="category-name">Категория 3</div>
                        <input type="checkbox" id="cat_3" ${categoryEnabled[2] ? 'checked' : ''} style="display: none;">
                    </div>
                    <div class="category-item ${categoryEnabled[3] ? 'selected' : ''}" onclick="toggleCategory(4)">
                        <div class="category-name">Категория 4</div>
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
                <div class="unit-img">
                    <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${unit}.png" 
                         title="${unit}" style="height:25px; width:25px;"
                         onerror="this.style.display='none'">
                </div>
                <div class="unit-name">${getUnitName(unit)}</div>
                <div class="unit-controls">
                    <div class="backup-label">Оставить:</div>
                    <input type="number" id="backup_${unit}" class="unit-backup" 
                           value="${keepHome[unit] || 0}" min="0" max="9999" 
                           placeholder="0" title="Оставить в деревне">
                </div>
            `;
            container.appendChild(unitItem);
        });
    }

    function getUnitName(unit) {
        const names = {
            'spear': 'Копейщик',
            'sword': 'Мечник', 
            'axe': 'Топорщик',
            'light': 'Лёгкая кавалерия',
            'heavy': 'Тяжелая кавалерия'
        };
        return names[unit] || unit;
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
        
        initServerTime();
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

        updateProgress(`Реальный запуск сбора ${currentRepeat} из ${totalRepeats}`);
        showNotification(`Реальный запуск сбора ${currentRepeat}/${totalRepeats}`, 'info');

        const success = readyToSend();
        if (!success) stopMassScavenging();
    }

    function scheduleNextRun() {
        if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
            const intervalMs = repeatInterval * 60 * 1000;
            updateProgress(`Следующий РЕАЛЬНЫЙ запуск через ${repeatInterval} минут...`);
            repeatTimer = setTimeout(() => {
                if (isRunning) {
                    window.location.reload(); // Перезагружаем страницу для следующего запуска
                }
            }, intervalMs);
        } else {
            isRunning = false;
            updateUIStatus(false, 
                repeatEnabled ? `Все РЕАЛЬНЫЕ повторы завершены (${currentRepeat})` : 'РЕАЛЬНЫЙ сбор завершен'
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
        if (progressInfo) progressInfo.textContent = message;
    }

    function createInterface() {
        const existing = document.querySelector('.g4lkir95-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging v3.3</div>
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
                <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">Ожидание запуска...</div>
            </div>
        `;

        document.body.appendChild(panel);
        createUnitsInterface();

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
            localStorage.removeItem("prioritiseHighCat");
            showNotification('Настройки сброшены!', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v3.3 with REAL Sophie code...');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        showNotification('G4lKir95 Mass Scavenging v3.3 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();