function sendSquadToVillage(row, squad) {
    try {
        addDebugLog(`Отправка отряда в деревню ${squad.village_name}...`, 'info');
        
        // НОВЫЙ МЕТОД: поиск по классам option-
        const categoryElements = row.querySelectorAll('[class*="option-"]');
        addDebugLog(`Найдено элементов категорий: ${categoryElements.length}`, 'info');
        
        // Логируем все найденные элементы категорий
        categoryElements.forEach((element, index) => {
            const className = element.className || '';
            const text = element.textContent || '';
            addDebugLog(`Категория ${index}: class="${className}" text="${text.trim()}"`, 'info');
        });

        // Ищем нужную категорию по номеру
        const targetCategoryClass = `option-${squad.option_id}`;
        let categoryElement = null;

        for (let element of categoryElements) {
            if (element.className.includes(targetCategoryClass)) {
                // Проверяем, не заблокирована ли категория
                if (element.className.includes('option-locked') || 
                    element.className.includes('status-locked') ||
                    element.className.includes('status-unavailable')) {
                    addDebugLog(`Категория ${squad.option_id} заблокирована`, 'warning');
                    return false;
                }
                
                // Проверяем, активна ли категория
                if (element.className.includes('status-active') || 
                    element.className.includes('status-inactive')) {
                    categoryElement = element;
                    addDebugLog(`✅ Найдена категория ${squad.option_id}`, 'success');
                    break;
                }
            }
        }

        if (!categoryElement) {
            addDebugLog(`❌ Категория ${squad.option_id} не найдена или недоступна`, 'error');
            return false;
        }

        // Ищем кликабельный элемент внутри категории
        let clickableElement = categoryElement.querySelector('a, button, [onclick], .clickable');
        
        if (!clickableElement) {
            // Если нет отдельного кликабельного элемента, кликаем на саму категорию
            clickableElement = categoryElement;
        }

        // Кликаем на категорию
        addDebugLog(`Кликаем на категорию ${squad.option_id}...`, 'info');
        clickableElement.click();

        // Ждем обновления интерфейса
        setTimeout(() => {
            // Ищем кнопку отправки
            const sendButton = findSendButton(row);
            if (sendButton && !sendButton.disabled) {
                addDebugLog('✅ Найдена кнопка отправки, кликаем...', 'success');
                sendButton.click();
                
                // Успешная отправка
                setTimeout(() => {
                    showNotification(`Отряд отправлен: ${squad.village_name} -> ${squad.category_name}`, 'success');
                }, 500);
                
            } else {
                addDebugLog('❌ Кнопка отправки не найдена или заблокирована после выбора категории', 'error');
                
                // Альтернативная стратегия: ищем форму и отправляем ее
                const form = row.querySelector('form');
                if (form) {
                    addDebugLog('Пробуем отправить форму напрямую...', 'info');
                    form.submit();
                }
            }
        }, 1000);

        return true;
        
    } catch (e) {
        addDebugLog(`Ошибка при отправке: ${e.message}`, 'error');
        return false;
    }
}

// Дополнительно улучшим функцию поиска кнопки отправки
function findSendButton(row) {
    // Расширяем поиск кнопки отправки
    const buttons = row.querySelectorAll('button, input[type="submit"], input[type="button"]');
    
    // Приоритетные селекторы для кнопки отправки
    const sendButtonSelectors = [
        'input[value*="Отправить"]',
        'input[value*="Send"]', 
        'button[type="submit"]',
        '.btn-confirm',
        '.btn-send',
        '[class*="send"]',
        '[class*="submit"]'
    ];
    
    // Сначала ищем по приоритетным селекторам
    for (const selector of sendButtonSelectors) {
        const button = row.querySelector(selector);
        if (button && !button.disabled) {
            addDebugLog(`Найдена кнопка отправки через селектор: ${selector}`, 'success');
            return button;
        }
    }
    
    // Затем ищем по тексту
    for (let button of buttons) {
        const text = (button.textContent || button.value || '').toLowerCase().trim();
        const isSendButton = text === 'отправить' || 
                           text === 'send' || 
                           text === 'сбор' ||
                           text.includes('отправ') ||
                           text.includes('send');
        
        if (isSendButton && !button.disabled) {
            addDebugLog(`Найдена кнопка отправки по тексту: "${text}"`, 'success');
            return button;
        }
    }
    
    // Если не нашли, возвращаем первую доступную кнопку, которая не является категорией
    for (let button of buttons) {
        const text = (button.textContent || button.value || '').toLowerCase();
        const isCategoryButton = text.includes('+20%') || 
                               text.includes('premium') ||
                               button.className.includes('option-');
        
        if (!button.disabled && !isCategoryButton) {
            addDebugLog(`Используем альтернативную кнопку: "${text}"`, 'warning');
            return button;
        }
    }
    
    addDebugLog('❌ Не найдена подходящая кнопка отправки', 'error');
    return null;
}

// Также улучшим функцию определения категорий
function getRealCategoryOptions(row) {
    const options = {};
    
    try {
        addDebugLog('Поиск элементов управления категориями...', 'info');
        
        // НОВЫЙ МЕТОД: поиск по классам option-
        const categoryElements = row.querySelectorAll('[class*="option-"]');
        addDebugLog(`Найдено элементов категорий: ${categoryElements.length}`, 'info');
        
        for (let i = 1; i <= 4; i++) {
            let isAvailable = true;
            let isLocked = false;
            
            // Ищем элемент категории
            const categoryElement = Array.from(categoryElements).find(el => 
                el.className.includes(`option-${i}`)
            );
            
            if (categoryElement) {
                const className = categoryElement.className;
                
                // Определяем статус категории по классам
                isLocked = className.includes('option-locked') || 
                          className.includes('status-locked') ||
                          className.includes('status-unavailable');
                
                isAvailable = !isLocked && 
                            (className.includes('status-active') || 
                             className.includes('status-inactive'));
                
                addDebugLog(`Категория ${i}: ${isLocked ? 'заблокирована' : 'доступна'}`, 
                           isLocked ? 'warning' : 'success');
            } else {
                isAvailable = false;
                isLocked = true;
                addDebugLog(`Категория ${i}: не найдена`, 'warning');
            }
            
            options[i] = {
                is_locked: isLocked,
                scavenging_squad: null,
                available: isAvailable,
                name: categoryNames[i] || `Категория ${i}`
            };
        }
        
    } catch (e) {
        addDebugLog(`Ошибка определения категорий: ${e.message}`, 'error');
        // Резервные настройки
        for (let i = 1; i <= 4; i++) {
            options[i] = {
                is_locked: false,
                scavenging_squad: null,
                available: true,
                name: categoryNames[i] || `Категория ${i}`
            };
        }
    }
    
    return options;
}