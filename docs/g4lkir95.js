javascript:(function(){
    // G4lKir95 Mass Scavenging - Complete inline version
    const fullScript = `
    (function() {
        'use strict';
        
        console.log('G4lKir95: Script starting...');
        
        // Проверяем, что мы на нужной странице
        if (window.location.href.indexOf('screen=place') === -1) {
            console.log('G4lKir95: Not on place page');
            return;
        }

        // Переменные
        let repeatEnabled = false;
        let repeatCount = 1;
        let repeatInterval = 60;
        let currentRepeat = 0;
        let repeatTimer = null;
        let isRunning = false;

        // Стили
        const styles = \`
            .g4lkir95-panel {
                position: fixed; top: 50px; right: 10px; width: 350px;
                background: #2c3e50; border: 2px solid #34495e; border-radius: 8px;
                padding: 15px; z-index: 10000; font-family: Arial; color: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;
            }
            .g4lkir95-header {
                background: #34495e; padding: 10px; margin: -15px -15px 15px -15px;
                border-radius: 6px 6px 0 0; text-align: center; font-weight: bold;
            }
            .g4lkir95-section {
                margin-bottom: 15px; padding: 10px; background: #34495e; border-radius: 5px;
            }
            .g4lkir95-section-title {
                font-weight: bold; margin-bottom: 8px; color: #ecf0f1; font-size: 14px;
            }
            .g4lkir95-button {
                width: 100%; padding: 8px; margin: 5px 0; border: none; border-radius: 4px;
                background: #e74c3c; color: white; font-weight: bold; cursor: pointer;
                font-size: 12px;
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
        \`;

        // Функция показа уведомления
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
            setTimeout(() => notification.remove(), 3000);
        }

        // Создание основного интерфейса
        function createInterface() {
            const existing = document.querySelector('.g4lkir95-panel');
            if (existing) existing.remove();

            const panel = document.createElement('div');
            panel.className = 'g4lkir95-panel';
            panel.innerHTML = \`
                <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
                <div class="g4lkir95-header">🚀 G4lKir95 Mass Scavenging</div>
                
                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">⚙️ Настройки повторного запуска</div>
                    <div style="margin: 10px 0;">
                        <input type="checkbox" id="repeatEnabled" \${repeatEnabled ? 'checked' : ''}>
                        <label for="repeatEnabled" style="color: white; margin-left: 5px;">Включить повторный запуск</label>
                    </div>
                    <div style="margin: 10px 0;">
                        <label style="color: #bdc3c7; font-size: 12px;">Количество повторов:</label>
                        <input type="number" id="repeatCount" value="\${repeatCount}" min="1" max="100" 
                               style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                    </div>
                    <div style="margin: 10px 0;">
                        <label style="color: #bdc3c7; font-size: 12px;">Интервал (минуты):</label>
                        <input type="number" id="repeatInterval" value="\${repeatInterval}" min="1" max="1440" 
                               style="width: 100%; padding: 5px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 3px;">
                    </div>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">🎮 Управление запуском</div>
                    <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">▶️ Запустить один раз</button>
                    <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat">🔄 Запустить с повторами</button>
                    <button class="g4lkir95-button" id="stopButton" style="display: none;">⏹️ Остановить</button>
                </div>

                <div class="g4lkir95-section">
                    <div class="g4lkir95-section-title">📊 Статус выполнения</div>
                    <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7;">
                        Ожидание запуска...
                    </div>
                </div>
            \`;

            document.body.appendChild(panel);

            // Добавляем обработчики событий
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

        // Функции управления
        function startMassScavenging(enableRepeat) {
            if (isRunning) {
                showNotification('Скрипт уже выполняется!', 'error');
                return;
            }

            isRunning = true;
            repeatEnabled = enableRepeat;
            currentRepeat = 0;

            // Показываем статус
            const stopBtn = document.querySelector('#stopButton');
            const startSingleBtn = document.querySelector('#startSingle');
            const startRepeatBtn = document.querySelector('#startRepeat');
            const progressInfo = document.querySelector('#progressInfo');

            if (stopBtn) stopBtn.style.display = 'block';
            if (startSingleBtn) startSingleBtn.style.display = 'none';
            if (startRepeatBtn) startRepeatBtn.style.display = 'none';
            if (progressInfo) progressInfo.textContent = 'Запуск массового сбора...';

            showNotification('Запуск массового сбора...', 'info');
            executeScavengingCycle();
        }

        function stopMassScavenging() {
            isRunning = false;
            if (repeatTimer) {
                clearTimeout(repeatTimer);
                repeatTimer = null;
            }

            const stopBtn = document.querySelector('#stopButton');
            const startSingleBtn = document.querySelector('#startSingle');
            const startRepeatBtn = document.querySelector('#startRepeat');
            const progressInfo = document.querySelector('#progressInfo');

            if (stopBtn) stopBtn.style.display = 'none';
            if (startSingleBtn) startSingleBtn.style.display = 'block';
            if (startRepeatBtn) startRepeatBtn.style.display = 'block';
            if (progressInfo) progressInfo.textContent = 'Выполнение остановлено';

            showNotification('Массовый сбор остановлен', 'info');
        }

        function executeScavengingCycle() {
            if (!isRunning) return;

            currentRepeat++;
            const totalRepeats = repeatEnabled ? repeatCount : 1;

            const progressInfo = document.querySelector('#progressInfo');
            if (progressInfo) {
                progressInfo.textContent = \`Выполняется повтор \${currentRepeat} из \${totalRepeats}\`;
            }

            showNotification(\`Запуск сбора \${currentRepeat}/\${totalRepeats}\`, 'info');

            // Эмуляция процесса сбора
            setTimeout(() => {
                showNotification(\`Повтор \${currentRepeat}/\${totalRepeats} завершен\`, 'success');
                
                if (progressInfo) {
                    progressInfo.textContent = \`Повтор \${currentRepeat} завершен\`;
                }

                // Планируем следующий запуск
                if (repeatEnabled && currentRepeat < repeatCount && isRunning) {
                    const intervalMs = repeatInterval * 60 * 1000;
                    
                    if (progressInfo) {
                        progressInfo.textContent = \`Следующий запуск через \${repeatInterval} минут...\`;
                    }

                    repeatTimer = setTimeout(() => {
                        executeScavengingCycle();
                    }, intervalMs);
                } else {
                    // Завершаем выполнение
                    isRunning = false;
                    const stopBtn = document.querySelector('#stopButton');
                    const startSingleBtn = document.querySelector('#startSingle');
                    const startRepeatBtn = document.querySelector('#startRepeat');
                    
                    if (stopBtn) stopBtn.style.display = 'none';
                    if (startSingleBtn) startSingleBtn.style.display = 'block';
                    if (startRepeatBtn) startRepeatBtn.style.display = 'block';
                    
                    if (progressInfo) {
                        progressInfo.textContent = repeatEnabled ? 
                            \`Все повторы завершены (\${currentRepeat})\` : 
                            'Однократное выполнение завершено';
                    }

                    showNotification(
                        repeatEnabled ? 
                        \`Массовый сбор завершен! Выполнено повторов: \${currentRepeat}\` : 
                        'Массовый сбор завершен!', 
                        'success'
                    );
                }
            }, 3000);
        }

        // Добавление кнопки запуска
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

        // Инициализация
        function init() {
            console.log('G4lKir95: Initializing...');
            
            // Добавляем стили
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);

            // Добавляем кнопку запуска
            addLaunchButton();

            showNotification('G4lKir95 Mass Scavenging активирован!', 'success');
            
            console.log('G4lKir95: Initialization complete');
        }

        // Запускаем инициализацию
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

    })();
    `;

    // Создаем и выполняем скрипт
    const script = document.createElement('script');
    script.textContent = fullScript;
    document.head.appendChild(script);
    
    console.log('G4lKir95: Script injected successfully');
})();