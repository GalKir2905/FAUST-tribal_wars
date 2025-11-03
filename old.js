



// Обновите функцию saveSettingsFromUI для новых элементов
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
}

// Удалите старую функцию toggleCategory так как она больше не нужна
// window.toggleCategory = toggleCategory; // Эту строку можно удалить