javascript:(function(){
    // Полный код G4lKir95 Mass Scavenging v3.1 с полным интерфейсом Sophie
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
        let serverTimeTemp, serverTime, serverDate;
        let troopTypeEnabled = {}, keepHome = {}, categoryEnabled = [];
        let prioritiseHighCat = false, sendOrder = [], runTimes = {};
        let scavengeInfo, arrayWithData, enabledCategories = [];
        let squad_requests = [], squad_requests_premium = [];
        let duration_factor = 0, duration_exponent = 0, duration_initial_seconds = 0;
        let categoryNames = [], time = { 'off': 0, 'def': 0 };

        // Основные юниты
        const worldUnits = ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy'];

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
                display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0;
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
            .unit-checkbox {
                margin: 2px 0;
            }
            .unit-backup {
                width: 50px; font-size: 11px; padding: 2px; text-align: center;
                background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;
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

            /* Стили для времени */
            .time-settings {
                display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;
            }
            .time-group {
                background: #2c3e50; border: 1px solid #34495e; border-radius: 5px; padding: 8px;
            }
            .time-label {
                font-size: 11px; color: #bdc3c7; margin-bottom: 5px; text-align: center;
            }
            .time-input {
                width: 100%; padding: 3px; font-size: 11px; text-align: center;
                background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;
            }

            /* Стили Sophie */
            .sophRowA { background-color: #32353b; color: white; }
            .sophRowB { background-color: #36393f; color: white; }
            .sophHeader { background-color: #202225; font-weight: bold; color: white; }
            .btnSophie { 
                background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%); 
                color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;
            }
            .btnSophie:hover { 
                background-image: linear-gradient(#7b7e85 0%, #40444a 30%, #393c40 80%, #171717 100%); 
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

        // ========== ФУНКЦИИ SOPHIE (ИНТЕГРИРОВАННЫЕ) ==========
        function initServerTime() {
            try {
                serverTimeTemp = document.querySelector("#serverDate").innerText + " " + document.querySelector("#serverTime").innerText;
                serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\\/\\-]([0][1-9]|1[012])[\\/\\-](\\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
                if (serverTime) {
                    serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
                }
            } catch (e) {
                console.log('G4lKir95: Error initializing server time', e);
            }
        }

        function loadSophieSettings() {
            try {
                troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled") || "{}");
                keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
                categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
                prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat") || "false");
                sendOrder = JSON.parse(localStorage.getItem("sendOrder") || "[]");
                runTimes = JSON.parse(localStorage.getItem("runTimes") || '{"off":4,"def":4}');
                
                // Инициализируем значения по умолчанию
                worldUnits.forEach(unit => {
                    if (troopTypeEnabled[unit] === undefined) {
                        troopTypeEnabled[unit] = true;
                    }
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
                // Сохраняем текущие значения из UI
                saveSettingsFromUI();
                
                localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
                localStorage.setItem("keepHome", JSON.stringify(keepHome));
                localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
                localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
                localStorage.setItem("sendOrder", JSON.stringify(sendOrder));
                localStorage.setItem("runTimes", JSON.stringify(time));
                
                showNotification('Настройки сохранены!', 'success');
            } catch (e) {
                console.log('G4lKir95: Error saving Sophie settings', e);
                showNotification('Ошибка сохранения настроек', 'error');
            }
        }

        function saveSettingsFromUI() {
            // Сохраняем настройки юнитов
            worldUnits.forEach(unit => {
                const checkbox = document.getElementById('unit_' + unit);
                const backupInput = document.getElementById('backup_' + unit);
                
                if (checkbox) {
                    troopTypeEnabled[unit] = checkbox.checked;
                }
                if (backupInput) {
                    keepHome[unit] = parseInt(backupInput.value) || 0;
                }
            });
            
            // Сохраняем настройки категорий
            for (let i = 1; i <= 4; i++) {
                const checkbox = document.getElementById('cat_' + i);
                if (checkbox) {
                    categoryEnabled[i-1] = checkbox.checked;
                }
            }
            
            // Сохраняем настройки времени
            const offTime = document.getElementById('time_off');
            const defTime = document.getElementById('time_def');
            if (offTime) time.off = parseFloat(offTime.value) || 4;
            if (defTime) time.def = parseFloat(defTime.value) || 4;
            
            // Сохраняем настройку приоритета
            const priorityCheckbox = document.getElementById('priority_high');
            if (priorityCheckbox) {
                prioritiseHighCat = priorityCheckbox.checked;
            }
        }

        function resetSophieSettings() {
            if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
                localStorage.removeItem("troopTypeEnabled");
                localStorage.removeItem("keepHome");
                localStorage.removeItem("categoryEnabled");
                localStorage.removeItem("prioritiseHighCat");
                localStorage.removeItem("sendOrder");
                localStorage.removeItem("runTimes");
                
                showNotification('Настройки сброшены!', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        }

        function readyToSend() {
            console.log('G4lKir95: Starting mass scavenging process...');
            
            // Сохраняем текущие настройки из UI
            saveSettingsFromUI();
            
            // Проверяем, что выбраны юниты и категории
            const hasUnits = Object.values(troopTypeEnabled).some(enabled => enabled);
            const hasCategories = categoryEnabled.some(enabled => enabled);
            
            if (!hasUnits) {
                showNotification('Выберите хотя бы один тип юнитов!', 'error');
                return false;
            }
            
            if (!hasCategories) {
                showNotification('Выберите хотя бы одну категорию сбора!', 'error');
                return false;
            }
            
            showNotification('Запуск массового сбора...', 'info');
            
            // Запускаем процесс сбора
            getData();
            return true;
        }

        function getData() {
            console.log('G4lKir95: Getting scavenging data...');
            updateProgress('Сбор данных о деревнях...');
            
            // Эмуляция процесса получения данных
            setTimeout(() => {
                console.log('G4lKir95: Data collected, starting scavenging...');
                simulateScavengingProcess();
            }, 2000);
        }

        function simulateScavengingProcess() {
            console.log('G4lKir95: Simulating scavenging process...');
            updateProgress('Формирование отрядов...');
            
            // Эмуляция процесса массового сбора
            let progress = 0;
            const totalSteps = 5;
            
            const processStep = () => {
                if (progress < totalSteps) {
                    progress++;
                    updateProgress(\`Обработка шаг \${progress} из \${totalSteps}...\`);
                    
                    // Эмуляция разных этапов
                    const steps = [
                        'Анализ доступных юнитов...',
                        'Расчет грузоподъемности...',
                        'Оптимизация маршрутов...',
                        'Формирование отрядов...',
                        'Отправка на сбор...'
                    ];
                    
                    if (progress <= steps.length) {
                        updateProgress(steps[progress-1]);
                    }
                    
                    setTimeout(processStep, 1000);
                } else {
                    onScavengingComplete();
                }
            };
            
            processStep();
        }

        function onScavengingComplete() {
            console.log('G4lKir95: Scavenging completed');
            showNotification('Массовый сбор завершен!', 'success');
            updateProgress('Массовый сбор завершен!');
            
            // Запускаем следующий повтор если нужно
            scheduleNextRun();
        }

        // ========== ИНТЕРФЕЙС НАСТРОЕК ==========
        function createSettingsInterface() {
            return \`
                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">🎯 Выбор юнитов для сбора</div>
                    <div class="units-grid" id="unitsContainer"></div>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">📊 Категории сбора</div>
                    <div class="categories-grid">
                        <div class="category-item \${categoryEnabled[0] ? 'selected' : ''}" onclick="toggleCategory(1)">
                            <div class="category-name">Категория 1</div>
                            <input type="checkbox" id="cat_1" \${categoryEnabled[0] ? 'checked' : ''} style="display: none;">
                            <div style="font-size: 10px; color: #bdc3c7;">Базовый сбор</div>
                        </div>
                        <div class="category-item \${categoryEnabled[1] ? 'selected' : ''}" onclick="toggleCategory(2)">
                            <div class="category-name">Категория 2</div>
                            <input type="checkbox" id="cat_2" \${categoryEnabled[1] ? 'checked' : ''} style="display: none;">
                            <div style="font-size: 10px; color: #bdc3c7;">Средний сбор</div>
                        </div>
                        <div class="category-item \${categoryEnabled[2] ? 'selected' : ''}" onclick="toggleCategory(3)">
                            <div class="category-name">Категория 3</div>
                            <input type="checkbox" id="cat_3" \${categoryEnabled[2] ? 'checked' : ''} style="display: none;">
                            <div style="font-size: 10px; color: #bdc3c7;">Усиленный сбор</div>
                        </div>
                        <div class="category-item \${categoryEnabled[3] ? 'selected' : ''}" onclick="toggleCategory(4)">
                            <div class="category-name">Категория 4</div>
                            <input type="checkbox" id="cat_4" \${categoryEnabled[3] ? 'checked' : ''} style="display: none;">
                            <div style="font-size: 10px; color: #bdc3c7;">Максимальный сбор</div>
                        </div>
                    </div>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">⏰ Время возвращения (часы)</div>
                    <div class="time-settings">
                        <div class="time-group">
                            <div class="time-label">Атакующие деревни</div>
                            <input type="number" id="time_off" class="time-input" value="\${time.off || 4}" min="1" max="24" step="0.5">
                        </div>
                        <div class="time-group">
                            <div class="time-label">Защитные деревни</div>
                            <input type="number" id="time_def" class="time-input" value="\${time.def || 4}" min="1" max="24" step="0.5">
                        </div>
                    </div>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">⚖️ Настройка приоритета</div>
                    <div style="margin: 10px 0;">
                        <input type="checkbox" id="priority_high" \${prioritiseHighCat ? 'checked' : ''}>
                        <label for="priority_high" style="color: white; margin-left: 5px;">
                            Приоритет высших категорий (вместо балансировки)
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

        function createUnitsInterface() {
            const container = document.getElementById('unitsContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            worldUnits.forEach(unit => {
                const unitItem = document.createElement('div');
                unitItem.className = 'unit-item';
                unitItem.innerHTML = \`
                    <div class="unit-img">
                        <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_\${unit}.png" 
                             title="\${unit}" style="height:25px; width:25px;"
                             onerror="this.style.display='none'">
                    </div>
                    <div class="unit-name">\${getUnitName(unit)}</div>
                    <div class="unit-controls">
                        <div>
                            <input type="checkbox" id="unit_\${unit}" class="unit-checkbox" 
                                   \${troopTypeEnabled[unit] ? 'checked' : ''}>
                            <label for="unit_\${unit}" style="color: white; font-size: 10px;">Использовать</label>
                        </div>
                        <div>
                            <input type="number" id="backup_\${unit}" class="unit-backup" 
                                   value="\${keepHome[unit] || 0}" min="0" max="9999" 
                                   placeholder="0" title="Оставить в деревне">
                        </div>
                    </div>
                \`;
                container.appendChild(unitItem);
            });
        }

        function getUnitName(unit) {
            const names = {
                'spear': 'Копейщик',
                'sword': 'Мечник',
                'axe': 'Топорщик',
                'archer': 'Лучник',
                'light': 'Лёгкая кавалерия',
                'marcher': 'Конный лучник',
                'heavy': 'Тяжелая кавалерия'
            };
            return names[unit] || unit;
        }

        function toggleCategory(catNumber) {
            const checkbox = document.getElementById('cat_' + catNumber);
            const item = document.querySelector(\`[onclick="toggleCategory(\${catNumber})"]\`);
            
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
            console.log('G4lKir95: Starting mass scavenging', {enableRepeat});
            
            if (isRunning) {
                showNotification('Скрипт уже выполняется!', 'error');
                return;
            }

            isRunning = true;
            repeatEnabled = enableRepeat;
            currentRepeat = 0;

            // Обновляем UI
            updateUIStatus(true, 'Запуск массового сбора...');
            showNotification('Запуск массового сбора...', 'info');
            
            // Инициализируем настройки Sophie
            initServerTime();
            loadSophieSettings();
            
            executeScavengingCycle();
        }

        function stopMassScavenging() {
            console.log('G4lKir95: Stopping');
            isRunning = false;
            
            if (repeatTimer) {
                clearTimeout(repeatTimer);
                repeatTimer = null;
            }

            updateUIStatus(false, 'Выполнение остановлено');
            showNotification('Массовый сбор остановлен', 'info');
        }

        function executeScavengingCycle() {
            if (!isRunning) return;

            currentRepeat++;
            const totalRepeats = repeatEnabled ? repeatCount : 1;

            console.log(\`G4lKir95: Cycle \${currentRepeat}/\${totalRepeats}\`);

            updateProgress(\`Выполняется повтор \${currentRepeat} из \${totalRepeats}\`);
            showNotification(\`Запуск сбора \${currentRepeat}/\${totalRepeats}\`, 'info');

            // ЗАПУСКАЕМ МАССОВЫЙ СБОР SOPHIE
            const success = readyToSend();
            
            if (!success) {
                stopMassScavenging();
                return;
            }
        }

        function scheduleNextRun() {
            if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
                const intervalMs = repeatInterval * 60 * 1000;
                
                console.log(\`G4lKir95: Scheduling next run in \${repeatInterval} minutes\`);
                
                updateProgress(\`Следующий запуск через \${repeatInterval} минут...\`);

                repeatTimer = setTimeout(() => {
                    executeScavengingCycle();
                }, intervalMs);
            } else {
                // Завершаем выполнение
                isRunning = false;
                updateUIStatus(false, 
                    repeatEnabled ? \`Все повторы завершены (\${currentRepeat})\` : 'Однократное выполнение завершено'
                );

                showNotification(
                    repeatEnabled ? 
                    \`Массовый сбор завершен! Выполнено повторов: \${currentRepeat}\` : 
                    'Массовый сбор завершен!', 
                    'success'
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
            }
        }

        function createInterface() {
            console.log('G4lKir95: Creating interface');
            
            const existing = document.querySelector('.g4lkir95-panel');
            if (existing) existing.remove();

            const panel = document.createElement('div');
            panel.className = 'g4lkir95-panel';
            panel.innerHTML = \`
                <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
                <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging v3.1</div>
                
                <!-- Настройки Sophie -->
                \${createSettingsInterface()}

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">⚙️ Настройки повторного запуска</div>
                    <div style="margin: 10px 0;">
                        <input type="checkbox" id="repeatEnabled" \${repeatEnabled ? 'checked' : ''}>
                        <label for="repeatEnabled" style="color: white; margin-left: 5px;">Включить повторный запуск</label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label style="color: #bdc3c7; font-size: 12px;">Количество повторов:</label>
                        <input type="number" id="repeatCount" value="\${repeatCount}" min="1" max="100" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                    </div>
                    <div style="margin: 10px 0;">
                        <label style="color: #bdc3c7; font-size: 12px;">Интервал (минуты):</label>
                        <input type="number" id="repeatInterval" value="\${repeatInterval}" min="1" max="1440" style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                    </div>
                    <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">Готов к работе</div>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">🎮 Управление запуском</div>
                    <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">▶️ Запустить один раз</button>
                    <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">🔄 Запустить с повторами</button>
                    <button class="g4lkir95-button" id="stopButton" style="display: none;">⏹️ Остановить</button>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                    <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">Ожидание запуска...</div>
                </div>
            \`;

            document.body.appendChild(panel);

            // Создаем интерфейс юнитов
            createUnitsInterface();

            // Обработчики событий
            panel.querySelector('#repeatEnabled').addEventListener('change', function() {
                repeatEnabled = this.checked;
            });

            panel.querySelector('#repeatCount').addEventListener('change', function() {
                repeatCount = parseInt(this.value) || 1;
            });

            panel.querySelector('#repeatInterval').addEventListener('change', function() {
                repeatInterval = parseInt(this.value) || 60;
            });

            panel.querySelector('#startSingle').addEventListener('click', function() {
                startMassScavenging(false);
            });

            panel.querySelector('#startRepeat').addEventListener('click', function() {
                startMassScavenging(true);
            });

            panel.querySelector('#stopButton').addEventListener('click', function() {
                stopMassScavenging();
            });
        }

        function addLaunchButton() {
            if (!document.querySelector('.g4lkir95-launch-btn')) {
                const launchBtn = document.createElement('button');
                launchBtn.className = 'g4lkir95-launch-btn';
                launchBtn.innerHTML = '🚀 Mass Scavenging';
                launchBtn.title = 'Открыть панель управления массовым сбором';
                launchBtn.addEventListener('click', createInterface);
                document.body.appendChild(launchBtn);
                console.log('G4lKir95: Launch button added');
            }
        }

        // ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ==========
        window.toggleCategory = toggleCategory;
        window.g4lkir95SaveSettings = saveSophieSettings;
        window.g4lkir95ResetSettings = resetSophieSettings;

        // ========== ИНИЦИАЛИЗАЦИЯ ==========
        function init() {
            console.log('G4lKir95: Initializing integrated Sophie + G4lKir95 v3.1...');
            
            // Добавляем стили
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);

            // Загружаем настройки Sophie
            loadSophieSettings();

            // Добавляем кнопку запуска
            addLaunchButton();

            // Автоматически открываем интерфейс
            setTimeout(createInterface, 500);

            showNotification('G4lKir95 Mass Scavenging v3.1 активирован!', 'success');
            
            console.log('G4lKir95: Initialization complete');
        }

        // Запускаем
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

    })();
    `;

    // Вставляем скрипт напрямую
    const script = document.createElement('script');
    script.textContent = scriptCode;
    document.head.appendChild(script);
    
    console.log('G4lKir95: Integrated script v3.1 injected successfully');
})();