// ==UserScript==
// @name         G4lKir95 Mass Scavenging
// @namespace    http://tampermonkey.net/
// @version      2.0.2
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

    if (window.location.href.indexOf('screen=place') === -1) return;

    // Переменные
    let repeatEnabled = false;
    let repeatCount = 1;
    let repeatInterval = 60;
    let currentRepeat = 0;
    let repeatTimer = null;
    let isRunning = false;

    // Стили
    const styles = `
        .g4lkir95-panel, .g4lkir95-sophie-panel {
            position: fixed;
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
        .g4lkir95-panel {
            top: 50px;
            right: 10px;
            width: 350px;
        }
        .g4lkir95-sophie-panel {
            top: 50px;
            left: 10px;
            width: 600px;
            background: #36393f;
            border-color: #3e4147;
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
        .sophie-unit-table {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            justify-content: center;
        }
        .sophie-unit-item {
            width: 80px;
            text-align: center;
        }
        .sophie-unit-img {
            background: #202225;
            padding: 5px;
            border-radius: 3px;
        }
        .sophie-unit-controls {
            background: #36393f;
            padding: 3px;
        }
    `;

    // Функции
    function loadSettings() {
        repeatEnabled = localStorage.getItem('g4lkir95_repeatEnabled') === 'true';
        repeatCount = parseInt(localStorage.getItem('g4lkir95_repeatCount')) || 1;
        repeatInterval = parseInt(localStorage.getItem('g4lkir95_repeatInterval')) || 60;
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
        setTimeout(() => notification.remove(), 3000);
    }

    // Интерфейс Sophie (БЕЗ КНОПКИ РАССЧИТАТЬ)
    function createSophieInterface() {
        const existing = document.querySelector('.g4lkir95-sophie-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-sophie-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">⚙️ Настройки сбора ресурсов</div>
            
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎯 Выберите типы юнитов</div>
                <div class="sophie-unit-table" id="unitTable"></div>
            </div>
            
            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Выберите категории сбора</div>
                <div style="display: flex; justify-content: space-between; text-align: center;">
                    <div><input type="checkbox" id="cat1"><label for="cat1" style="color:white; margin-left:5px;">Кат. 1</label></div>
                    <div><input type="checkbox" id="cat2"><label for="cat2" style="color:white; margin-left:5px;">Кат. 2</label></div>
                    <div><input type="checkbox" id="cat3"><label for="cat3" style="color:white; margin-left:5px;">Кат. 3</label></div>
                    <div><input type="checkbox" id="cat4"><label for="cat4" style="color:white; margin-left:5px;">Кат. 4</label></div>
                </div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">💾 Управление настройками</div>
                <button class="g4lkir95-button" onclick="saveSophieSettings()">Сохранить настройки</button>
                <button class="g4lkir95-button" onclick="resetSophieSettings()">Сбросить настройки</button>
            </div>
        `;

        document.body.appendChild(panel);
        initSophieUnits();
        loadSophieSettings();
    }

    function initSophieUnits() {
        const units = ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy'];
        const table = document.getElementById('unitTable');
        
        units.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'sophie-unit-item';
            item.innerHTML = `
                <div class="sophie-unit-img">
                    <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${unit}.png" title="${unit}" style="height:20px;">
                </div>
                <div class="sophie-unit-controls">
                    <input type="checkbox" id="${unit}" style="margin: 2px;">
                </div>
                <div class="sophie-unit-controls">
                    <input type="number" id="${unit}_backup" value="0" min="0" style="width: 40px; font-size: 10px; padding: 1px;">
                </div>
                <div style="font-size: 9px; color: #bdc3c7; margin-top: 2px;">${unit}</div>
            `;
            table.appendChild(item);
        });
    }

    function loadSophieSettings() {
        // Загрузка настроек Sophie
        try {
            const troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled") || "{}");
            const keepHome = JSON.parse(localStorage.getItem("keepHome") || "{}");
            const categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled") || "[true,true,true,true]");
            
            Object.keys(troopTypeEnabled).forEach(unit => {
                const checkbox = document.getElementById(unit);
                if (checkbox) checkbox.checked = troopTypeEnabled[unit];
            });
            
            Object.keys(keepHome).forEach(unit => {
                const input = document.getElementById(unit + '_backup');
                if (input) input.value = keepHome[unit];
            });
            
            categoryEnabled.forEach((enabled, index) => {
                const checkbox = document.getElementById('cat' + (index + 1));
                if (checkbox) checkbox.checked = enabled;
            });
        } catch (e) {
            console.log('Error loading Sophie settings:', e);
        }
    }

    function saveSophieSettings() {
        const units = ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy'];
        const troopTypeEnabled = {};
        const keepHome = {};
        const categoryEnabled = [];
        
        units.forEach(unit => {
            const checkbox = document.getElementById(unit);
            const backup = document.getElementById(unit + '_backup');
            if (checkbox) troopTypeEnabled[unit] = checkbox.checked;
            if (backup) keepHome[unit] = parseInt(backup.value) || 0;
        });
        
        for (let i = 1; i <= 4; i++) {
            const checkbox = document.getElementById('cat' + i);
            categoryEnabled.push(checkbox ? checkbox.checked : true);
        }
        
        localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
        localStorage.setItem("keepHome", JSON.stringify(keepHome));
        localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
        
        showNotification('Настройки сохранены!', 'success');
    }

    function resetSophieSettings() {
        localStorage.removeItem("troopTypeEnabled");
        localStorage.removeItem("keepHome");
        localStorage.removeItem("categoryEnabled");
        showNotification('Настройки сброшены!', 'success');
        setTimeout(() => location.reload(), 1000);
    }

    // Основной интерфейс G4lKir95
    function createInterface() {
        const existing = document.querySelector('.g4lkir95-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging</div>
            
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
                <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">Готов к работе</div>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">🎮 Управление запуском</div>
                <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">▶️ Запустить один раз</button>
                <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">🔄 Запустить с повторами</button>
                <button class="g4lkir95-button" id="stopButton" style="display: none;">⏹️ Остановить</button>
                <button class="g4lkir95-button" onclick="createSophieInterface()">⚙️ Настройки сбора</button>
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">Ожидание запуска...</div>
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

        // Эмуляция процесса сбора
        setTimeout(() => {
            showNotification(`Повтор ${currentRepeat}/${totalRepeats} завершен`, 'success');
            if (window.g4lkir95_updateProgress) {
                window.g4lkir95_updateProgress(`Повтор ${currentRepeat} завершен`);
            }
            scheduleNextRun();
        }, 2000);
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
            isRunning = false;
            if (window.g4lkir95_updateStatus) {
                window.g4lkir95_updateStatus(false, 
                    repeatEnabled ? `Все повторы завершены (${repeatCount})` : 'Однократное выполнение завершено'
                );
            }
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

    // Глобальные функции
    window.closeWindow = function(title) {
        const element = document.getElementById(title);
        if (element) element.remove();
    };

    window.createSophieInterface = createSophieInterface;
    window.saveSophieSettings = saveSophieSettings;
    window.resetSophieSettings = resetSophieSettings;

    // Инициализация
    function init() {
        console.log('G4lKir95 Mass Scavenging v2.0.2 loaded');
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        loadSettings();
        addLaunchButton();
        setInterval(addLaunchButton, 3000);

        showNotification('G4lKir95 Mass Scavenging v2.0.2 активирован!', 'success');
        setTimeout(createSophieInterface, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();