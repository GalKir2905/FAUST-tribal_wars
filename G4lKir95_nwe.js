// ==UserScript==
// @name         G4lKir95 TW Tools
// @namespace    http://tampermonkey.net/
// @version      1.7.6
// @description  Mass scavenging tools for Tribal Wars
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

    // Ждем загрузки скрипта Sophie
    function waitForSophieScript() {
        return new Promise((resolve) => {
            const checkScript = () => {
                // Проверяем наличие функций из скрипта Sophie
                if (typeof readyToSend !== 'undefined' && typeof getData !== 'undefined') {
                    resolve(true);
                } else {
                    setTimeout(checkScript, 500);
                }
            };
            checkScript();
        });
    }

    // Добавляем стили для нашего интерфейса
    const styles = `
        .g4lkir95-panel {
            position: fixed;
            top: 50px;
            right: 10px;
            width: 320px;
            background: #2c3e50;
            border: 2px solid #34495e;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
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
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Переменные для повторного запуска
    let repeatEnabled = false;
    let repeatCount = 1;
    let repeatInterval = 60;
    let currentRepeat = 0;
    let repeatTimer = null;
    let isRunning = false;

    // Загружаем настройки из localStorage
    function loadSettings() {
        const savedEnabled = localStorage.getItem('g4lkir95_repeatEnabled');
        const savedCount = localStorage.getItem('g4lkir95_repeatCount');
        const savedInterval = localStorage.getItem('g4lkir95_repeatInterval');
        
        if (savedEnabled !== null) repeatEnabled = savedEnabled === 'true';
        if (savedCount !== null) repeatCount = parseInt(savedCount) || 1;
        if (savedInterval !== null) repeatInterval = parseInt(savedInterval) || 60;
    }

    // Сохраняем настройки в localStorage
    function saveSettings() {
        localStorage.setItem('g4lkir95_repeatEnabled', repeatEnabled.toString());
        localStorage.setItem('g4lkir95_repeatCount', repeatCount.toString());
        localStorage.setItem('g4lkir95_repeatInterval', repeatInterval.toString());
    }

    // Функция для создания интерфейса
    function createInterface() {
        // Удаляем существующую панель если есть
        const existingPanel = document.querySelector('.g4lkir95-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.className = 'g4lkir95-panel';
        panel.innerHTML = `
            <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
            <div class="g4lkir95-header">G4lKir95 TW Tools v1.7.6</div>
            
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
            </div>

            <div class="g4lkir95-section">
                <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">
                    Ожидание запуска...
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Инициализируем элементы управления
        const repeatEnabledCheckbox = panel.querySelector('#repeatEnabled');
        const repeatCountInput = panel.querySelector('#repeatCount');
        const repeatIntervalInput = panel.querySelector('#repeatInterval');
        const startSingleBtn = panel.querySelector('#startSingle');
        const startRepeatBtn = panel.querySelector('#startRepeat');
        const stopBtn = panel.querySelector('#stopButton');
        const statusSection = panel.querySelector('#statusSection');
        const progressInfo = panel.querySelector('#progressInfo');

        // Устанавливаем значения
        repeatEnabledCheckbox.checked = repeatEnabled;
        repeatCountInput.value = repeatCount;
        repeatIntervalInput.value = repeatInterval;

        // Обработчики событий
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

        startSingleBtn.addEventListener('click', function() {
            startMassScavenging(false);
        });

        startRepeatBtn.addEventListener('click', function() {
            startMassScavenging(true);
        });

        stopBtn.addEventListener('click', function() {
            stopMassScavenging();
        });

        // Функция обновления статуса
        function updateStatus(isActive, message = '') {
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
            
            if (message) {
                progressInfo.textContent = message;
            }
        }

        // Функция обновления прогресса
        function updateProgress(message) {
            progressInfo.textContent = message;
            console.log('G4lKir95 Progress:', message);
        }

        // Сохраняем функции для глобального доступа
        window.g4lkir95_updateStatus = updateStatus;
        window.g4lkir95_updateProgress = updateProgress;
    }

    // Функция для отображения уведомлений
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

    // Основная функция запуска массового сбора
    function startMassScavenging(enableRepeat = false) {
        if (isRunning) {
            showNotification('Скрипт уже выполняется!', 'error');
            return;
        }

        // Проверяем, загружен ли скрипт Sophie
        if (typeof readyToSend === 'undefined') {
            showNotification('Скрипт Sophie не загружен! Сначала запустите основной скрипт.', 'error');
            return;
        }

        isRunning = true;
        repeatEnabled = enableRepeat;
        currentRepeat = 0;

        if (window.g4lkir95_updateStatus) {
            window.g4lkir95_updateStatus(true, 'Запуск массового сбора...');
        }

        // Сохраняем настройки
        saveSettings();

        // Запускаем процесс
        executeScavengingCycle();
    }

    // Остановка массового сбора
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

    // Выполнение одного цикла сбора
    function executeScavengingCycle() {
        if (!isRunning) return;

        currentRepeat++;
        const totalRepeats = repeatEnabled ? repeatCount : 1;

        if (window.g4lkir95_updateProgress) {
            window.g4lkir95_updateProgress(
                `Выполняется повтор ${currentRepeat} из ${totalRepeats}`
            );
        }

        console.log(`G4lKir95 TW Tools: Запуск массового сбора ${currentRepeat}/${totalRepeats}`);

        // Запускаем оригинальную функцию readyToSend из скрипта Sophie
        try {
            readyToSend();
            
            // Ждем завершения выполнения (это асинхронно, поэтому используем таймаут)
            setTimeout(() => {
                if (window.g4lkir95_updateProgress) {
                    window.g4lkir95_updateProgress(
                        `Повтор ${currentRepeat}/${totalRepeats} завершен`
                    );
                }

                // Проверяем, нужно ли выполнять следующий повтор
                if (repeatEnabled && currentRepeat < totalRepeats && isRunning) {
                    const intervalMs = repeatInterval * 60 * 1000;
                    
                    if (window.g4lkir95_updateProgress) {
                        window.g4lkir95_updateProgress(
                            `Следующий запуск через ${repeatInterval} минут...`
                        );
                    }

                    repeatTimer = setTimeout(() => {
                        executeScavengingCycle();
                    }, intervalMs);
                } else {
                    // Завершаем выполнение
                    isRunning = false;
                    if (window.g4lkir95_updateStatus) {
                        window.g4lkir95_updateStatus(
                            false, 
                            repeatEnabled ? 
                            `Все повторы завершены (${totalRepeats})` : 
                            'Однократное выполнение завершено'
                        );
                    }
                    
                    showNotification(
                        repeatEnabled ? 
                        `Массовый сбор завершен! Выполнено повторов: ${totalRepeats}` : 
                        'Массовый сбор завершен!', 
                        'success'
                    );
                }
            }, 5000); // Даем время на выполнение скрипта Sophie
            
        } catch (error) {
            console.error('G4lKir95 Error:', error);
            showNotification('Ошибка при выполнении сбора: ' + error.message, 'error');
            stopMassScavenging();
        }
    }

    // Функция для добавления кнопки запуска в интерфейс игры
    function addLaunchButton() {
        if (!document.querySelector('.g4lkir95-launch-btn')) {
            const launchBtn = document.createElement('button');
            launchBtn.className = 'g4lkir95-launch-btn';
            launchBtn.innerHTML = '🚀 G4lKir95 Tools';
            launchBtn.title = 'Открыть панель управления массовым сбором';

            launchBtn.addEventListener('click', function() {
                createInterface();
            });

            document.body.appendChild(launchBtn);
        }
    }

    // Инициализация
    function init() {
        console.log('G4lKir95 TW Tools v1.7.6 загружен');

        // Загружаем настройки
        loadSettings();

        // Добавляем кнопку запуска
        addLaunchButton();

        // Периодически проверяем и добавляем кнопку, если она пропала
        setInterval(addLaunchButton, 3000);

        // Показываем уведомление о загрузке
        setTimeout(() => {
            showNotification('G4lKir95 TW Tools v1.7.6 активирован!', 'success');
        }, 1000);
    }

    // Запускаем инициализацию когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();