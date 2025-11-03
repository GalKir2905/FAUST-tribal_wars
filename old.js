// ========== ИСПРАВЛЕННАЯ ЛОГИКА РАСПРЕДЕЛЕНИЯ ВОЙСК ==========

// Замените функцию calculateOptimalSquadsForVillage


// Новая функция для создания оптимального отряда


// Функция для расчета оставшихся войск


// Также обновите функцию распределения войск при парсинге
function distributeTroopsToUnits(units, availableTroops) {
    const enabledTroopTypes = worldUnits.filter(unit => troopTypesEnabled[unit.id]);
    
    if (enabledTroopTypes.length === 0) {
        addDebugLog('❌ Нет выбранных типов войск для распределения!', 'error');
        return;
    }
    
    // Рассчитываем общую вместимость выбранных типов
    const totalCapacity = enabledTroopTypes.reduce((sum, unit) => sum + unit.capacity, 0);
    
    addDebugLog(`Распределение ${availableTroops} войск по ${enabledTroopTypes.length} типам`, 'info');
    
    // УЛУЧШЕННОЕ РАСПРЕДЕЛЕНИЕ: пропорционально вместимости с минимумом
    let remainingTroops = availableTroops;
    const distributed = {};
    
    // Первый проход: базовое распределение
    enabledTroopTypes.forEach((unit, index) => {
        const share = unit.capacity / totalCapacity;
        let unitCount = Math.floor(availableTroops * share);
        
        // Гарантируем минимум 1 юнит каждого типа если есть достаточно войск
        if (unitCount === 0 && remainingTroops > 0 && enabledTroopTypes.length <= remainingTroops) {
            unitCount = 1;
        }
        
        // Не превышаем оставшиеся войска
        unitCount = Math.min(unitCount, remainingTroops);
        
        if (unitCount > 0) {
            distributed[unit.id] = unitCount;
            remainingTroops -= unitCount;
            addDebugLog(`  ${unit.name}: ${unitCount} (вместимость: ${unit.capacity})`, 'info');
        }
    });
    
    // Второй проход: распределяем оставшиеся войска
    if (remainingTroops > 0) {
        addDebugLog(`  Осталось нераспределенных войск: ${remainingTroops}`, 'info');
        
        // Распределяем пропорционально вместимости
        const totalDistributedCapacity = enabledTroopTypes.reduce((sum, unit) => {
            return sum + ((distributed[unit.id] || 0) * unit.capacity);
        }, 0);
        
        if (totalDistributedCapacity > 0) {
            enabledTroopTypes.forEach(unit => {
                if (remainingTroops <= 0) return;
                
                const currentCount = distributed[unit.id] || 0;
                const currentCapacity = currentCount * unit.capacity;
                const share = currentCapacity / totalDistributedCapacity;
                
                const additional = Math.min(
                    Math.floor(remainingTroops * share),
                    remainingTroops
                );
                
                if (additional > 0) {
                    distributed[unit.id] = currentCount + additional;
                    remainingTroops -= additional;
                    addDebugLog(`  Добавлено ${additional} ${unit.name}`, 'info');
                }
            });
        }
    }
    
    // Если все еще остались войска, добавляем к первому типу
    if (remainingTroops > 0 && enabledTroopTypes.length > 0) {
        const firstUnit = enabledTroopTypes[0].id;
        distributed[firstUnit] = (distributed[firstUnit] || 0) + remainingTroops;
        addDebugLog(`  Добавлено ${remainingTroops} к ${getUnitName(firstUnit)}`, 'info');
    }
    
    // Копируем распределенные значения в итоговый объект
    Object.assign(units, distributed);
    
    // Рассчитываем итоговую грузоподъемность
    const finalCapacity = calculateTotalCapacity(units);
    addDebugLog(`Итоговая грузоподъемность: ${finalCapacity}`, 'success');
    
    // Логируем итоговое распределение
    let totalDistributed = 0;
    Object.keys(distributed).forEach(unitId => {
        totalDistributed += distributed[unitId];
    });
    addDebugLog(`Всего распределено войск: ${totalDistributed}/${availableTroops}`, 
                totalDistributed === availableTroops ? 'success' : 'warning');
}