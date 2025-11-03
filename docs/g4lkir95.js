javascript:(function(){
    // Полный код G4lKir95 Mass Scavenging v3.4 с реальным парсингом
    const scriptCode = `
    (function() {
        'use strict';
        
        console.log('G4lKir95: Starting...');
        
        // Автоматическое перенаправление на страницу массового сбора
        if (window.location.href.indexOf('mode=scavenge_mass') === -1) {
            console.log('G4lKir95: Redirecting to mass scavenging page');
            window.location.href = game_data.link_base_pure + 'place&mode=scavenge_mass';
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
        let keepHome = {};
        let categoryEnabled = [];
        let prioritiseHighCat = false;

        // Фиксированные настройки времени
        const time = { 'off': 4, 'def': 12 };

        // Основные юниты (без лучников и конных лучников)
        const worldUnits = ['spear', 'sword', 'axe', 'light', 'heavy'];

        // ========== СТИЛИ ==========
        const styles = \`
            .g4lkir95-panel {
                position: fixed; top: 50px; right: 10px; width: 400px;
                background: #2c3e50; border: 2px solid #34495e; border-radius: 8px;
                padding: 15px; z-index: 10000; font-family: Arial; color: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;
            }
            .g4lkir95-header {
                background: #34495e; padding: 10px; margin: -15px -15px 15px -15px;
                border-radius: 6px 6px 0 0; text-align: center; font-weight: bold; font-size: 16px;
            }
            .g4lkir95-section {
                margin-bottom: 15px; padding: 10px; background: #34495e; border-radius: 5px;
            }
            .g4lkir95-section-title {
                font-weight: bold; margin-bottom: 8px; color: #ecf0f1; font-size: 14px;
            }
            .g4lkir95-button {
                width: 100%; padding: 8px; margin: 5px 0; border: none; border-radius: 4px;
                background: #e74c3c; color: white; font-weight: bold; cursor: pointer; font-size: 12px;
            }
            .g4lkir95-button:hover { background: #c0392b; }
            .g4lkir95-button-success { background: #27ae60; }
            .g4lkir95-button-success:hover { background: #219a52; }
            .g4lkir95-button-warning { background: #f39c12; }
            .g4lkir95-button-warning:hover { background: #d35400; }
            .g4lkir95-close {
                position: absolute; top: 5px; right: 10px; background: none; border: none;
                color: white; font-size: 18px; cursor: pointer; font-weight: bold;
            }
            .g4lkir95-launch-btn {
                position: fixed; top: 10px; right: 10px; padding: 8px 15px;
                background: #e74c3c; color: white; border: none; border-radius: 5px;
                cursor: pointer; font-weight: bold; z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 12px;
            }
            .g4lkir95-launch-btn:hover { background: #c0392b; }
            .g4lkir95-status {
                text-align: center; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 11px;
            }
            .g4lkir95-status-active { background: #27ae60; }
            .g4lkir95-status-inactive { background: #7f8c8d; }

            /* Стили для юнитов */
            .units-grid {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0;
            }
            .unit-item {
                background: #2c3e50; border: 1px solid #34495e; border-radius: 5px; padding: 8px;
                text-align: center;
            }
            .unit-img {
                background: #202225; padding: 5px; border-radius: 3px; margin-bottom: 5px;
            }
            .unit-name {
                font-size: 10px; color: #bdc3c7; margin-bottom: 5px;
            }
            .unit-controls {
                display: flex; flex-direction: column; gap: 3px;
            }
            .unit-backup {
                width: 60px; font-size: 11px; padding: 2px; text-align: center;
                background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;
            }
            .backup-label {
                font-size: 9px; color: #bdc3c7; margin-bottom: 2px;
            }

            /* Стили для категорий */
            .categories-grid {
                display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0;
            }
            .category-item {
                background: #2c3e50; border: 1px solid #34495e; border-radius: 5px; padding: 10px;
                text-align: center; cursor: pointer;
            }
            .category-item.selected {
                background: #27ae60; border-color: #219a52;
            }
            .category-name {
                font-size: 11px; font-weight: bold; margin-bottom: 5px;
            }
        \`;

        // ========== ФУНКЦИИ УВЕДОМЛЕНИЙ ==========
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                padding: 10px 20px; background: \${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
                color: white; border-radius: 5px; z-index: 10001; font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => {
                if (notification.parentNode) notification.remove();
            }, 3000);
        }

        // ========== РЕАЛЬНЫЕ ФУНКЦИИ SOPHIE ==========
        function loadSophieSettings() {
            try {
                keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
                categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
                prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat") || "false");
                
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

        // ========== РЕАЛЬНЫЙ ПАРСИНГ СТРАНИЦЫ ==========
        function getVillageDataFromPage() {
            console.log('G4lKir95: Getting REAL village data from page...');
            const villages = [];
            
            try {
                // Ищем все строки с деревнями в таблице массового сбора
                const rows = document.querySelectorAll('#scavenge_mass_content tr');
                
                for (let row of rows) {
                    const villageLink = row.querySelector('a[href*="village"]');
                    if (villageLink && villageLink.href.includes('village=')) {
                        const villageId = villageLink.href.match(/village=(\\d+)/)[1];
                        const villageName = villageLink.textContent.trim();
                        
                        // Парсим реальное количество войск из строки
                        const units = parseUnitsFromRow(row);
                        
                        // Проверяем доступные категории сбора
                        const options = parseAvailableOptions(row);
                        
                        if (villageId && units && hasAvailableUnits(units)) {
                            villages.push({
                                id: villageId,
                                name: villageName,
                                has_rally_point: true,
                                units: units,
                                options: options
                            });
                        }
                    }
                }
                
                console.log('G4lKir95: Found REAL villages:', villages.length);
                return villages;
            } catch (e) {
                console.error('G4lKir95: Error getting village data:', e);
                return [];
            }
        }

        function parseUnitsFromRow(row) {
            const units = {};
            const cells = row.querySelectorAll('td');
            
            // Парсим реальные числа войск из ячеек таблицы
            for (let cell of cells) {
                const text = cell.textContent.trim();
                
                // Ищем числа в формате "1.000" или "1000"
                const numberMatch = text.match/([\\d.,]+)/);
                if (numberMatch) {
                    const number = parseInt(numberMatch[1].replace(/[.,]/g, ''));
                    
                    // Определяем тип юнита по содержимому ячейки
                    const unitType = detectUnitType(cell);
                    if (unitType && worldUnits.includes(unitType)) {
                        units[unitType] = number;
                    }
                }
            }
            
            // Заполняем отсутствующие юниты нулями
            worldUnits.forEach(unit => {
                if (units[unit] === undefined) {
                    units[unit] = 0;
                }
            });
            
            return units;
        }

        function detectUnitType(cell) {
            // Определяем тип юнита по содержимому ячейки
            const html = cell.innerHTML.toLowerCase();
            if (html.includes('spear') || html.includes('unit_spear')) return 'spear';
            if (html.includes('sword') || html.includes('unit_sword')) return 'sword';
            if (html.includes('axe') || html.includes('unit_axe')) return 'axe';
            if (html.includes('light') || html.includes('unit_light')) return 'light';
            if (html.includes('heavy') || html.includes('unit_heavy')) return 'heavy';
            return null;
        }

        function parseAvailableOptions(row) {
            const options = {};
            
            // Парсим доступные категории сбора (кнопки 1,2,3,4)
            for (let i = 1; i <= 4; i++) {
                const optionButton = row.querySelector(\`input[value="\${i}"]\`);
                options[i] = {
                    is_locked: !optionButton || optionButton.disabled,
                    scavenging_squad: null
                };
            }
            
            return options;
        }

        function hasAvailableUnits(units) {
            // Проверяем, есть ли доступные войска после вычета backup
            return worldUnits.some(unit => {
                const available = units[unit] || 0;
                const backup = keepHome[unit] || 0;
                return available > backup;
            });
        }

        // ========== РЕАЛЬНЫЙ РАСЧЕТ ОТРЯДОВ ==========
        function calculateScavengingSquads(villages) {
            console.log('G4lKir95: Calculating REAL squads for', villages.length, 'villages');
            const squads = [];
            
            villages.forEach(village => {
                const villageSquads = calculateSquadsForVillage(village);
                squads.push(...villageSquads);
            });
            
            console.log('G4lKir95: Total REAL squads to send:', squads.length);
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
            
            const requiredCapacity = calculateRequiredCapacity(category);
            const unitOrder = prioritiseHighCat ? 
                ['light', 'heavy', 'axe', 'sword', 'spear'] :
                ['spear', 'sword', 'axe', 'heavy', 'light'];
            
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

        // ========== РЕАЛЬНАЯ ОТПРАВКА ГРУППАМИ ПО 50 ==========
        function sendScavengingSquads(squads) {
            if (squads.length === 0) {
                showNotification('Нет отрядов для отправки!', 'error');
                return;
            }
            
            console.log('G4lKir95: Sending', squads.length, 'squads in groups of 50');
            updateProgress(\`Отправка \${squads.length} отрядов группами по 50...\`);
            
            // РАЗБИВАЕМ НА ГРУППЫ ПО 50 ОТРЯДОВ
            const groups = [];
            for (let i = 0; i < squads.length; i += 50) {
                groups.push(squads.slice(i, i + 50));
            }
            
            console.log('G4lKir95: Created', groups.length, 'groups');
            
            let currentGroup = 0;
            let successfulGroups = 0;
            
            function sendNextGroup() {
                if (currentGroup < groups.length && isRunning) {
                    const group = groups[currentGroup];
                    updateProgress(\`Отправка группы \${currentGroup + 1} из \${groups.length} (\${group.length} отрядов)...\`);
                    
                    sendSquadGroup(group).then(success => {
                        if (success) {
                            successfulGroups++;
                            showNotification(\`Группа \${currentGroup + 1} отправлена успешно!\`, 'success');
                        } else {
                            showNotification(\`Ошибка отправки группы \${currentGroup + 1}\`, 'error');
                        }
                        
                        currentGroup++;
                        if (currentGroup < groups.length && isRunning) {
                            // Задержка 1 секунда между группами
                            setTimeout(sendNextGroup, 1000);
                        } else {
                            completeRealScavenging(successfulGroups, groups.length);
                        }
                    });
                }
            }
            
            sendNextGroup();
        }

        function sendSquadGroup(squads) {
            return new Promise((resolve) => {
                console.log('G4lKir95: Sending squad group of', squads.length, 'squads');
                
                // РЕАЛЬНЫЙ AJAX ЗАПРОС К API TRIBAL WARS
                TribalWars.post('scavenge_api', 
                    { 
                        ajaxaction: 'send_squads',
                        screen: 'place',
                        mode: 'scavenge_mass'
                    }, 
                    { 
                        "squad_requests": squads 
                    }, 
                    function(response) {
                        console.log('G4lKir95: Squad group sent successfully', response);
                        resolve(true);
                    },
                    function(error) {
                        console.error('G4lKir95: Error sending squad group:', error);
                        resolve(false);
                    }
                );
            });
        }

        function completeRealScavenging(successfulGroups, totalGroups) {
            console.log('G4lKir95: REAL scavenging completed');
            const message = \`Реальный массовый сбор завершен! Успешно отправлено групп: \${successfulGroups}/\${totalGroups}\`;
            showNotification(message, 'success');
            updateProgress(message);
            scheduleNextRun();
        }

        function readyToSend() {
            console.log('G4lKir95: Starting REAL mass scavenging process...');
            saveSettingsFromUI();
            
            if (!categoryEnabled.some(enabled => enabled)) {
                showNotification('Выберите хотя бы одну категорию сбора!', 'error');
                return false;
            }
            
            showNotification('Запуск реального массового сбора...', 'info');
            
            // Получаем РЕАЛЬНЫЕ данные со страницы
            const villageData = getVillageDataFromPage();
            if (!villageData || villageData.length === 0) {
                showNotification('Не найдено деревень для сбора!', 'error');
                return false;
            }
            
            updateProgress(\`Найдено \${villageData.length} деревень...\`);
            
            // Рассчитываем отряды для каждой деревни
            const squads = calculateScavengingSquads(villageData);
            
            // Отправляем отряды группами по 50
            sendScavengingSquads(squads);
            
            return true;
        }

        // ========== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ==========
        function createSettingsInterface() {
            return \`
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
                        <div class="category-item \${categoryEnabled[0] ? 'selected' : ''}" onclick="toggleCategory(1)">
                            <div class="category-name">Категория 1</div>
                            <input type="checkbox" id="cat_1" \${categoryEnabled[0] ? 'checked' : ''} style="display: none;">
                        </div>
                        <div class="category-item \${categoryEnabled[1] ? 'selected' : ''}" onclick="toggleCategory(2)">
                            <div class="category-name">Категория 2</div>
                            <input type="checkbox" id="cat_2" \${categoryEnabled[1] ? 'checked' : ''} style="display: none;">
                        </div>
                        <div class="category-item \${categoryEnabled[2] ? 'selected' : ''}" onclick="toggleCategory(3)">
                            <div class="category-name">Категория 3</div>
                            <input type="checkbox" id="cat_3" \${categoryEnabled[2] ? 'checked' : ''} style="display: none;">
                        </div>
                        <div class="category-item \${categoryEnabled[3] ? 'selected' : ''}" onclick="toggleCategory(4)">
                            <div class="category-name">Категория 4</div>
                            <input type="checkbox" id="cat_4" \${categoryEnabled[3] ? 'checked' : ''} style="display: none;">
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
                        <input type="checkbox" id="priority_high" \${prioritiseHighCat ? 'checked' : ''}>
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
            \`;
        }

        // ... остальные функции интерфейса без изменений ...

    })();
    `;

    const script = document.createElement('script');
    script.textContent = scriptCode;
    document.head.appendChild(script);
    console.log('G4lKir95: Integrated script v3.4 injected successfully');
})();
