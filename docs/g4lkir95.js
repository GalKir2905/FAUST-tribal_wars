// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v3.7
// @namespace    http://tampermonkey.net/
// @version      3.7
// @description  Массовый сбор ресурсов с выбором типов войск и реальной отправкой
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
    let notificationQueue = [];

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

    // ========== СТИЛИ G4LKIR95 ==========
    const styles = `
        .g4lkir95-panel {
            position: fixed; 
            top: 50px; 
            right: 10px; 
            width: 420px;
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
            console.log('G4lKir95: Error loading Sophie settings', e);
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
            console.log('G4lKir95: Error saving Sophie settings', e);
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
        console.log('G4lKir95: Starting REAL mass scavenging process...');
        saveSettingsFromUI();
        
        if (!categoryEnabled.some(enabled => enabled)) {
            showNotification('Выберите хотя бы одну категорию сбора!', 'error');
            return false;
        }

        if (!Object.values(troopTypesEnabled).some(enabled => enabled)) {
            showNotification('Выберите хотя бы один тип войск для отправки!', 'error');
            return false;
        }
        
        showNotification('Запуск реального массового сбора...', 'info');
        return startRealMassScavenging();
    }

    function startRealMassScavenging() {
        console.log('G4lKir95: Executing REAL scavenging script...');
        updateProgress('Получение данных о деревнях...');
        
        const villageData = getVillageDataFromPage();
        if (!villageData || villageData.length === 0) {
            showNotification('Не найдено деревень для сбора! Проверьте, что вы на странице массового сбора.', 'error');
            return false;
        }
        
        showNotification(`Найдено ${villageData.length} деревень для обработки`, 'info');
        updateProgress(`Найдено ${villageData.length} деревень...`);
        
        const squads = calculateScavengingSquads(villageData);
        
        if (squads.length === 0) {
            showNotification('Нет подходящих отрядов для отправки! Проверьте настройки войск.', 'error');
            return false;
        }
        
        showNotification(`Рассчитано ${squads.length} отрядов для отправки`, 'info');
        
        sendScavengingSquads(squads);
        
        return true;
    }

    function getVillageDataFromPage() {
        console.log('G4lKir95: Getting village data from page...');
        const villages = [];
        
        try {
            let tables = document.querySelectorAll('table.vis');
            if (tables.length === 0) {
                tables = document.querySelectorAll('table');
            }
            
            console.log('G4lKir95: Found tables:', tables.length);
            
            tables.forEach((table, tableIndex) => {
                const rows = table.querySelectorAll('tr');
                console.log(`G4lKir95: Table ${tableIndex} has ${rows.length} rows`);
                
                rows.forEach((row, rowIndex) => {
                    try {
                        if (rowIndex === 0) return;
                        
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 3) return;
                        
                        let villageLink = cells[0].querySelector('a');
                        if (!villageLink) villageLink = cells[1].querySelector('a');
                        if (!villageLink) return;
                        
                        const villageHref = villageLink.getAttribute('href');
                        if (!villageHref) return;
                        
                        const villageIdMatch = villageHref.match(/village=(\d+)/);
                        if (!villageIdMatch) return;
                        
                        const villageId = villageIdMatch[1];
                        const villageName = villageLink.textContent.trim();
                        
                        let troopsText = '';
                        if (cells[2]) troopsText = cells[2].textContent;
                        if (!troopsText && cells[3]) troopsText = cells[3].textContent;
                        
                        const troopsMatch = troopsText.match(/(\d+)\s*\/\s*(\d+)/);
                        const availableTroops = troopsMatch ? parseInt(troopsMatch[1]) : 100;
                        
                        const units = {};
                        const enabledTroopTypes = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
                        
                        if (enabledTroopTypes.length > 0) {
                            const troopsPerType = Math.max(1, Math.floor(availableTroops / enabledTroopTypes.length));
                            
                            worldUnits.forEach(unit => {
                                if (troopTypesEnabled[unit.id]) {
                                    units[unit.id] = troopsPerType;
                                } else {
                                    units[unit.id] = 0;
                                }
                            });
                        } else {
                            worldUnits.forEach(unit => {
                                units[unit.id] = Math.floor(availableTroops / worldUnits.length);
                            });
                        }
                        
                        const options = getRealCategoryOptions(row);
                        
                        villages.push({
                            id: villageId,
                            name: villageName,
                            has_rally_point: true,
                            units: units,
                            options: options,
                            availableTroops: availableTroops,
                            row: row
                        });
                        
                        console.log(`G4lKir95: Added village ${villageName} (${villageId}) with ${availableTroops} troops`, options);
                        
                    } catch (e) {
                        console.error('Error processing row:', e);
                    }
                });
            });
            
            console.log('G4lKir95: Total villages found:', villages.length);
            return villages;
        } catch (e) {
            console.error('G4lKir95: Error getting village data:', e);
            return [];
        }
    }

    function getRealCategoryOptions(row) {
        const options = {};
        
        try {
            const buttons = row.querySelectorAll('button, input[type="submit"], input[type="button"]');
            const selects = row.querySelectorAll('select');
            
            console.log('G4lKir95: Found buttons:', buttons.length, 'selects:', selects.length);
            
            if (selects.length > 0) {
                const select = selects[0];
                const optionElements = select.querySelectorAll('option');
                
                for (let i = 1; i <= 4; i++) {
                    options[i] = {
                        is_locked: false,
                        scavenging_squad: null,
                        available: true
                    };
                }
            } else if (buttons.length >= 4) {
                for (let i = 1; i <= 4; i++) {
                    const button = buttons[i-1];
                    const isLocked = button.disabled || button.style.display === 'none' || 
                                    button.classList.contains('disabled') ||
                                    button.textContent.includes('Locked') ||
                                    button.textContent.includes('Заблокировано');
                    
                    options[i] = {
                        is_locked: isLocked,
                        scavenging_squad: null,
                        available: !isLocked
                    };
                    
                    console.log(`G4lKir95: Category ${i} - locked: ${isLocked}`);
                }
            } else {
                for (let i = 1; i <= 4; i++) {
                    options[i] = {
                        is_locked: false,
                        scavenging_squad: null,
                        available: true
                    };
                }
            }
            
        } catch (e) {
            console.error('G4lKir95: Error getting category options:', e);
            for (let i = 1; i <= 4; i++) {
                options[i] = {
                    is_locked: false,
                    scavenging_squad: null,
                    available: true
                };
            }
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
        
        worldUnits.forEach(unit => {
            availableUnits[unit.id] = Math.max(0, availableUnits[unit.id] - (keepHome[unit.id] || 0));
        });
        
        console.log(`G4lKir95: Village ${village.name} - available units after backup:`, availableUnits);
        
        for (let cat = 1; cat <= 4; cat++) {
            if (categoryEnabled[cat-1] && village.options[cat] && 
                !village.options[cat].is_locked && village.options[cat].available) {
                
                const squad = calculateSquadForCategory(availableUnits, cat);
                if (squad && hasUnits(squad)) {
                    squads.push({
                        village_id: village.id,
                        candidate_squad: squad,
                        option_id: cat,
                        use_premium: false,
                        village_name: village.name
                    });
                    
                    console.log(`G4lKir95: Created squad for village ${village.name}, category ${cat}:`, squad);
                    
                    subtractSquadFromAvailable(availableUnits, squad);
                } else {
                    console.log(`G4lKir95: No squad created for village ${village.name}, category ${cat} - no units available`);
                }
            } else {
                console.log(`G4lKir95: Category ${cat} skipped for village ${village.name} - enabled: ${categoryEnabled[cat-1]}, locked: ${village.options[cat]?.is_locked}, available: ${village.options[cat]?.available}`);
            }
        }
        
        return squads;
    }

    function calculateSquadForCategory(availableUnits, category) {
        const squad = {};
        let totalCapacity = 0;
        
        const requiredCapacity = calculateRequiredCapacity(category);
        
        console.log(`G4lKir95: Category ${category} - required capacity: ${requiredCapacity}`);
        
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
        const unitOrder = prioritiseHighCat ? 
            enabledUnits.sort((a, b) => b.capacity - a.capacity) :
            enabledUnits.sort((a, b) => a.capacity - b.capacity);
        
        for (const unit of unitOrder) {
            if (availableUnits[unit.id] > 0) {
                const unitCapacity = unit.capacity;
                const maxUnits = availableUnits[unit.id];
                const neededCapacity = requiredCapacity - totalCapacity;
                const neededUnits = Math.min(maxUnits, Math.ceil(neededCapacity / unitCapacity));
                
                if (neededUnits > 0) {
                    squad[unit.id] = neededUnits;
                    totalCapacity += neededUnits * unitCapacity;
                    console.log(`G4lKir95: Added ${neededUnits} ${unit.id} (capacity: ${unitCapacity}), total: ${totalCapacity}`);
                }
            }
            
            if (totalCapacity >= requiredCapacity) break;
        }
        
        console.log(`G4lKir95: Final squad for category ${category}:`, squad, `total capacity: ${totalCapacity}`);
        return squad;
    }

    function calculateRequiredCapacity(category) {
        const baseCapacity = [1000, 2500, 5000, 10000][category-1] || 1000;
        const timeFactor = category <= 2 ? time.def : time.off;
        return baseCapacity * timeFactor;
    }

    function hasUnits(squad) {
        const has = Object.values(squad).some(count => count > 0);
        console.log('G4lKir95: Squad has units:', has, squad);
        return has;
    }

    function subtractSquadFromAvailable(availableUnits, squad) {
        Object.keys(squad).forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - squad[unit]);
        });
        console.log('G4lKir95: Available units after subtraction:', availableUnits);
    }

    // ========== РЕАЛЬНАЯ ОТПРАВКА ОТРЯДОВ ИЗ SOPHIE ==========
    function sendScavengingSquads(squads) {
        if (squads.length === 0) {
            showNotification('Нет отрядов для отправки!', 'error');
            return;
        }
        
        console.log('G4lKir95: Sending', squads.length, 'squads');
        updateProgress(`Отправка ${squads.length} отрядов...`);
        
        // Группируем отряды по 50 (как в Sophie)
        const groups = [];
        for (let i = 0; i < squads.length; i += 50) {
            groups.push(squads.slice(i, i + 50));
        }
        
        let currentGroup = 0;
        
        function sendNextGroup() {
            if (currentGroup < groups.length && isRunning) {
                const group = groups[currentGroup];
                showNotification(`Отправка группы ${currentGroup + 1}/${groups.length}...`, 'info');
                
                sendSquadGroupSophie(group).then(success => {
                    if (success) {
                        currentGroup++;
                        updateProgress(`Отправлено групп: ${currentGroup}/${groups.length}`);
                        
                        if (currentGroup < groups.length) {
                            setTimeout(sendNextGroup, 2000);
                        } else {
                            completeRealScavenging();
                        }
                    } else {
                        showNotification(`Ошибка отправки группы ${currentGroup + 1}. Пропускаем...`, 'error');
                        currentGroup++;
                        if (currentGroup < groups.length) {
                            setTimeout(sendNextGroup, 1000);
                        } else {
                            completeRealScavenging();
                        }
                    }
                });
            }
        }
        
        sendNextGroup();
    }

    function sendSquadGroupSophie(squads) {
        return new Promise((resolve) => {
            try {
                console.log('G4lKir95: Sending squad group (Sophie method):', squads.length, 'squads');
                
                // Подготавливаем данные как в оригинальном Sophie
                const squadRequests = squads.map(squad => {
                    return {
                        village_id: squad.village_id,
                        candidate_squad: squad.candidate_squad,
                        option_id: squad.option_id,
                        use_premium: squad.use_premium
                    };
                });

                // Создаем данные для отправки как в Sophie
                const postData = {
                    squad_requests: squadRequests,
                    ajaxaction: 'send_squads'
                };

                console.log('G4lKir95: Sending POST data:', postData);

                // Отправляем как в оригинальном Sophie скрипте
                if (typeof TribalWars !== 'undefined' && TribalWars.post) {
                    // Используем встроенный метод TribalWars если доступен
                    TribalWars.post('/game.php?screen=scavenge_api', postData, {
                        onSuccess: function(data) {
                            console.log('G4lKir95: Sophie method success:', data);
                            if (data && data.success !== false) {
                                showNotification(`Группа из ${squads.length} отрядов отправлена!`, 'success');
                                resolve(true);
                            } else {
                                console.error('G4lKir95: Sophie method error in response:', data);
                                resolve(false);
                            }
                        },
                        onFailure: function(error) {
                            console.error('G4lKir95: Sophie method failure:', error);
                            resolve(false);
                        }
                    });
                } else {
                    // Альтернативный метод через fetch
                    sendSquadGroupFetch(squads).then(resolve);
                }
                
            } catch (error) {
                console.error('G4lKir95: Error in sendSquadGroupSophie:', error);
                resolve(false);
            }
        });
    }

    function sendSquadGroupFetch(squads) {
        return new Promise((resolve) => {
            try {
                const squadRequests = squads.map(squad => {
                    return {
                        village_id: squad.village_id,
                        candidate_squad: squad.candidate_squad,
                        option_id: squad.option_id,
                        use_premium: squad.use_premium
                    };
                });

                const formData = new FormData();
                formData.append('squad_requests', JSON.stringify(squadRequests));
                formData.append('ajaxaction', 'send_squads');
                formData.append('mode', 'scavenge');
                formData.append('screen', 'place');

                console.log('G4lKir95: Sending fetch request with squads:', squadRequests);

                fetch('/game.php?screen=scavenge_api', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    console.log('G4lKir95: Fetch response:', data);
                    if (data && data.success) {
                        showNotification(`Группа из ${squads.length} отрядов отправлена!`, 'success');
                        resolve(true);
                    } else {
                        console.error('G4lKir95: Fetch error response:', data);
                        resolve(false);
                    }
                })
                .catch(error => {
                    console.error('G4lKir95: Fetch error:', error);
                    resolve(false);
                });
                
            } catch (error) {
                console.error('G4lKir95: Error in sendSquadGroupFetch:', error);
                resolve(false);
            }
        });
    }

    // Альтернативный метод - отправка через клики по кнопкам (как в оригинальном Sophie)
    function sendScavengingSquadsAlternative(squads) {
        console.log('G4lKir95: Using alternative sending method (button clicks)');
        
        let sentCount = 0;
        const totalSquads = squads.length;

        function sendNextSquadAlternative() {
            if (sentCount < totalSquads && isRunning) {
                const squad = squads[sentCount];
                
                // Находим кнопку для этой деревни и категории
                const villageRow = squad.village_row;
                if (villageRow) {
                    const buttons = villageRow.querySelectorAll('button, input[type="submit"], input[type="button"]');
                    const selects = villageRow.querySelectorAll('select');
                    
                    if (selects.length > 0) {
                        // Новый интерфейс с выпадающими списками
                        const select = selects[0];
                        select.value = squad.option_id;
                        
                        // Находим кнопку отправки
                        const sendButton = villageRow.querySelector('input[type="submit"], button');
                        if (sendButton && !sendButton.disabled) {
                            sendButton.click();
                            sentCount++;
                            showNotification(`Отряд ${sentCount}/${totalSquads} отправлен!`, 'success');
                            setTimeout(sendNextSquadAlternative, 1000);
                        } else {
                            console.error('G4lKir95: Send button not found or disabled');
                            sentCount++;
                            setTimeout(sendNextSquadAlternative, 500);
                        }
                    } else if (buttons.length >= 4) {
                        // Старый интерфейс с кнопками
                        const button = buttons[squad.option_id - 1];
                        if (button && !button.disabled) {
                            button.click();
                            sentCount++;
                            showNotification(`Отряд ${sentCount}/${totalSquads} отправлен!`, 'success');
                            setTimeout(sendNextSquadAlternative, 1000);
                        } else {
                            console.error('G4lKir95: Button not found or disabled for category', squad.option_id);
                            sentCount++;
                            setTimeout(sendNextSquadAlternative, 500);
                        }
                    } else {
                        console.error('G4lKir95: No buttons or selects found for village');
                        sentCount++;
                        setTimeout(sendNextSquadAlternative, 500);
                    }
                } else {
                    console.error('G4lKir95: Village row not found');
                    sentCount++;
                    setTimeout(sendNextSquadAlternative, 500);
                }
            } else {
                completeRealScavenging();
            }
        }
        
        sendNextSquadAlternative();
    }

    function completeRealScavenging() {
        console.log('G4lKir95: REAL scavenging completed');
        showNotification('🎉 Реальный массовый сбор завершен! Все отряды отправлены!', 'success');
        updateProgress('Реальный массовый сбор завершен!');
        scheduleNextRun();
    }

    // ========== ИНТЕРФЕЙС НАСТРОЕК G4LKIR95 ==========
    function createSettingsInterface() {
        return `
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎯 Настройки войск</div>
                <div style="margin-bottom: 10px; font-size: 11px; color: #bdc3c7;">
                    Выберите типы войск для отправки и укажите сколько оставить в деревне
                </div>
                <div class="units-grid" id="unitsContainer"></div>
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
                           placeholder="0" title="Оставить в деревне">
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

        updateProgress(`Реальный запуск сбора ${currentRepeat} из ${totalRepeats}`);
        showNotification(`Реальный запуск сбора ${currentRepeat}/${totalRepeats}`, 'info');

        const success = readyToSend();
        if (!success) {
            stopMassScavenging();
        }
    }

    function scheduleNextRun() {
        if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
            const intervalMs = repeatInterval * 60 * 1000;
            updateProgress(`Следующий РЕАЛЬНЫЙ запуск через ${repeatInterval} минут...`);
            showNotification(`Следующий запуск через ${repeatInterval} минут`, 'info');
            
            repeatTimer = setTimeout(() => {
                if (isRunning) {
                    window.location.reload();
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
            <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging v3.7</div>
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
            localStorage.removeItem("troopTypesEnabled");
            localStorage.removeItem("prioritiseHighCat");
            showNotification('Настройки сброшены!', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    };

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v3.7 with REAL Sophie sending logic...');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        showNotification('G4lKir95 Mass Scavenging v3.7 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();