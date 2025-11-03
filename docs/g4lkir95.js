// ==UserScript==
// @name         FAUST Tribal Wars Mass Resource Collection
// @namespace    http://tampermonkey.net/
// @version      2.0
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

    // Конфигурация и настройки
    const CONFIG = {
        version: '2.0',
        debug: false,
        maxVillages: 100,
        defaultInterval: 60 // минут
    };

    // Хранилище данных
    const Storage = {
        get: (key, defaultValue = null) => {
            try {
                const value = GM_getValue(key);
                return value !== undefined ? value : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                GM_setValue(key, value);
                return true;
            } catch (e) {
                console.error('Ошибка сохранения:', e);
                return false;
            }
        }
    };

    // Утилиты
    const Utils = {
        log: (...args) => {
            if (CONFIG.debug) {
                console.log('[FAUST]', ...args);
            }
        },
        error: (...args) => {
            console.error('[FAUST]', ...args);
        },
        sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        parseNumber: (text) => parseInt(text.replace(/[^\d]/g, '')) || 0,
        formatTime: (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Основной класс скрипта
    class FaustMassCollection {
        constructor() {
            this.isRunning = false;
            this.currentIteration = 0;
            this.totalIterations = 1;
            this.intervalMinutes = CONFIG.defaultInterval;
            this.timerId = null;
            this.villages = [];
            this.init();
        }

        init() {
            Utils.log('Инициализация скрипта FAUST');
            this.loadSettings();
            this.createInterface();
            this.checkAutoStart();
        }

        loadSettings() {
            const settings = Storage.get('faust_settings', {});
            this.totalIterations = settings.totalIterations || 1;
            this.intervalMinutes = settings.intervalMinutes || CONFIG.defaultInterval;
            this.currentIteration = settings.currentIteration || 0;
        }

        saveSettings() {
            const settings = {
                totalIterations: this.totalIterations,
                intervalMinutes: this.intervalMinutes,
                currentIteration: this.currentIteration
            };
            Storage.set('faust_settings', settings);
        }

        createInterface() {
            // Создаем контейнер для интерфейса
            const container = document.createElement('div');
            container.id = 'faust-container';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 10px;
                background: #f5f5f5;
                border: 2px solid #8B4513;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                min-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
            `;

            container.innerHTML = `
                <div style="margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <h3 style="margin: 0 0 10px 0; color: #8B4513;">FAUST Массовый Сбор</h3>
                    <div style="font-size: 11px; color: #666;">Версия ${CONFIG.version}</div>
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Количество повторов:</label>
                    <input type="number" id="faust-iterations" min="1" value="${this.totalIterations}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Интервал (минуты):</label>
                    <input type="number" id="faust-interval" min="1" value="${this.intervalMinutes}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                </div>

                <div style="margin-bottom: 15px; font-size: 12px; color: #666;">
                    <div>Текущий запуск: <span id="faust-current-iteration">${this.currentIteration}</span> из <span id="faust-total-iterations">${this.totalIterations}</span></div>
                    <div>Следующий запуск: <span id="faust-next-run">-</span></div>
                </div>

                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                    <button id="faust-start-once" style="flex: 1; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Запуск 1 раз</button>
                    <button id="faust-start-repeat" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Запуск с повторами</button>
                </div>

                <div style="display: flex; gap: 5px;">
                    <button id="faust-stop" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">Остановить</button>
                    <button id="faust-reset" style="flex: 1; padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Сбросить</button>
                </div>

                <div id="faust-status" style="margin-top: 10px; padding: 8px; background: #e9ecef; border-radius: 4px; font-size: 12px; min-height: 20px;"></div>
            `;

            document.body.appendChild(container);

            // Назначаем обработчики событий
            this.attachEventListeners();
        }

        attachEventListeners() {
            document.getElementById('faust-start-once').addEventListener('click', () => {
                this.start(true);
            });

            document.getElementById('faust-start-repeat').addEventListener('click', () => {
                this.start(false);
            });

            document.getElementById('faust-stop').addEventListener('click', () => {
                this.stop();
            });

            document.getElementById('faust-reset').addEventListener('click', () => {
                this.reset();
            });

            document.getElementById('faust-iterations').addEventListener('change', (e) => {
                this.totalIterations = parseInt(e.target.value) || 1;
                this.saveSettings();
                this.updateUI();
            });

            document.getElementById('faust-interval').addEventListener('change', (e) => {
                this.intervalMinutes = parseInt(e.target.value) || CONFIG.defaultInterval;
                this.saveSettings();
                this.updateUI();
            });
        }

        updateUI() {
            document.getElementById('faust-current-iteration').textContent = this.currentIteration;
            document.getElementById('faust-total-iterations').textContent = this.totalIterations;
            
            const startOnceBtn = document.getElementById('faust-start-once');
            const startRepeatBtn = document.getElementById('faust-start-repeat');
            const stopBtn = document.getElementById('faust-stop');

            if (this.isRunning) {
                startOnceBtn.style.display = 'none';
                startRepeatBtn.style.display = 'none';
                stopBtn.style.display = 'block';
            } else {
                startOnceBtn.style.display = 'block';
                startRepeatBtn.style.display = 'block';
                stopBtn.style.display = 'none';
            }
        }

        setStatus(message, isError = false) {
            const statusEl = document.getElementById('faust-status');
            statusEl.textContent = message;
            statusEl.style.color = isError ? '#d32f2f' : '#333';
            statusEl.style.fontWeight = isError ? 'bold' : 'normal';
            Utils.log(message);
        }

        async start(singleRun = false) {
            if (this.isRunning) {
                this.setStatus('Скрипт уже запущен!', true);
                return;
            }

            this.isRunning = true;
            this.updateUI();

            if (singleRun) {
                this.totalIterations = 1;
                this.currentIteration = 0;
            }

            this.setStatus('Запуск массового сбора...');

            try {
                // Переходим на страницу массового сбора
                if (!await this.navigateToMassCollection()) {
                    this.setStatus('Ошибка перехода на страницу массового сбора', true);
                    this.stop();
                    return;
                }

                // Запускаем основной процесс
                await this.executeCollectionProcess();

            } catch (error) {
                Utils.error('Ошибка выполнения:', error);
                this.setStatus(`Ошибка: ${error.message}`, true);
                this.stop();
            }
        }

        async navigateToMassCollection() {
            try {
                const currentUrl = window.location.href;
                
                // Если уже на странице массового сбора, ничего не делаем
                if (currentUrl.includes('screen=place&mode=mass')) {
                    return true;
                }

                // Ищем ссылку на массовый сбор
                let massCollectionLink = document.querySelector('a[href*="screen=place&mode=mass"]');
                
                if (!massCollectionLink) {
                    // Если ссылка не найдена, пробуем перейти по прямому URL
                    const gameServer = window.location.hostname;
                    const gamePhp = window.location.pathname;
                    const massUrl = `https://${gameServer}${gamePhp}?screen=place&mode=mass`;
                    
                    window.location.href = massUrl;
                    await Utils.sleep(2000);
                    return true;
                }

                massCollectionLink.click();
                await Utils.sleep(2000);
                return true;

            } catch (error) {
                Utils.error('Ошибка навигации:', error);
                return false;
            }
        }

        async executeCollectionProcess() {
            while (this.isRunning && this.currentIteration < this.totalIterations) {
                this.currentIteration++;
                this.saveSettings();
                
                this.setStatus(`Запуск итерации ${this.currentIteration}/${this.totalIterations}`);

                try {
                    // Основная логика сбора ресурсов
                    const success = await this.performMassCollection();
                    
                    if (success) {
                        this.setStatus(`Итерация ${this.currentIteration} завершена успешно`);
                    } else {
                        this.setStatus(`Итерация ${this.currentIteration} завершена с ошибками`, true);
                    }

                } catch (error) {
                    Utils.error('Ошибка в итерации:', error);
                    this.setStatus(`Ошибка в итерации ${this.currentIteration}: ${error.message}`, true);
                }

                // Проверяем, нужно ли продолжать
                if (this.currentIteration < this.totalIterations && this.isRunning) {
                    const nextRunTime = new Date(Date.now() + this.intervalMinutes * 60000);
                    document.getElementById('faust-next-run').textContent = nextRunTime.toLocaleTimeString();
                    
                    this.setStatus(`Ожидание следующего запуска через ${this.intervalMinutes} минут...`);
                    
                    // Ждем указанное время
                    await this.waitWithInterrupt(this.intervalMinutes * 60000);
                    
                    // Перезагружаем страницу для следующей итерации
                    if (this.isRunning) {
                        window.location.reload();
                        await Utils.sleep(3000);
                    }
                }
            }

            if (this.currentIteration >= this.totalIterations) {
                this.setStatus('Все итерации завершены!');
                this.stop();
            }
        }

        async performMassCollection() {
            try {
                // Получаем список деревень
                const villages = this.getVillagesList();
                if (villages.length === 0) {
                    this.setStatus('Деревни не найдены', true);
                    return false;
                }

                this.setStatus(`Найдено деревень: ${villages.length}`);

                let totalCollections = 0;
                let totalResources = 0;

                // Обрабатываем каждую деревню
                for (const village of villages) {
                    if (!this.isRunning) break;

                    try {
                        const result = await this.collectFromVillage(village);
                        if (result) {
                            totalCollections++;
                            totalResources += result.resources;
                        }
                        
                        // Небольшая пауза между деревнями
                        await Utils.sleep(500);
                        
                    } catch (villageError) {
                        Utils.error(`Ошибка сбора в деревне ${village.name}:`, villageError);
                    }
                }

                this.setStatus(`Сбор завершен: ${totalCollections} деревень, собрано ресурсов: ${totalResources}`);
                return totalCollections > 0;

            } catch (error) {
                Utils.error('Ошибка массового сбора:', error);
                return false;
            }
        }

        getVillagesList() {
            const villages = [];
            
            try {
                // Ищем таблицу с деревнями
                const villagesTable = document.querySelector('#mass_collection_table table tbody');
                if (!villagesTable) {
                    Utils.log('Таблица деревень не найдена');
                    return villages;
                }

                const rows = villagesTable.querySelectorAll('tr');
                Utils.log(`Найдено строк: ${rows.length}`);

                rows.forEach((row, index) => {
                    try {
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 6) return;

                        // Извлекаем данные о деревне
                        const nameCell = cells[1];
                        const resourcesCell = cells[2];
                        const troopsCell = cells[3];
                        const actionCell = cells[4];

                        if (!nameCell || !resourcesCell || !troopsCell || !actionCell) return;

                        const villageName = nameCell.textContent.trim();
                        const resourcesText = resourcesCell.textContent;
                        const troopsText = troopsCell.textContent;

                        // Парсим количество ресурсов
                        const resources = Utils.parseNumber(resourcesText);

                        // Парсим количество войск
                        const troopsMatch = troopsText.match(/(\d+)\s*\/\s*(\d+)/);
                        const availableTroops = troopsMatch ? parseInt(troopsMatch[1]) : 0;
                        const totalTroops = troopsMatch ? parseInt(troopsMatch[2]) : 0;

                        // Находим кнопку сбора
                        const collectButton = actionCell.querySelector('.btn-collect') || 
                                            actionCell.querySelector('input[type="submit"]') ||
                                            actionCell.querySelector('button');

                        if (collectButton && availableTroops > 0 && resources > 0) {
                            villages.push({
                                index: index,
                                name: villageName,
                                resources: resources,
                                availableTroops: availableTroops,
                                totalTroops: totalTroops,
                                button: collectButton,
                                row: row
                            });
                        }

                    } catch (rowError) {
                        Utils.error(`Ошибка обработки строки ${index}:`, rowError);
                    }
                });

                Utils.log(`Обработано деревень: ${villages.length}`);
                
            } catch (error) {
                Utils.error('Ошибка получения списка деревень:', error);
            }

            return villages;
        }

        async collectFromVillage(village) {
            return new Promise((resolve, reject) => {
                try {
                    Utils.log(`Сбор в деревне: ${village.name}, ресурсы: ${village.resources}`);

                    // Создаем событие клика
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });

                    // Нажимаем кнопку сбора
                    village.button.dispatchEvent(clickEvent);

                    // Ждем обработки (упрощенный подход)
                    setTimeout(() => {
                        resolve({
                            village: village.name,
                            resources: village.resources,
                            success: true
                        });
                    }, 100);

                } catch (error) {
                    reject(error);
                }
            });
        }

        waitWithInterrupt(ms) {
            return new Promise((resolve) => {
                const startTime = Date.now();
                const checkInterval = 1000; // Проверяем каждую секунду

                const interval = setInterval(() => {
                    if (!this.isRunning) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }

                    const elapsed = Date.now() - startTime;
                    if (elapsed >= ms) {
                        clearInterval(interval);
                        resolve();
                    }
                }, checkInterval);
            });
        }

        stop() {
            this.isRunning = false;
            this.setStatus('Скрипт остановлен');
            this.updateUI();
            
            if (this.timerId) {
                clearTimeout(this.timerId);
                this.timerId = null;
            }
        }

        reset() {
            this.stop();
            this.currentIteration = 0;
            this.totalIterations = 1;
            this.intervalMinutes = CONFIG.defaultInterval;
            this.saveSettings();
            this.updateUI();
            this.setStatus('Состояние сброшено');
        }

        checkAutoStart() {
            const autoStart = Storage.get('faust_auto_start', false);
            if (autoStart) {
                Storage.set('faust_auto_start', false);
                setTimeout(() => this.start(false), 2000);
            }
        }
    }

    // Инициализация скрипта при загрузке страницы
    function initialize() {
        // Ждем полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new FaustMassCollection();
            });
        } else {
            new FaustMassCollection();
        }
    }

    // Запускаем инициализацию
    initialize();

})();