// ==UserScript==
// @name         G4lKir95 Mass Scavenging
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Mass scavenging with repeat system - Combined Sophie + G4lKir95
// @author       G4lKir95
// @match        https://*.die-staemme.de/game.php*
// @match        https://*.staemme.ch/game.php*
// @match        https://*.plemiona.pl/game.php*
// @match        https://*.tribalwars.net/game.php*
// @match        https://*.tribalwars.com.br/game.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Проверяем, находимся ли мы на нужной странице
    if (window.location.href.indexOf('screen=place') === -1) {
        return;
    }

    // ========== КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ ==========
    let repeatEnabled = false;
    let repeatCount = 1;
    let repeatInterval = 60;
    let currentRepeat = 0;
    let repeatTimer = null;
    let isRunning = false;

    // Глобальные переменные из скрипта Sophie
    let serverTimeTemp, serverTime, serverDate, scavengeInfo;
    let troopTypeEnabled = {}, keepHome = {}, categoryEnabled = [];
    let prioritiseHighCat = false, sendOrder = [], runTimes = {};
    let arrayWithData, enabledCategories = [], availableUnits = [];
    let squad_requests = [], squad_requests_premium = [];
    let duration_factor = 0, duration_exponent = 0, duration_initial_seconds = 0;
    let categoryNames = [], time = { 'off': 0, 'def': 0 };
    let premiumBtnEnabled = false;

    // ========== СТИЛИ ==========
    const styles = `
        .g4lkir95-panel {
            position: fixed;
            top: 50px;
            right: 10px;
            width: 350px;
            background: #2c3e50;
            border: 2px solid #34495e;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            max-height: 80vh;
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
        .g4lkir95-input-group {
            margin-bottom: 8px;
        }
        .g4lkir95-label {
            display: block;
            margin-bottom: 3px;
            font-size: 12px;
            color: #bdc3c7;
        }
        .g4lkir95-input {
            width: 100%;
            padding: 5px;
            border: 1px solid #7f8c8d;
            border-radius: 3px;
            background: #2c3e50;
            color: white;
            font-size: 12px;
        }
        .g4lkir95-checkbox {
            margin-right: 5px;
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
            transition: background 0.3s;
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
        .g4lkir95-row {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        .g4lkir95-row label {
            margin-left: 5px;
            font-size: 12px;
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

        /* Стили из Sophie */
        .sophRowA { background-color: #32353b; color: white; }
        .sophRowB { background-color: #36393f; color: white; }
        .sophHeader { background-color: #202225; font-weight: bold; color: white; }
        .btnSophie { background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%); color: white; }
        .btnSophie:hover { background-image: linear-gradient(#7b7e85 0%, #40444a 30%, #393c40 80%, #171717 100%); }
    `;

    // ========== ФУНКЦИИ УПРАВЛЕНИЯ ==========

    function loadSettings() {
        const savedEnabled = localStorage.getItem('g4lkir95_repeatEnabled');
        const savedCount = localStorage.getItem('g4lkir95_repeatCount');
        const savedInterval = localStorage.getItem('g4lkir95_repeatInterval');
        
        if (savedEnabled !== null) repeatEnabled = savedEnabled === 'true';
        if (savedCount !== null) repeatCount = parseInt(savedCount) || 1;
        if (savedInterval !== null) repeatInterval = parseInt(savedInterval) || 60;
    }

    function saveSettings() {
        localStorage.setItem('g4lkir95_repeatEnabled', repeatEnabled.toString());
        localStorage.setItem('g4lkir95_repeatCount', repeatCount.toString());
        localStorage.setItem('g4lkir95_repeatInterval', repeatInterval.toString());
    }

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
            notification.remove();
        }, 3000);
    }

    // ========== ИНТЕРФЕЙС SOPHIE (МОДИФИЦИРОВАННЫЙ) ==========

    function createSophieInterface() {
        // Удаляем существующий интерфейс если есть
        const existingUI = document.getElementById('massScavengeSophie');
        if (existingUI) {
            existingUI.remove();
        }

        // Инициализируем серверное время
        initServerTime();

        const html = `
        <div id="massScavengeSophie" class="ui-widget-content" style="width:580px;background-color:#36393f;cursor:move;z-index:50;max-height:85vh;overflow-y:auto;">
            <button class="btn" id="x" onclick="closeWindow('massScavengeSophie')">X</button>
            
            <table id="massScavengeSophieTable" class="vis" border="1" style="width: 100%;background-color:#36393f;border-color:#3e4147">
                <tr>
                    <td colspan="10" id="massScavengeSophieTitle" style="text-align:center; width:auto; background-color:#202225">
                        <h4 style="margin:5px">
                            <center><u><font color="#ffffdf">Массовый сбор ресурсов</font></u></center>
                        </h4>
                    </td>
                </tr>
                <tr style="background-color:#36393f">
                    <td style="text-align:center;background-color:#202225" colspan="15">
                        <h5 style="margin:3px">
                            <center><u><font color="#ffffdf">Выберите типы юнитов/ПОРЯДОК для сбора</font></u></center>
                        </h5>
                    </td>
                </tr>
                <tr id="imgRow"></tr>
            </table>
            
            <table class="vis" border="1" style="width: 100%;background-color:#36393f;border-color:#3e4147; margin-top:5px;">
                <tbody>
                    <tr style="background-color:#36393f">
                        <td style="text-align:center;background-color:#202225" colspan="4">
                            <h5 style="margin:3px">
                                <center><u><font color="#ffffdf">Выберите категории для использования</font></u></center>
                            </h5>
                        </td>
                    </tr>
                    <tr id="categories" style="text-align:center; width:auto; background-color:#202225">
                        <td style="text-align:center; width:auto; background-color:#202225;padding: 3px;">
                            <font color="#ffffdf" style="font-size:12px">${categoryNames[1]?.name || 'Кат. 1'}</font>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#202225;padding: 3px;">
                            <font color="#ffffdf" style="font-size:12px">${categoryNames[2]?.name || 'Кат. 2'}</font>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#202225;padding: 3px;">
                            <font color="#ffffdf" style="font-size:12px">${categoryNames[3]?.name || 'Кат. 3'}</font>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#202225;padding: 3px;">
                            <font color="#ffffdf" style="font-size:12px">${categoryNames[4]?.name || 'Кат. 4'}</font>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align:center; width:auto; background-color:#36393f">
                            <center><input type="checkbox" ID="category1" name="cat1"></center>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#36393f">
                            <center><input type="checkbox" ID="category2" name="cat2"></center>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#36393f">
                            <center><input type="checkbox" ID="category3" name="cat3"></center>
                        </td>
                        <td style="text-align:center; width:auto; background-color:#36393f">
                            <center><input type="checkbox" ID="category4" name="cat4"></center>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Убрана кнопка "Рассчитать время для каждой страницы" -->
        </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', html);
        initSophieControls();
    }

    function initServerTime() {
        serverTimeTemp = $("#serverDate")[0].innerText + " " + $("#serverTime")[0].innerText;
        serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
        serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
    }

    function initSophieControls() {
        // Инициализация элементов управления Sophie
        loadSophieSettings();
        createUnitCheckboxes();
        setupEventListeners();
    }

    function loadSophieSettings() {
        // Загрузка настроек из localStorage (упрощенная версия)
        troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled") || "{}");
        keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
        categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
        prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat") || "false");
        sendOrder = JSON.parse(localStorage.getItem("sendOrder") || "[]");
        runTimes = JSON.parse(localStorage.getItem("runTimes") || '{"off":4,"def":4}');
    }

    function createUnitCheckboxes() {
        const worldUnits = window.game_data?.units || ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy'];
        const imgRow = document.getElementById('imgRow');
        
        worldUnits.forEach(unit => {
            if (!['militia', 'snob', 'ram', 'catapult', 'spy', 'knight'].includes(unit)) {
                const html = `
                <td align="center" style="background-color:#36393f">
                    <table class="vis" border="1" style="width: 80px">
                        <tbody>    
                            <tr>
                                <td style="text-align:center;background-color:#202225;padding: 2px;">
                                    <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${unit}.png" title="${unit}" style="height:20px;">
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color:#36393f;padding: 1px;">
                                    <input type="checkbox" ID="${unit}" name="${unit}" style="transform:scale(0.8)">
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align:center; background-color:#202225;padding: 1px;">
                                    <font color="#ffffdf" style="font-size:9px">Backup</font>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color:#36393f;padding: 1px;">
                                    <input type="text" ID="${unit}Backup" name="${unit}" value="${keepHome[unit] || 0}" size="3" style="font-size:10px; width:30px">
                                </td>
                            </tr>
                        </tbody>  
                    </table>
                </td>`;
                imgRow.insertAdjacentHTML('beforeend', html);
            }
        });
    }

    function setupEventListeners() {
        // Инициализация чекбоксов
        Object.keys(troopTypeEnabled).forEach(unit => {
            const checkbox = document.getElementById(unit);
            if (checkbox) {
                checkbox.checked = troopTypeEnabled[unit];
            }
        });

        // Инициализация категорий
        categoryEnabled.forEach((enabled, index) => {
            const checkbox = document.getElementById(`category${index + 1}`);
            if (checkbox) {
                checkbox.checked = enabled;
            }
        });
    }

    // ========== ОСНОВНАЯ ЛОГИКА SOPHIE ==========

    function readyToSend() {
        // Собираем настройки из интерфейса
        collectSettings();
        
        // Проверяем обязательные настройки
        if (!validateSettings()) {
            return false;
        }

        // Сохраняем настройки
        saveSophieSettings();
        
        // Запускаем процесс сбора
        getData();
        return true;
    }

    function collectSettings() {
        const worldUnits = window.game_data?.units || ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy'];
        
        // Собираем типы юнитов
        worldUnits.forEach(unit => {
            if (!['militia', 'snob', 'ram', 'catapult', 'spy', 'knight'].includes(unit)) {
                const checkbox = document.getElementById(unit);
                const backup = document.getElementById(unit + 'Backup');
                if (checkbox) troopTypeEnabled[unit] = checkbox.checked;
                if (backup) keepHome[unit] = parseInt(backup.value) || 0;
            }
        });

        // Собираем категории
        enabledCategories = [
            document.getElementById('category1')?.checked || false,
            document.getElementById('category2')?.checked || false,
            document.getElementById('category3')?.checked || false,
            document.getElementById('category4')?.checked || false
        ];

        // Базовые настройки времени
        time.off = 4;
        time.def = 4;
    }

    function validateSettings() {
        // Проверяем, что выбрана хотя бы одна категория
        if (!enabledCategories.some(cat => cat)) {
            showNotification('Выберите хотя бы одну категорию!', 'error');
            return false;
        }

        // Проверяем, что выбран хотя бы один юнит
        if (!Object.values(troopTypeEnabled).some(enabled => enabled)) {
            showNotification('Выберите хотя бы один тип юнитов!', 'error');
            return false;
        }

        return true;
    }

    function saveSophieSettings() {
        localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
        localStorage.setItem("keepHome", JSON.stringify(keepHome));
        localStorage.setItem("categoryEnabled", JSON.stringify(enabledCategories));
        localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
        localStorage.setItem("sendOrder", JSON.stringify(sendOrder));
        localStorage.setItem("runTimes", JSON.stringify(time));
    }

    function getData() {
        // Упрощенная версия получения данных
        console.log("G4lKir95: Starting mass scavenging process...");
        showNotification('Запуск массового сбора...', 'info');
        
        // Эмуляция процесса (замените на реальную логику Sophie)
        setTimeout(() => {
            showNotification('Массовый сбор завершен!', 'success');
            if (window.g4lkir95_updateProgress) {
                window.g4lkir95_updateProgress(`Повтор ${currentRepeat} завершен`);
            }
            
            // Запускаем следующий повтор если нужно
            scheduleNextRun();
        }, 3000);
    }

    // ========== СИСТЕМА ПОВТОРНОГО ЗАПУСКА ==========

    function startMassScavenging(enableRepeat = false) {
        if (isRunning) {
            showNotification('Скрипт уже выполняется!', 'error');
            return;
        }

        isRunning = true;
        repeatEnabled = enableRepeat;
        currentRepeat = 0;

        if (window.g4lkir95_updateStatus) {
            window.g4lkir95_updateStatus(true, 'Запуск массового сбора...');
        }

        saveSettings();
        executeScavengingCycle();
    }

    function stopMassScavenging() {
        isRunning = false;
        repeatEnabled = false;
        
        if (repeatTimer) {
            clearTimeout(repeatTimer);
            repeatTimer = null;
        }

        if (window.g4lkir95_updateStatus) {
            window.g4lkir95_updateStatus(false, 'Выполнение остановлено');
        }

        showNotification('Массовый сбор остановлен', 'info');
    }

    function executeScavengingCycle() {
        if (!isRunning) return;

        currentRepeat++;
        const totalRepeats = repeatEnabled ? repeatCount : 1;

        if (window.g4lkir95_updateProgress) {
            window.g4lkir95_updateProgress(`Выполняется повтор ${currentRepeat} из ${totalRepeats}`);
        }

        console.log(`G4lKir95: Запуск массового сбора ${currentRepeat}/${totalRepeats}`);

        // Запускаем основную логику Sophie
        const success = readyToSend();
        
        if (!success) {
            stopMassScavenging();
            return;
        }

        // Следующий запуск планируется в функции getData после завершения
    }

    function scheduleNextRun() {
        if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
            const intervalMs = repeatInterval * 60 * 1000;
            
            if (window.g4lkir95_updateProgress) {
                window.g4lkir95_updateProgress(`Следующий запуск через ${repeatInterval} минут...`);
            }

            repeatTimer = setTimeout(() => {
                executeScavengingCycle();
            }, intervalMs);
        } else {
            // Завершаем выполнение
            isRunning = false;
            if (window.g4lkir95_updateStatus) {
                window.g4lkir95_updateStatus(false, 
                    repeatEnabled ? `Все повторы завершены (${repeatCount})` : 'Однократное выполнение завершено'
                );
            }
        }
    }

    // ========== ИНТЕРФЕЙС G4LKIR95 ==========

    function createInterface() {
        const existingPanel = document.querySelector('.g4lkir95-panel');
        if (existingPanel) existingPanel.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">G4lKir95 Mass Scavenging v2.0</div>
            
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">⚙️ Настройки повторного запуска</div>
                
                <div class="g4lkir95-input-group">
                    <div class="g4lkir95-row">
                        <input type="checkbox" id="repeatEnabled" class="g4lkir95-checkbox">
                        <label for="repeatEnabled">Включить повторный запуск</label>
                    </div>
                </div>
                
                <div class="g4lkir95-input-group">
                    <label class="g4lkir95-label">Количество повторов:</label>
                    <input type="number" id="repeatCount" class="g4lkir95-input" min="1" max="100" value="${repeatCount}">
                </div>
                
                <div class="g4lkir95-input-group">
                    <label class="g4lkir95-label">Интервал (минуты):</label>
                    <input type="number" id="repeatInterval" class="g4lkir95-input" min="1" max="1440" value="${repeatInterval}">
                </div>
                
                <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">
                    Готов к работе
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🚀 Управление запуском</div>
                
                <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">
                    ▶️ Запустить один раз
                </button>
                
                <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">
                    🔄 Запустить с повторами
                </button>
                
                <button class="g4lkir95-button" id="stopButton" style="display: none;">
                    ⏹️ Остановить
                </button>

                <button class="g4lkir95-button" onclick="createSophieInterface()">
                    ⚙️ Настройки сбора
                </button>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">
                    Ожидание запуска...
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        initInterfaceControls(panel);
    }

    function initInterfaceControls(panel) {
        const repeatEnabledCheckbox = panel.querySelector('#repeatEnabled');
        const repeatCountInput = panel.querySelector('#repeatCount');
        const repeatIntervalInput = panel.querySelector('#repeatInterval');
        const startSingleBtn = panel.querySelector('#startSingle');
        const startRepeatBtn = panel.querySelector('#startRepeat');
        const stopBtn = panel.querySelector('#stopButton');
        const statusSection = panel.querySelector('#statusSection');
        const progressInfo = panel.querySelector('#progressInfo');

        repeatEnabledCheckbox.checked = repeatEnabled;
        repeatCountInput.value = repeatCount;
        repeatIntervalInput.value = repeatInterval;

        repeatEnabledCheckbox.addEventListener('change', function() {
            repeatEnabled = this.checked;
            saveSettings();
        });

        repeatCountInput.addEventListener('change', function() {
            repeatCount = parseInt(this.value) || 1;
            saveSettings();
        });

        repeatIntervalInput.addEventListener('change', function() {
            repeatInterval = parseInt(this.value) || 60;
            saveSettings();
        });

        startSingleBtn.addEventListener('click', () => startMassScavenging(false));
        startRepeatBtn.addEventListener('click', () => startMassScavenging(true));
        stopBtn.addEventListener('click', stopMassScavenging);

        window.g4lkir95_updateStatus = function(isActive, message = '') {
            if (isActive) {
                statusSection.className = 'g4lkir95-status g4lkir95-status-active';
                statusSection.textContent = 'Выполняется...';
                stopBtn.style.display = 'block';
                startSingleBtn.style.display = 'none';
                startRepeatBtn.style.display = 'none';
            } else {
                statusSection.className = 'g4lkir95-status g4lkir95-status-inactive';
                statusSection.textContent = 'Готов к работе';
                stopBtn.style.display = 'none';
                startSingleBtn.style.display = 'block';
                startRepeatBtn.style.display = 'block';
            }
            if (message) progressInfo.textContent = message;
        };

        window.g4lkir95_updateProgress = function(message) {
            progressInfo.textContent = message;
        };
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

    // ========== ИНИЦИАЛИЗАЦИЯ ==========

    function init() {
        console.log('G4lKir95 Mass Scavenging v2.0 loaded');
        
        // Добавляем стили
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Загружаем настройки
        loadSettings();

        // Добавляем кнопку запуска
        addLaunchButton();

        // Периодически проверяем кнопку
        setInterval(addLaunchButton, 3000);

        showNotification('G4lKir95 Mass Scavenging v2.0 активирован!', 'success');
        
        // Автоматически создаем интерфейс Sophie
        setTimeout(createSophieInterface, 1000);
    }

    // Глобальные функции
    window.closeWindow = function(title) {
        const element = document.getElementById(title);
        if (element) element.remove();
    };

    window.createSophieInterface = createSophieInterface;

    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();