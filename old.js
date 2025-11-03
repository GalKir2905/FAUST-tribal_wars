// ========== УПРОЩЕННЫЙ ИНТЕРФЕЙС ==========
function createSettingsInterface() {
    return `
        <div class="g4lkir95-section">
            <div class="g4lkir95-section-title">🎯 Настройки войск</div>
            <div style="margin-bottom: 10px; font-size: 11px; color: #bdc3c7;">
                Выберите типы войск для отправки
            </div>
            <div class="units-grid" id="unitsContainer"></div>
        </div>

        <div class="g4lkir95-section">
            <div class="g4lkir95-section-title">📊 Категории сбора</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" id="cat_1" ${categoryEnabled[0] ? 'checked' : ''} style="margin-right: 8px;">
                    <label for="cat_1" style="color: white; font-size: 12px;">${categoryNames[1]}</label>
                </div>
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" id="cat_2" ${categoryEnabled[1] ? 'checked' : ''} style="margin-right: 8px;">
                    <label for="cat_2" style="color: white; font-size: 12px;">${categoryNames[2]}</label>
                </div>
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" id="cat_3" ${categoryEnabled[2] ? 'checked' : ''} style="margin-right: 8px;">
                    <label for="cat_3" style="color: white; font-size: 12px;">${categoryNames[3]}</label>
                </div>
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" id="cat_4" ${categoryEnabled[3] ? 'checked' : ''} style="margin-right: 8px;">
                    <label for="cat_4" style="color: white; font-size: 12px;">${categoryNames[4]}</label>
                </div>
            </div>
        </div>

        <div class="g4lkir95-section">
            <div class="g4lkir95-section-title">⚙️ Дополнительные настройки</div>
            <div style="margin: 10px 0;">
                <input type="checkbox" id="priority_high" ${prioritiseHighCat ? 'checked' : ''}>
                <label for="priority_high" style="color: white; margin-left: 5px; font-size: 12px;">
                    Приоритет высших категорий
                </label>
            </div>
            <div style="margin: 10px 0;">
                <input type="checkbox" id="repeatEnabled" ${repeatEnabled ? 'checked' : ''}>
                <label for="repeatEnabled" style="color: white; margin-left: 5px; font-size: 12px;">
                    Повторный запуск
                </label>
            </div>
            <div id="repeatSettings" style="${repeatEnabled ? '' : 'display: none;'} margin: 10px 0; padding: 10px; background: #2c3e50; border-radius: 4px;">
                <div style="margin-bottom: 8px;">
                    <label style="color: #bdc3c7; font-size: 11px; display: block;">Количество повторов:</label>
                    <input type="number" id="repeatCount" value="${repeatCount}" min="1" max="100" style="width: 100%; padding: 4px; background: #34495e; color: white; border: 1px solid #7f8c8d; border-radius: 3px; font-size: 11px;">
                </div>
                <div>
                    <label style="color: #bdc3c7; font-size: 11px; display: block;">Интервал (минуты):</label>
                    <input type="number" id="repeatInterval" value="${repeatInterval}" min="1" max="1440" style="width: 100%; padding: 4px; background: #34495e; color: white; border: 1px solid #7f8c8d; border-radius: 3px; font-size: 11px;">
                </div>
            </div>
        </div>

        <div class="g4lkir95-section">
            <div class="g4lkir95-section-title">🎮 Управление</div>
            <button class="g4lkir95-button g4lkir95-button-success" id="startSingle">
                ▶️ Запустить сбор
            </button>
            <button class="g4lkir95-button g4lkir95-button-warning" id="startRepeat" style="${repeatEnabled ? '' : 'display: none;'}">
                🔄 Запустить с повторами
            </button>
            <button class="g4lkir95-button" id="stopButton" style="display: none;">
                ⏹️ Остановить
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                <button class="g4lkir95-button" onclick="window.g4lkir95SaveSettings()" style="font-size: 11px; padding: 6px;">
                    💾 Сохранить
                </button>
                <button class="g4lkir95-button" onclick="window.g4lkir95ClearLogs()" style="font-size: 11px; padding: 6px;">
                    🗑️ Очистить логи
                </button>
            </div>
        </div>

        <div class="g4lkir95-section">
            <div class="g4lkir95-section-title">📊 Статус выполнения</div>
            <div id="statusSection" class="g4lkir95-status g4lkir95-status-inactive">Готов к работе</div>
            <div id="progressInfo" style="font-size: 11px; text-align: center; color: #bdc3c7; margin: 10px 0; padding: 8px; background: #2c3e50; border-radius: 4px;">
                Ожидание запуска...
            </div>
            <div class="g4lkir95-section-title">🔍 Логи выполнения</div>
            <div class="debug-logs" id="debugLogs"></div>
        </div>
    `;
}

// Обновите функцию createInterface для правильной инициализации
function createInterface() {
    const existing = document.querySelector('.g4lkir95-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.className = 'g4lkir95-panel';
    panel.innerHTML = `
        <button class="g4lkir95-close" onclick="this.parentElement.remove()">×</button>
        <div class="g4lkir95-header">🚀 Mass Scavenging v4.9.5</div>
        ${createSettingsInterface()}
    `;

    document.body.appendChild(panel);
    createUnitsInterface();
    updateDebugLogsDisplay();

    // Инициализация обработчиков событий
    initializeEventHandlers(panel);
}

// Новая функция для инициализации обработчиков событий
function initializeEventHandlers(panel) {
    // Обработчики для категорий
    for (let i = 1; i <= 4; i++) {
        const checkbox = panel.querySelector('#cat_' + i);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                categoryEnabled[i-1] = this.checked;
                addDebugLog(`Категория ${i} ${this.checked ? 'включена' : 'выключена'}`, 'info');
            });
        }
    }

    // Обработчик для приоритета категорий
    const priorityCheckbox = panel.querySelector('#priority_high');
    if (priorityCheckbox) {
        priorityCheckbox.addEventListener('change', function() {
            prioritiseHighCat = this.checked;
            addDebugLog(`Приоритет высших категорий ${this.checked ? 'включен' : 'выключен'}`, 'info');
        });
    }

    // Обработчики для повторного запуска
    const repeatEnabledEl = panel.querySelector('#repeatEnabled');
    const repeatCountEl = panel.querySelector('#repeatCount');
    const repeatIntervalEl = panel.querySelector('#repeatInterval');
    const repeatSettingsEl = panel.querySelector('#repeatSettings');
    const startRepeatEl = panel.querySelector('#startRepeat');

    if (repeatEnabledEl) {
        repeatEnabledEl.addEventListener('change', function() {
            repeatEnabled = this.checked;
            if (repeatSettingsEl) {
                repeatSettingsEl.style.display = this.checked ? 'block' : 'none';
            }
            if (startRepeatEl) {
                startRepeatEl.style.display = this.checked ? 'block' : 'none';
            }
            addDebugLog(`Повторный запуск ${this.checked ? 'включен' : 'выключен'}`, 'info');
        });
    }

    if (repeatCountEl) {
        repeatCountEl.addEventListener('change', function() {
            repeatCount = parseInt(this.value) || 1;
            addDebugLog(`Количество повторов установлено: ${repeatCount}`, 'info');
        });
    }
    
    if (repeatIntervalEl) {
        repeatIntervalEl.addEventListener('change', function() {
            repeatInterval = parseInt(this.value) || 60;
            addDebugLog(`Интервал установлен: ${repeatInterval} минут`, 'info');
        });
    }

    // Обработчики для кнопок управления
    const startSingleEl = panel.querySelector('#startSingle');
    const stopButtonEl = panel.querySelector('#stopButton');

    if (startSingleEl) {
        startSingleEl.addEventListener('click', function() {
            addDebugLog('Запуск одиночного сбора...', 'info');
            startMassScavenging(false);
        });
    }
    
    if (startRepeatEl) {
        startRepeatEl.addEventListener('click', function() {
            addDebugLog('Запуск сбора с повторами...', 'info');
            startMassScavenging(true);
        });
    }
    
    if (stopButtonEl) {
        stopButtonEl.addEventListener('click', function() {
            addDebugLog('Остановка сбора...', 'info');
            stopMassScavenging();
        });
    }
}

// Обновите функцию saveSettingsFromUI
function saveSettingsFromUI() {
    try {
        // Сохраняем настройки войск
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
        
        // Сохраняем настройки категорий из чекбоксов
        for (let i = 1; i <= 4; i++) {
            const checkbox = document.getElementById('cat_' + i);
            if (checkbox) {
                categoryEnabled[i-1] = checkbox.checked;
            }
        }
        
        // Сохраняем настройку приоритета
        const priorityCheckbox = document.getElementById('priority_high');
        if (priorityCheckbox) {
            prioritiseHighCat = priorityCheckbox.checked;
        }
        
        // Сохраняем настройки повторного запуска
        const repeatEnabledCheckbox = document.getElementById('repeatEnabled');
        if (repeatEnabledCheckbox) {
            repeatEnabled = repeatEnabledCheckbox.checked;
        }
        
        const repeatCountInput = document.getElementById('repeatCount');
        if (repeatCountInput) {
            repeatCount = parseInt(repeatCountInput.value) || 1;
        }
        
        const repeatIntervalInput = document.getElementById('repeatInterval');
        if (repeatIntervalInput) {
            repeatInterval = parseInt(repeatIntervalInput.value) || 60;
        }
        
        addDebugLog('Настройки сохранены из интерфейса', 'success');
    } catch (e) {
        addDebugLog('Ошибка сохранения настроек из интерфейса: ' + e.message, 'error');
    }
}

// Убедитесь что функция readyToSend вызывает saveSettingsFromUI
function readyToSend() {
    addDebugLog('Запуск реального массового сбора...', 'info');
    
    // ВАЖНО: Сохраняем настройки перед запуском
    saveSettingsFromUI();
    
    // Проверяем что выбраны категории
    if (!categoryEnabled.some(enabled => enabled)) {
        addDebugLog('ОШИБКА: Не выбрано ни одной категории сбора!', 'error');
        showNotification('Выберите хотя бы одну категорию сбора!', 'error');
        return false;
    }

    // Проверяем что выбраны типы войск
    if (!Object.values(troopTypesEnabled).some(enabled => enabled)) {
        addDebugLog('ОШИБКА: Не выбран ни один тип войск для отправки!', 'error');
        showNotification('Выберите хотя бы один тип войск для отправки!', 'error');
        return false;
    }
    
    addDebugLog('Проверка настроек завершена успешно', 'success');
    showNotification('Запуск реального массового сбора...', 'info');
    return startRealMassScavenging();
}

// Добавьте отладочную информацию в функцию запуска
function startMassScavenging(enableRepeat) {
    if (isRunning) {
        showNotification('Скрипт уже выполняется!', 'error');
        return;
    }

    isRunning = true;
    repeatEnabled = enableRepeat;
    currentRepeat = 0;

    // Логируем текущие настройки для отладки
    addDebugLog('=== ТЕКУЩИЕ НАСТРОЙКИ ===', 'info');
    addDebugLog(`Категории: ${categoryEnabled.map((enabled, i) => enabled ? categoryNames[i+1] : null).filter(Boolean).join(', ')}`, 'info');
    addDebugLog(`Типы войск: ${worldUnits.filter(unit => troopTypesEnabled[unit.id]).map(unit => unit.name).join(', ')}`, 'info');
    addDebugLog(`Приоритет высших категорий: ${prioritiseHighCat}`, 'info');
    addDebugLog(`Повторный запуск: ${repeatEnabled}`, 'info');

    updateUIStatus(true, 'Запуск реального массового сбора...');
    showNotification('Запуск РЕАЛЬНОГО массового сбора...', 'info');
    
    loadSophieSettings();
    executeScavengingCycle();
}