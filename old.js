// Улучшенная функция отправки отрядов с активацией категорий
function sendSquadToVillage(row, squad) {
    try {
        addDebugLog(`Отправка отряда в деревню ${squad.village_name}...`, 'info');
        
        // Находим все элементы категорий
        const categoryElements = row.querySelectorAll('[class*="option-"]');
        addDebugLog(`Найдено элементов категорий: ${categoryElements.length}`, 'info');
        
        // Логируем статусы всех категорий
        categoryElements.forEach((element, index) => {
            const className = element.className || '';
            const text = element.textContent || '';
            addDebugLog(`Категория ${index}: class="${className}" text="${text.trim()}"`, 'info');
        });

        // Ищем нужную категорию по номеру
        const targetCategoryClass = `option-${squad.option_id}`;
        let categoryElement = null;

        for (let element of categoryElements) {
            if (element.className.includes(targetCategoryClass) && 
                !element.className.includes('header-option')) {
                categoryElement = element;
                addDebugLog(`✅ Найдена категория ${squad.option_id}: ${element.className}`, 'success');
                break;
            }
        }

        if (!categoryElement) {
            addDebugLog(`❌ Категория ${squad.option_id} не найдена`, 'error');
            return false;
        }

        // Анализируем статус категории
        const className = categoryElement.className;
        const isLocked = className.includes('option-locked');
        const isInactive = className.includes('option-inactive');
        const isActive = className.includes('option-active');

        addDebugLog(`Статус категории: locked=${isLocked}, inactive=${isInactive}, active=${isActive}`, 'info');

        if (isLocked) {
            addDebugLog(`❌ Категория ${squad.option_id} заблокирована`, 'warning');
            return false;
        }

        // Если категория неактивна, нужно ее активировать
        if (isInactive) {
            addDebugLog(`🔄 Активируем категорию ${squad.option_id}...`, 'info');
            
            // Ищем кликабельный элемент для активации
            let clickableElement = categoryElement.querySelector('a, button, [onclick], .clickable');
            if (!clickableElement) {
                clickableElement = categoryElement;
            }

            // Кликаем для активации категории
            clickableElement.click();
            addDebugLog(`✅ Клик для активации категории ${squad.option_id}`, 'success');
            
            // Ждем активации
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Проверяем, активировалась ли категория
            const updatedClass = categoryElement.className;
            if (updatedClass.includes('option-active')) {
                addDebugLog(`✅ Категория ${squad.option_id} успешно активирована`, 'success');
            } else {
                addDebugLog(`⚠️ Категория ${squad.option_id} все еще неактивна`, 'warning');
            }
        }

        // Теперь отправляем отряд
        return sendActivatedCategory(row, squad, categoryElement);
        
    } catch (e) {
        addDebugLog(`Ошибка при отправке: ${e.message}`, 'error');
        return false;
    }
}

// Функция для отправки уже активированной категории
function sendActivatedCategory(row, squad, categoryElement) {
    return new Promise((resolve) => {
        addDebugLog(`Отправка активированной категории ${squad.option_id}...`, 'info');

        // Ждем немного для стабилизации интерфейса
        setTimeout(() => {
            // Ищем кнопку отправки
            const sendButton = findSendButton(row);
            
            if (sendButton && !sendButton.disabled) {
                addDebugLog('✅ Найдена активная кнопка отправки', 'success');
                
                // Кликаем на кнопку отправки
                sendButton.click();
                addDebugLog(`✅ Отряд отправлен: ${squad.village_name} -> ${squad.category_name}`, 'success');
                
                resolve(true);
            } else {
                addDebugLog('❌ Кнопка отправки не найдена или заблокирована', 'error');
                
                // Альтернативная стратегия: ищем форму отправки
                const form = findScavengeForm(row);
                if (form) {
                    addDebugLog('Пробуем отправить форму напрямую...', 'info');
                    form.submit();
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        }, 1500);
    });
}

// Функция поиска формы отправки
function findScavengeForm(row) {
    const forms = row.querySelectorAll('form');
    for (let form of forms) {
        if (form.action.includes('scavenge') || form.innerHTML.includes('scavenge')) {
            return form;
        }
    }
    
    // Ищем форму по содержанию
    const allForms = document.querySelectorAll('form');
    for (let form of allForms) {
        const html = form.innerHTML;
        if (html.includes('option-') && html.includes('собиратели')) {
            return form;
        }
    }
    
    return null;
}

// Улучшенная функция определения статуса категорий
function getRealCategoryOptions(row) {
    const options = {};
    
    try {
        addDebugLog('Поиск элементов управления категориями...', 'info');
        
        const categoryElements = row.querySelectorAll('[class*="option-"]');
        addDebugLog(`Найдено элементов категорий: ${categoryElements.length}`, 'info');
        
        for (let i = 1; i <= 4; i++) {
            let isAvailable = false;
            let isLocked = false;
            let isActive = false;
            
            // Ищем основной элемент категории (не header)
            const categoryElement = Array.from(categoryElements).find(el => 
                el.className.includes(`option-${i}`) && 
                !el.className.includes('header-option')
            );
            
            if (categoryElement) {
                const className = categoryElement.className;
                
                // Определяем статус по классам
                isLocked = className.includes('option-locked');
                isActive = className.includes('option-active');
                isAvailable = !isLocked && (isActive || className.includes('option-inactive'));
                
                addDebugLog(`Категория ${i}: locked=${isLocked}, active=${isActive}, available=${isAvailable}`, 
                           isAvailable ? 'success' : 'warning');
            } else {
                addDebugLog(`Категория ${i}: не найдена`, 'warning');
            }
            
            options[i] = {
                is_locked: isLocked,
                is_active: isActive,
                scavenging_squad: null,
                available: isAvailable && categoryEnabled[i-1],
                name: categoryNames[i] || `Категория ${i}`
            };
        }
        
    } catch (e) {
        addDebugLog(`Ошибка определения категорий: ${e.message}`, 'error');
        // Резервные настройки
        for (let i = 1; i <= 4; i++) {
            options[i] = {
                is_locked: false,
                is_active: true,
                scavenging_squad: null,
                available: categoryEnabled[i-1],
                name: categoryNames[i] || `Категория ${i}`
            };
        }
    }
    
    return options;
}

// Добавьте эту функцию для диагностики кликабельности
function testCategoryClickability(row, categoryId) {
    return new Promise((resolve) => {
        const categoryElement = row.querySelector(`[class*="option-${categoryId}"]`);
        if (!categoryElement) {
            resolve(false);
            return;
        }
        
        // Добавляем временный обработчик для отслеживания кликов
        const clickHandler = () => {
            addDebugLog(`✅ Категория ${categoryId} кликабельна!`, 'success');
            resolve(true);
        };
        
        categoryElement.addEventListener('click', clickHandler, { once: true });
        
        // Кликаем на категорию
        categoryElement.click();
        
        // Ждем реакции
        setTimeout(() => {
            categoryElement.removeEventListener('click', clickHandler);
            resolve(false);
        }, 1000);
    });
}

// Обновите функцию отправки с дополнительной диагностикой
async function sendSquadToVillage(row, squad) {
    try {
        addDebugLog(`Отправка отряда в деревню ${squad.village_name}...`, 'info');
        
        // ДИАГНОСТИКА: тестируем кликабельность категорий
        addDebugLog('=== ДИАГНОСТИКА КЛИКАБЕЛЬНОСТИ ===', 'info');
        const isClickable = await testCategoryClickability(row, squad.option_id);
        
        if (!isClickable) {
            addDebugLog(`❌ Категория ${squad.option_id} не кликабельна`, 'error');
            return false;
        }
        
        // Основная логика отправки...
        const categoryElements = row.querySelectorAll('[class*="option-"]');
        const targetCategoryClass = `option-${squad.option_id}`;
        let categoryElement = null;

        for (let element of categoryElements) {
            if (element.className.includes(targetCategoryClass) && 
                !element.className.includes('header-option')) {
                categoryElement = element;
                break;
            }
        }

        if (!categoryElement) {
            return false;
        }

        // Кликаем на категорию для активации
        categoryElement.click();
        addDebugLog(`✅ Категория ${squad.option_id} активирована`, 'success');

        // Ждем и отправляем
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await sendActivatedCategory(row, squad, categoryElement);
        
    } catch (e) {
        addDebugLog(`Ошибка при отправке: ${e.message}`, 'error');
        return false;
    }
}