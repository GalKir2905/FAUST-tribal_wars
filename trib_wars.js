// ==UserScript==
// @name         FAUST Tribal Wars Mass Scavenging v4.5
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Массовый сбор ресурсов с исправленными расчетами
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
    let debugLogs = [];

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

    // Названия категорий
    const categoryNames = {
        1: "Ленивые собиратели",
        2: "Быстрые собиратели", 
        3: "Находчивые собиратели",
        4: "Жадные собиратели"
    };

    // ========== СТИЛИ G4LKIR95 ==========
    // ... (стили остаются такими же)

    // ========== СИСТЕМА УВЕДОМЛЕНИЙ ==========
    // ... (функции уведомлений остаются такими же)

    // ========== СИСТЕМА ЛОГИРОВАНИЯ ==========
    // ... (функции логирования остаются такими же)

    // ========== ЗАГРУЗКА И СОХРАНЕНИЕ НАСТРОЕК ==========
    // ... (функции настроек остаются такими же)

    // ========== РЕАЛЬНАЯ ЛОГИКА MASS SCAVENGING ==========
    function readyToSend() {
        addDebugLog('Запуск реального массового сбора...', 'info');
        saveSettingsFromUI();
        
        if (!categoryEnabled.some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбрано ни одной категории сбора!', 'error');
            showNotification('Выберите хотя бы одну категории сбора!', 'error');
            return false;
        }

        if (!Object.values(troopTypesEnabled).some(enabled => enabled)) {
            addDebugLog('ОШИБКА: Не выбран ни один тип войск для отправки!', 'error');
            showNotification('Выберите хотя бы один тип войск для отправки!', 'error');
            return false;
        }
        
        addDebugLog('Проверка настроек завершена успешно', 'success');
        showNotification('Запуск реального массового сбора...', 'info');
        return startRealMassScavenging();
    }

    function startRealMassScavenging() {
        addDebugLog('Выполнение реального скрипта сбора...', 'info');
        updateProgress('🔍 Поиск деревень и местных войск...');
        
        const villageData = getVillageDataFromPage();
        if (!villageData || villageData.length === 0) {
            addDebugLog('ОШИБКА: Деревни не найдены!', 'error');
            showNotification('Не найдено деревень для сбора! Проверьте, что вы на странице массового сбора.', 'error');
            return false;
        }
        
        addDebugLog(`Найдено деревень: ${villageData.length}`, 'success');
        showNotification(`Найдено ${villageData.length} деревень для обработки`, 'info');
        updateProgress(`📊 Найдено ${villageData.length} деревень...`);
        
        const squads = calculateScavengingSquads(villageData);
        
        if (squads.length === 0) {
            addDebugLog('ОШИБКА: Не создано ни одного отряда для отправки!', 'error');
            showNotification('Нет подходящих отрядов для отправки! Проверьте настройки войск.', 'error');
            return false;
        }
        
        addDebugLog(`Создано отрядов: ${squads.length}`, 'success');
        showNotification(`Рассчитано ${squads.length} отрядов для отправки`, 'info');
        updateProgress(`🎯 Создано ${squads.length} отрядов...`);
        
        sendScavengingSquads(squads);
        
        return true;
    }

    function getVillageDataFromPage() {
        addDebugLog('Поиск данных о деревнях и местных войсках...', 'info');
        const villages = [];
        
        try {
            addDebugLog('=== ТОЧНЫЙ ПОИСК ИНТЕРФЕЙСА МАССОВОГО СБОРА ===', 'info');
            
            // Сначала ищем основной контейнер массового сбора
            const mainContainer = findMassScavengeContainer();
            if (!mainContainer) {
                addDebugLog('❌ Не найден контейнер массового сбора!', 'error');
                return villages;
            }
            
            addDebugLog('✅ Найден основной контейнер массового сбора', 'success');
            
            // Ищем реальные строки с деревнями для сбора
            const villageRows = findRealVillageRows(mainContainer);
            addDebugLog(`Найдено реальных строк с деревнями: ${villageRows.length}`, 'info');
            
            let processedVillages = 0;
            
            villageRows.forEach((row, index) => {
                try {
                    addDebugLog(`--- Обработка строки ${index} ---`, 'info');
                    
                    // Получаем данные деревни
                    const villageInfo = extractVillageInfoFromRow(row);
                    if (!villageInfo) {
                        addDebugLog(`Строка ${index}: не удалось извлечь информацию о деревне`, 'warning');
                        return;
                    }
                    
                    // Получаем информацию о войсках - ИСПРАВЛЕННАЯ ФУНКЦИЯ
                    const localUnits = getAccurateLocalUnitsFromRow(row, villageInfo.name);
                    
                    // Получаем опции категорий
                    const options = getRealCategoryOptions(row);
                    
                    villages.push({
                        id: villageInfo.id,
                        name: villageInfo.name,
                        has_rally_point: true,
                        units: localUnits,
                        options: options,
                        availableTroops: Object.values(localUnits).reduce((sum, count) => sum + count, 0),
                        row: row
                    });
                    
                    processedVillages++;
                    addDebugLog(`✅ Добавлена деревня: ${villageInfo.name}`, 'success');
                    
                } catch (e) {
                    addDebugLog(`Ошибка обработки строки ${index}: ${e.message}`, 'error');
                }
            });
            
            addDebugLog(`Всего обработано деревень: ${processedVillages}`, 'success');
            return villages;
        } catch (e) {
            addDebugLog(`Критическая ошибка получения данных: ${e.message}`, 'error');
            return [];
        }
    }

    // ... (функции findMassScavengeContainer, findRealVillageRows, isNavigationOrMenu, 
    // findVillageLinkWithCoords, hasScavengeControls, extractVillageInfoFromRow остаются такими же)

    function getAccurateLocalUnitsFromRow(row, villageName) {
        const units = {};
        
        try {
            // Инициализируем все юниты нулями
            worldUnits.forEach(unit => {
                units[unit.id] = 0;
            });
            
            addDebugLog(`Точный поиск войск для деревни: ${villageName}`, 'info');
            
            // Получаем весь текст строки для анализа
            const text = row.textContent;
            addDebugLog(`Текст строки: ${text.substring(0, 200)}...`, 'info');
            
            // Ищем реальное количество доступных войск
            let availableTroops = findRealAvailableTroops(row, text);
            
            // Если не нашли точное количество, используем альтернативные методы
            if (availableTroops === 0) {
                availableTroops = findTroopsByAlternativeMethods(row, text);
            }
            
            addDebugLog(`Определено доступных войск: ${availableTroops}`, 'success');
            
            // Распределяем войска пропорционально вместимости выбранных типов
            distributeTroopsToUnits(units, availableTroops);
            
            // Логируем результат
            Object.keys(units).forEach(unitType => {
                if (units[unitType] > 0) {
                    addDebugLog(`  ${getUnitName(unitType)}: ${units[unitType]}`, 'info');
                }
            });
            
        } catch (e) {
            addDebugLog(`Ошибка парсинга войск: ${e.message}`, 'error');
            // Устанавливаем значения по умолчанию при ошибке
            worldUnits.forEach(unit => {
                units[unit.id] = troopTypesEnabled[unit.id] ? 100 : 0;
            });
        }
        
        return units;
    }

    function findRealAvailableTroops(row, text) {
        let availableTroops = 0;
        
        // Паттерны для поиска количества войск в разных форматах
        const troopPatterns = [
            // Формат "доступно/всего" - берем первое число
            /(\d+)\s*\/\s*\d+/,
            // Формат "число доступно"
            /(\d+)\s+(?:доступно|available|в строю)/i,
            // Формат "Войска: число"
            /[Вв]ойска[:\s]*(\d+)/i,
            // Формат "Troops: число"  
            /[Tt]roops[:\s]*(\d+)/i,
            // Просто большие числа в контексте войск
            /(\d{3,})\s*(?:шт|units|войск)/i
        ];
        
        // Сначала ищем по паттернам
        for (const pattern of troopPatterns) {
            const match = text.match(pattern);
            if (match) {
                const foundTroops = parseInt(match[1]);
                if (foundTroops > 0) {
                    availableTroops = foundTroops;
                    addDebugLog(`Найдено войск по паттерну "${pattern}": ${availableTroops}`, 'success');
                    break;
                }
            }
        }
        
        // Если не нашли по паттернам, ищем таблицу с войсками
        if (availableTroops === 0) {
            availableTroops = findTroopsFromTable(row);
        }
        
        return availableTroops;
    }

    function findTroopsFromTable(row) {
        let availableTroops = 0;
        
        // Ищем таблицу с войсками внутри строки
        const troopTables = row.querySelectorAll('table');
        
        for (let table of troopTables) {
            const tableText = table.textContent;
            
            // Ищем числа в таблице, которые могут быть количеством войск
            const numbers = tableText.match(/\d+/g);
            if (numbers) {
                for (let num of numbers) {
                    const troopCount = parseInt(num);
                    // Предполагаем, что количество войск обычно в диапазоне 10-100000
                    if (troopCount >= 10 && troopCount <= 100000) {
                        availableTroops = troopCount;
                        addDebugLog(`Найдено войск из таблицы: ${availableTroops}`, 'success');
                        break;
                    }
                }
            }
            
            if (availableTroops > 0) break;
        }
        
        return availableTroops;
    }

    function findTroopsByAlternativeMethods(row, text) {
        let availableTroops = 0;
        
        // Метод 1: Ищем большие числа в тексте
        const numbers = text.match(/\d+/g);
        if (numbers) {
            // Сортируем числа по убыванию и берем самое большое разумное
            const largeNumbers = numbers.map(num => parseInt(num))
                .filter(num => num >= 50 && num <= 50000)
                .sort((a, b) => b - a);
                
            if (largeNumbers.length > 0) {
                availableTroops = largeNumbers[0];
                addDebugLog(`Найдено войск по большому числу: ${availableTroops}`, 'info');
            }
        }
        
        // Метод 2: Если все еще не нашли, используем эвристику
        if (availableTroops === 0) {
            // Для массового сбора обычно отправляют много войск
            availableTroops = 1000; // консервативное значение по умолчанию
            addDebugLog(`Используем войска по умолчанию: ${availableTroops}`, 'warning');
        }
        
        return availableTroops;
    }

    function distributeTroopsToUnits(units, availableTroops) {
        const enabledTroopTypes = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
        
        if (enabledTroopTypes.length === 0) {
            addDebugLog('❌ Нет выбранных типов войск для распределения!', 'error');
            return;
        }
        
        // Рассчитываем общую вместимость выбранных типов
        const totalCapacity = enabledTroopTypes.reduce((sum, unit) => sum + unit.capacity, 0);
        
        addDebugLog(`Распределение ${availableTroops} войск по ${enabledTroopTypes.length} типам`, 'info');
        
        // Распределяем пропорционально вместимости
        let remainingTroops = availableTroops;
        
        enabledTroopTypes.forEach((unit, index) => {
            if (remainingTroops <= 0) return;
            
            const share = unit.capacity / totalCapacity;
            let unitCount = Math.floor(availableTroops * share);
            
            // Гарантируем минимум 1 юнит каждого типа
            if (unitCount === 0 && remainingTroops > 0) {
                unitCount = 1;
            }
            
            // Не превышаем оставшиеся войска
            unitCount = Math.min(unitCount, remainingTroops);
            
            units[unit.id] = unitCount;
            remainingTroops -= unitCount;
            
            addDebugLog(`  ${unit.name}: ${unitCount} (вместимость: ${unit.capacity})`, 'info');
        });
        
        // Если остались нераспределенные войска, добавляем к первому типу
        if (remainingTroops > 0 && enabledTroopTypes.length > 0) {
            const firstUnit = enabledTroopTypes[0].id;
            units[firstUnit] += remainingTroops;
            addDebugLog(`  Добавлено ${remainingTroops} к ${getUnitName(firstUnit)}`, 'info');
        }
        
        // Рассчитываем итоговую грузоподъемность
        const finalCapacity = worldUnits.reduce((sum, unit) => {
            return sum + (units[unit.id] * unit.capacity);
        }, 0);
        
        addDebugLog(`Итоговая грузоподъемность: ${finalCapacity}`, 'success');
    }

    // ... (функции getRealCategoryOptions, getUnitName остаются такими же)

    function calculateScavengingSquads(villages) {
        addDebugLog(`Расчет отрядов для ${villages.length} деревень...`, 'info');
        const squads = [];
        
        villages.forEach(village => {
            const villageSquads = calculateSquadsForVillage(village);
            squads.push(...villageSquads);
        });
        
        addDebugLog(`Всего создано отрядов: ${squads.length}`, 'success');
        return squads;
    }

    function calculateSquadsForVillage(village) {
        const squads = [];
        const availableUnits = { ...village.units };
        
        addDebugLog(`=== Расчет для деревни: ${village.name} ===`, 'info');
        
        // Вычитаем backup из доступных войск
        worldUnits.forEach(unit => {
            const backup = keepHome[unit.id] || 0;
            availableUnits[unit.id] = Math.max(0, availableUnits[unit.id] - backup);
            if (backup > 0) {
                addDebugLog(`  Резерв для ${getUnitName(unit.id)}: ${backup}`, 'info');
            }
        });
        
        addDebugLog(`Войск после резерва:`, 'info');
        let totalAvailable = 0;
        Object.keys(availableUnits).forEach(unit => {
            if (availableUnits[unit] > 0) {
                addDebugLog(`  ${getUnitName(unit)}: ${availableUnits[unit]}`, 'info');
                totalAvailable += availableUnits[unit];
            }
        });
        
        if (totalAvailable === 0) {
            addDebugLog(`❌ В деревне "${village.name}" нет доступных войск после вычета резерва`, 'warning');
            return squads;
        }
        
        // Рассчитываем общую доступную грузоподъемность
        const totalAvailableCapacity = worldUnits.reduce((sum, unit) => {
            return sum + (availableUnits[unit.id] * unit.capacity);
        }, 0);
        
        addDebugLog(`Общая грузоподъемность: ${totalAvailableCapacity}`, 'success');
        
        // Пробуем отправить отряды по категориям в порядке приоритета
        const categoriesToTry = prioritiseHighCat ? [4, 3, 2, 1] : [1, 2, 3, 4];
        
        for (let cat of categoriesToTry) {
            if (categoryEnabled[cat-1] && village.options[cat] && 
                !village.options[cat].is_locked && village.options[cat].available) {
                
                const requiredCapacity = calculateRequiredCapacity(cat);
                
                addDebugLog(`Проверка категории ${village.options[cat].name}: требуется ${requiredCapacity}`, 'info');
                
                // Проверяем, достаточно ли грузоподъемности для этой категории
                if (totalAvailableCapacity >= requiredCapacity) {
                    const squad = calculateSquadForCategory(availableUnits, cat);
                    if (squad && hasUnits(squad)) {
                        squads.push({
                            village_id: village.id,
                            candidate_squad: squad,
                            option_id: cat,
                            use_premium: false,
                            village_name: village.name,
                            category_name: village.options[cat].name
                        });
                        
                        addDebugLog(`✅ Создан отряд для "${village.name}" -> ${village.options[cat].name}`, 'success');
                        
                        // Вычитаем использованные войска
                        subtractSquadFromAvailable(availableUnits, squad);
                        
                        // Пересчитываем оставшуюся грузоподъемность
                        const remainingCapacity = worldUnits.reduce((sum, unit) => {
                            return sum + (availableUnits[unit.id] * unit.capacity);
                        }, 0);
                        
                        addDebugLog(`Оставшаяся грузоподъемность: ${remainingCapacity}`, 'info');
                        
                        // Если осталось мало войск, прекращаем для этой деревни
                        if (remainingCapacity < calculateRequiredCapacity(1)) {
                            addDebugLog(`Оставшейся грузоподъемности недостаточно даже для минимальной категории`, 'info');
                            break;
                        }
                    } else {
                        addDebugLog(`❌ Не удалось создать отряд для "${village.name}" -> ${village.options[cat].name}`, 'warning');
                    }
                } else {
                    addDebugLog(`❌ Недостаточно грузоподъемности для "${village.name}" -> ${village.options[cat].name} (${totalAvailableCapacity}/${requiredCapacity})`, 'warning');
                }
            } else {
                const reason = !categoryEnabled[cat-1] ? 'отключена в настройках' : 
                             village.options[cat].is_locked ? 'заблокирована' : 'недоступна';
                addDebugLog(`Категория ${village.options[cat].name} для "${village.name}" пропущена: ${reason}`, 'warning');
            }
        }
        
        return squads;
    }

    function calculateSquadForCategory(availableUnits, category) {
        const squad = {};
        let totalCapacity = 0;
        
        const requiredCapacity = calculateRequiredCapacity(category);
        
        addDebugLog(`Расчет отряда для категории ${categoryNames[category]}: требуется ${requiredCapacity}`, 'info');
        
        const enabledUnits = worldUnits.filter(unit => troopTypesEnabled[unit.id] && availableUnits[unit.id] > 0);
        if (enabledUnits.length === 0) {
            addDebugLog('❌ Нет доступных выбранных типов войск', 'error');
            return null;
        }
        
        // Сортируем юниты по эффективности (вместимость)
        const unitOrder = enabledUnits.sort((a, b) => b.capacity - a.capacity);
        
        addDebugLog(`Доступные типы войск: ${unitOrder.map(u => u.name).join(', ')}`, 'info');
        
        for (const unit of unitOrder) {
            if (availableUnits[unit.id] > 0 && totalCapacity < requiredCapacity) {
                const unitCapacity = unit.capacity;
                const maxUnits = availableUnits[unit.id];
                const neededCapacity = requiredCapacity - totalCapacity;
                const neededUnits = Math.min(maxUnits, Math.ceil(neededCapacity / unitCapacity));
                
                if (neededUnits > 0) {
                    squad[unit.id] = neededUnits;
                    totalCapacity += neededUnits * unitCapacity;
                    addDebugLog(`  Добавлено ${neededUnits} ${unit.name} (вместимость: ${unit.capacity})`, 'info');
                }
            }
        }
        
        const capacityStatus = totalCapacity >= requiredCapacity ? 'success' : 'warning';
        addDebugLog(`Итоговый отряд: грузоподъемность ${totalCapacity}/${requiredCapacity}`, capacityStatus);
        
        return totalCapacity >= requiredCapacity ? squad : null;
    }

    function calculateRequiredCapacity(category) {
        const baseCapacity = [1000, 2500, 5000, 10000][category-1] || 1000;
        const timeFactor = category <= 2 ? time.def : time.off;
        return baseCapacity * timeFactor;
    }

    function hasUnits(squad) {
        const has = squad && Object.values(squad).some(count => count > 0);
        return has;
    }

    function subtractSquadFromAvailable(availableUnits, squad) {
        Object.keys(squad).forEach(unit => {
            availableUnits[unit] = Math.max(0, availableUnits[unit] - squad[unit]);
        });
    }

    // ========== ОТПРАВКА ОТРЯДОВ ==========
    // ... (функции отправки остаются такими же)

    // ========== ИНТЕРФЕЙС И УПРАВЛЕНИЕ ==========
    // ... (остальные функции интерфейса остаются такими же)

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function init() {
        console.log('G4lKir95: Initializing v4.5 with improved calculations...');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        loadSophieSettings();
        addLaunchButton();
        setTimeout(createInterface, 500);
        addDebugLog('G4lKir95 Mass Scavenging v4.5 активирован! Улучшенные расчеты.', 'success');
        showNotification('G4lKir95 Mass Scavenging v4.5 активирован!', 'success');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();