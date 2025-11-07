
/*!
 * ============================================================================
 * G4lKir95 - Mass Collecting Script
 * ============================================================================
 * 
 * Автор: G4lKir95
 * Дата создания: 2025
 * Версия: v4.4
 * 
 * Описание:
 * Скрипт для массовой очистки (сбор ресурсов) в игре Tribal Wars.
 * Позволяет автоматически отправлять отряды на очистку во все деревни
 * с настраиваемыми параметрами (типы войск, категории, время выполнения).
 * 
 * Функции:
 * - Автоматическая отправка групп отрядов
 * - Подробное логирование действий
 * - Настройка количества войск для оставления дома
 * - Поддержка premium отправки
 * 
 * ============================================================================
 */

// ===== ИНИЦИАЛИЗАЦИЯ =====
// Версия скрипта (обновляется при каждом изменении)
var SCRIPT_VERSION = "4.4";
var SCRIPT_AUTHOR = "G4lKir95";
var SCRIPT_CREATED = "2025";

// Получение времени сервера для синхронизации
serverTimeTemp = $("#serverDate")[0].innerText + " " + $("#serverTime")[0].innerText;
serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);

// Определение мобильного устройства
var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;

// Глобальные переменные для данных очистки
var scavengeInfo;
var tempElementSelection="";

// ===== ПРОВЕРКА И ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ МАССОВОЙ ОЧИСТКИ =====
// Если мы не на странице массовой очистки, перенаправляем туда
if (window.location.href.indexOf('screen=place&mode=scavenge_mass') < 0) {
    window.location.assign(game_data.link_base_pure + "place&mode=scavenge_mass");
}

// Удаление старого интерфейса, если он уже существует (для предотвращения дублирования)
$("#massScavengeGalkir95").remove();

// Установка версии по умолчанию
if (typeof version == 'undefined') {
    version = "new";
}

// ===== ЛОКАЛИЗАЦИЯ ТЕКСТОВ ИНТЕРФЕЙСА =====
// Массив текстов для интерфейса (заголовки, кнопки, подсказки)
var langShinko = [
    "G4lKir95 - Mass Collecting",
    "Выберите типы юнитов/ПОРЯДОК для очистки (перетащите юниты для изменения порядка)",
    "Выберите категории для использования",
    "Когда вы хотите, чтобы ваши отряды вернулись (приблизительно)?",
    "Время выполнения здесь",
    "Рассчитать время для каждой страницы",
    "Автор: ",
    "Массовая очистка: отправка по 50 деревень",
    "Запустить группу "
];

// ===== СИСТЕМА ДЕТАЛЬНОГО ЛОГИРОВАНИЯ =====
// Флаг для включения/выключения подробного логирования в консоль
if (typeof DEBUG_VERBOSE === 'undefined') {
    var DEBUG_VERBOSE = true;
}
// Функция для подробного логирования в консоль и UI панель
if (typeof window.vLog === 'undefined') {
    window.vLog = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.log.apply(console, arguments); } catch (e) {}
        try { uiLogAppend(arguments); } catch (e) {}
    };
}

// Функция для начала логической группы (свернутая группа в консоли)
if (typeof window.vGroup === 'undefined') {
    window.vGroup = function(title) {
        if (!DEBUG_VERBOSE) return;
        try { console.groupCollapsed(title); } catch (e) {}
        try { uiLogGroup(title); } catch (e) {}
    };
}

// Функция для закрытия логической группы
if (typeof window.vGroupEnd === 'undefined') {
    window.vGroupEnd = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.groupEnd(); } catch (e) {}
        try { uiLogGroupEnd(); } catch (e) {}
    };
}

// Функция для логирования детальной информации об элементе (для отладки)
// Собирает селектор, тег, id, name, type, disabled, checked, value, outerHTML
function logElementInfo(selector, contextLabel, extra) {
    try {
        var $els = $(selector);
        var count = $els.length;
        var details = { selector: selector, found: count };
        if (count > 0) {
            var el = $els[0];
            details.tag = el.tagName;
            details.id = el.id || null;
            details.name = el.name || null;
            details.type = el.type || null;
            details.disabled = !!el.disabled;
            // Values depending on element type
            if (el.type === 'checkbox' || el.type === 'radio') {
                details.checked = !!el.checked;
            }
            if (typeof el.value !== 'undefined') {
                details.value = el.value;
            }
            // Store a shortened version of outerHTML to see structure
            try {
                var html = el.outerHTML || '';
                details.outerHTML = html.length > 300 ? html.slice(0, 300) + '…' : html;
            } catch (e) {}
        }
        if (extra) details.extra = extra;
        vLog(`[el] ${contextLabel}`, details);
    } catch (e) {
        try { vLog(`[el] ${contextLabel} (selector=${selector}) — error:`, String(e)); } catch (e2) {}
    }
}

// ===== UI ПАНЕЛЬ ЛОГИРОВАНИЯ =====
// Флаг включения/выключения UI панели логирования
if (typeof window.UILOG_ENABLED === 'undefined') {
    var UILOG_ENABLED = true;
}
// Флаг паузы логирования (чтобы не добавлять новые логи)
if (typeof window.UILOG_PAUSED === 'undefined') {
    var UILOG_PAUSED = false;
}
// Глубина вложенности групп для отступов в логах
if (typeof window.UILOG_GROUP_DEPTH === 'undefined') {
    var UILOG_GROUP_DEPTH = 0;
}

// Функция безопасного преобразования объекта в строку (для избежания циклических ссылок)
function uiLogSafeStringify(obj) {
    try {
        const seen = new WeakSet();
        return JSON.stringify(obj, function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return '[Circular]';
                seen.add(value);
            }
            return value;
        });
    } catch (e) {
        try { return String(obj); } catch (e2) { return '[Unserializable]'; }
    }
}

// Создание UI панели логирования, если она еще не создана
function uiLogEnsurePanel() {
    if (document.getElementById('massScavengeLogPanel')) return;
    const css = `
<style>
#massScavengeLogPanel { position: fixed; bottom: 8px; right: 8px; width: 520px; max-height: 40vh; background: ${typeof backgroundColor!== 'undefined'? backgroundColor : '#202225'}; border: 1px solid ${typeof borderColor!=='undefined'? borderColor : '#3e4147'}; z-index: 50; display:none; }
#massScavengeLogHeader { background: ${typeof headerColor!=='undefined'? headerColor : '#202225'}; color: ${typeof titleColor!=='undefined'? titleColor : '#ffffdf'}; padding: 4px 6px; display:flex; align-items:center; justify-content: space-between; font-size: 12px; }
#massScavengeLogControls button { margin-left: 6px; }
#massScavengeLogBody { font-family: monospace; font-size: 11px; color: ${typeof titleColor!=='undefined'? titleColor : '#ffffdf'}; background: ${typeof backgroundColor!== 'undefined'? backgroundColor : '#202225'}; padding: 6px; overflow: auto; max-height: 33vh; }
.ui-log-line { white-space: pre-wrap; word-break: break-word; }
</style>`;
    $("body").append(css + `
<div id="massScavengeLogPanel" class="ui-widget-content">
  <div id="massScavengeLogHeader">
    <div>Подробные логи</div>
    <div id="massScavengeLogControls">
      <button class="btn btnGalkir95" id="logPauseBtn">Пауза</button>
      <button class="btn btnGalkir95" id="logClearBtn">Очистить</button>
      <button class="btn btnGalkir95" id="logCloseBtn">Скрыть</button>
    </div>
  </div>
  <div id="massScavengeLogBody"></div>
  </div>`);
    $('#logPauseBtn').on('click', function(){ UILOG_PAUSED = !UILOG_PAUSED; $(this).text(UILOG_PAUSED? 'Продолжить' : 'Пауза'); });
    $('#logClearBtn').on('click', function(){ $('#massScavengeLogBody').empty(); });
    $('#logCloseBtn').on('click', function(){ $('#massScavengeLogPanel').hide(); });
}

// Показать/скрыть UI панель логирования
function uiLogToggle(show) {
    uiLogEnsurePanel();
    if (typeof show === 'boolean') {
        if (show) $('#massScavengeLogPanel').show(); else $('#massScavengeLogPanel').hide();
        return;
    }
    $('#massScavengeLogPanel').toggle();
}

// Добавление сообщения в UI панель логирования
function uiLogAppend(argsLike) {
    if (!UILOG_ENABLED || UILOG_PAUSED) return;
    uiLogEnsurePanel();
    try {
        const arr = Array.prototype.slice.call(argsLike);
        const ts = new Date();
        const t = `${ts.getHours().toString().padStart(2,'0')}:${ts.getMinutes().toString().padStart(2,'0')}:${ts.getSeconds().toString().padStart(2,'0')}`;
        const indent = '  '.repeat(Math.max(0, UILOG_GROUP_DEPTH));
        const pieces = arr.map(x => {
            if (typeof x === 'string') return x;
            return uiLogSafeStringify(x);
        });
        const line = `${t} ${indent}${pieces.join(' ')}`;
        const $body = $('#massScavengeLogBody');
        const el = document.createElement('div');
        el.className = 'ui-log-line';
        el.textContent = line;
        $body.append(el);
        $body.scrollTop($body[0].scrollHeight);
    } catch (e) {}
}

// Начало группы в UI логах (увеличивает отступ)
function uiLogGroup(title) {
    if (!UILOG_ENABLED) return;
    uiLogAppend([`▼ ${title}`]);
    UILOG_GROUP_DEPTH++;
}

// Конец группы в UI логах (уменьшает отступ)
function uiLogGroupEnd() {
    if (!UILOG_ENABLED) return;
    UILOG_GROUP_DEPTH = Math.max(0, UILOG_GROUP_DEPTH - 1);
    uiLogAppend(['▲ end']);
}

// Сохранение важных логов (запоминаются между перезагрузками)
function saveImportantLog(message) {
    try {
        var ts = new Date();
        var logEntry = {
            time: ts.toISOString(),
            message: message
        };
        
        // Сохраняем в localStorage (последние 100 записей)
        var savedLogs = localStorage.getItem("importantLogs");
        var logs = savedLogs ? JSON.parse(savedLogs) : [];
        logs.push(logEntry);
        if (logs.length > 100) {
            logs = logs.slice(-100); // Оставляем последние 100
        }
        localStorage.setItem("importantLogs", JSON.stringify(logs));
        
        // Выводим в консоль и UI
        console.log("[ВАЖНО]", message);
        uiLogAppend(["[ВАЖНО] " + message]);
    } catch (e) {
        console.error("Ошибка сохранения важного лога:", e);
    }
}

// Загрузка сохраненных важных логов при старте
function loadImportantLogs() {
    try {
        var savedLogs = localStorage.getItem("importantLogs");
        if (savedLogs) {
            var logs = JSON.parse(savedLogs);
            if (logs.length > 0) {
                uiLogAppend([`=== Загружено ${logs.length} важных логов из истории ===`]);
                logs.slice(-10).forEach(function(log) { // Показываем последние 10
                    var dt = new Date(log.time);
                    var timeStr = dt.toLocaleString('ru-RU');
                    uiLogAppend([`[${timeStr}] ${log.message}`]);
                });
            }
        }
    } catch (e) {
        console.error("Ошибка загрузки важных логов:", e);
    }
}

if (game_data.locale == "ru_RU") {
    //russian server
    langShinko = [
        "Массовая очистка",
        "Выберите типы юнитов/ПОРЯДОК для очистки (перетащите юниты для изменения порядка)",
        "Выберите категории для использования",
        "Когда вы хотите, чтобы ваши отряды вернулись (приблизительно)?",
        "Время выполнения здесь",
        "Рассчитать время для каждой страницы",
        "Автор: ",
        "Массовая очистка: отправка по 50 деревень",
        "Запустить группу "
    ];
}
if (game_data.locale == "ro_RO") {
    //romanian server
    langShinko = [
        "Curatare in masa",
        "Selecteaza tipul unitatii/ORDONEAZA sa curete cu (trage unitatea pentru a ordona)",
        "Selecteaza categoria",
        "Cand vrei sa se intoarca trupele de la curatare (aproximativ)",
        "Durata aici",
        "Calculeaza durata pentru fiecare pagina",
        "Creator: ",
        "Cueatare in masa: trimite pe 50 de sate",
        "Lanseaza grup "
    ];
}
if (game_data.locale == "ar_AE") {
    //arabic server
    langShinko = [
        "РЁВ§Р©вЂћРЁВ§РЁС”РЁВ§РЁВ±РЁВ§РЁР„",
        "РЁВ§РЁВ®РЁР„РЁВ§РЁВ± РЁВ§Р©вЂћР©в‚¬РЁВРЁР‡РЁВ§РЁР„ РЁВ§Р©вЂћР©вЂ¦РЁС–РЁР„РЁВ®РЁР‡Р©вЂ¦РЁВ© Р©РѓР©вЂ° РЁВ§Р©вЂћРЁВ§РЁС”РЁВ§РЁВ±РЁВ§РЁР„",
        "РЁВ§РЁВ®РЁР„РЁВ§РЁВ± РЁВ§Р©вЂ Р©в‚¬РЁВ§РЁв„–   РЁВ§Р©вЂћРЁВ§РЁС”РЁВ§РЁВ±РЁВ§РЁР„ РЁВ§Р©вЂћР©вЂ¦РЁС–РЁР„РЁВ®РЁР‡Р©вЂ¦РЁВ© ",
        " Р©вЂ¦РЁВ§ РЁВ§Р©вЂћР©вЂ¦РЁР‡Р©вЂЎ РЁВ§Р©вЂћР©вЂ¦РЁР‡Р©вЂЎ РЁВ§Р©вЂћРЁР†Р©вЂ¦Р©вЂ Р©Р‰Р©вЂЎ РЁВ§Р©вЂћР©вЂ¦РЁВ±РЁВ§РЁР‡ РЁВ§РЁВ±РЁС–РЁВ§Р©вЂћ РЁВ§Р©вЂћРЁВ§РЁС”РЁВ§РЁВ±РЁВ§РЁР„ РЁРЃР©вЂЎРЁВ§",
        "РЁВ¶РЁв„– РЁВ§РЁВ§Р©вЂћР©вЂ¦РЁР‡Р©вЂЎ Р©вЂЎР©вЂ РЁВ§",
        "РЁВРЁС–РЁВ§РЁРЃ РЁВ§Р©вЂћР©вЂ¦РЁР‡Р©вЂЎ Р©вЂћР©С“Р©вЂћ РЁВµР©РѓРЁВР©вЂЎ ",
        "Creator: ",
        "РЁВ§Р©вЂћРЁВ§РЁС”РЁВ§РЁВ±РЁВ§РЁР„ : РЁР„РЁВ±РЁС–Р©вЂћ Р©вЂћР©С“Р©вЂћ 50 Р©вЂљРЁВ±Р©Р‰Р©вЂЎ РЁв„–Р©вЂћР©вЂ° РЁВРЁР‡Р©вЂ° ",
        " РЁР„РЁТ‘РЁС”Р©Р‰Р©вЂћ РЁВ§Р©вЂћР©вЂ¦РЁВ¬Р©вЂ¦Р©в‚¬РЁв„–РЁВ© "
    ];
}
if (game_data.locale == "el_GR") {
    //greek server
    langShinko = [
        "РћСљРћВ±РћВ¶Рћв„–РћС”РћВ® РџС“РћВ¬РџРѓРџвЂ°РџС“РћВ·",
        "РћвЂўРџР‚Рћв„–РћВ»РћВРћС•РџвЂћРћВµ РџвЂћРћв„–РџвЂљ РћСРћС—РћР…РћВ¬РћТ‘РћВµРџвЂљ РћСРћВµ РџвЂћРћв„–РџвЂљ РћС—РџР‚РћС—РћР‡РћВµРџвЂћРћВµ РћС‘РћВ± РћС”РћВ¬РћР…РћВµРџвЂћРћВµ РџС“РћВ¬РџРѓРџвЂ°РџС“РћВ·",
        "РћвЂўРџР‚Рћв„–РћВ»РћВРћС•РџвЂћРћВµ РћВµРџР‚РћР‡РџР‚РћВµРћТ‘РћВ± РџС“РћВ¬РџРѓРџвЂ°РџС“РћВ·РџвЂљ РџР‚РћС—РџвЂ¦ РћС‘РћВ± РџвЂЎРџРѓРћВ·РџС“Рћв„–РћСРћС—РџР‚РћС—Рћв„–РћВ·РћС‘РћС—РџРЊРћР…",
        "РћВ§РџРѓРџРЉРћР…РћС—РџвЂљ РћР€РћВ¬РџРѓРџвЂ°РџС“РћВ·РџвЂљ (РћРЏРџРѓРћВµРџвЂљ.РћвЂєРћВµРџР‚РџвЂћРћВ¬)",
        "РћВ§РџРѓРџРЉРћР…РћС—РџвЂљ",
        "РћТђРџР‚РћС—РћВ»РџРЉРћС–Рћв„–РџС“РћВµ РџвЂЎРџРѓРџРЉРћР…РћС—РџвЂ¦РџвЂљ РџС“РћВ¬РџРѓРџвЂ°РџС“РћВ·РџвЂљ РћС–Рћв„–РћВ± РћС”РћВ¬РћС‘РћВµ РџС“РћВµРћВ»РћР‡РћТ‘РћВ±.",
        "РћвЂќРћВ·РћСРћв„–РћС—РџвЂ¦РџРѓРћС–РџРЉРџвЂљ: ",
        "РћСљРћВ±РћВ¶Рћв„–РћС”РћВ® РџС“РћВ¬РџРѓРџвЂ°РџС“РћВ·: РћвЂРџР‚РћС—РџС“РџвЂћРћС—РћВ»РћВ® РћВ±РћР…РћВ± 50 РџвЂЎРџвЂ°РџРѓРћв„–РћВ¬",
        "РћвЂРџР‚РћС—РџС“РџвЂћРћС—РћВ»РћВ® РћС—РћСРћВ¬РћТ‘РћВ±РџвЂљ "
    ];
}
if (game_data.locale == "nl_NL") {
    //dutch server
    langShinko = [
        "Massa rooftochten",
        "Kies welke troeptypes je wil mee roven, sleep om prioriteit te ordenen",
        "Kies categorieР“В«n die je wil gebruiken",
        "Wanneer wil je dat je rooftochten terug zijn?",
        "Looptijd hier invullen",
        "Bereken rooftochten voor iedere pagina",
        "Scripter: ",
        "Massa rooftochten: verstuur per 50 dorpen",
        "Verstuur groep "
    ];
}
if (game_data.locale == "it_IT") {
    //Italian server
    langShinko = [
        "Rovistamento di massa",
        "Seleziona i tipi da unitР“  con cui rovistare",
        "Seleziona quali categorie utilizzare",
        "Inserisci la durata voluta dei rovistamenti in ORE",
        "Inserisci qui il tempo",
        "Calcola tempi per tutte le pagine",
        "Creatore: ",
        "Rovistamento di massa: manda su 50 villaggi",
        "Lancia gruppo"
    ];
}

// ===== ЗАГРУЗКА И ИНИЦИАЛИЗАЦИЯ НАСТРОЕК ИЗ LOCALSTORAGE =====

// Загрузка/создание настроек выбранных типов войск
if (localStorage.getItem("troopTypeEnabled") == null) {
    console.log("No troopTypeEnabled found, making new one")
    worldUnits = game_data.units;
    var troopTypeEnabled = {}
    for (var i = 0; i < worldUnits.length; i++) {
        if (worldUnits[i] != "militia" && worldUnits[i] != "snob" && worldUnits[i] != "ram" && worldUnits[i] != "catapult" && worldUnits[i] != "spy" && worldUnits[i] != "knight") {
            troopTypeEnabled[worldUnits[i]] = false
        }
    };
    localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
}
else {
    console.log("Getting which troop types are enabled from storage");
    var troopTypeEnabled = JSON.parse(localStorage.getItem("troopTypeEnabled"));
}

// Загрузка/создание настроек количества войск для оставления дома
if (localStorage.getItem("keepHome") == null) {
    console.log("No units set to keep home, creating")
    var keepHome = {
        "spear": 0,
        "sword": 0,
        "axe": 0,
        "archer": 0,
        "light": 0,
        "marcher": 0,
        "heavy": 0
    }
    localStorage.setItem("keepHome", JSON.stringify(keepHome));
}
else {
    console.log("Grabbing which units to keep home");
    var keepHome = JSON.parse(localStorage.getItem("keepHome"));
}

// Загрузка/создание настроек выбранных категорий очистки
if (localStorage.getItem("categoryEnabled") == null) {
    console.log("No category enabled setting found, making new one")
    var categoryEnabled = [true, true, true, true];
    localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
}
else {
    console.log("Getting which category types are enabled from storage");
    var categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled"));
}

// Загрузка/создание настройки приоритета категорий (высокие/низкие)
if (localStorage.getItem("prioritiseHighCat") == null) {
    console.log("No priority/balance setting found, making new one")
    var prioritiseHighCat = false;
    localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
}
else {
    console.log("Getting prioritiseHighCat from storage");
    var prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat"));
}

// Загрузка/создание настройки элемента выбора времени
if (localStorage.getItem("timeElement") == null) {
    console.log("No timeElement selected, use Date");
    localStorage.setItem("timeElement", "Date");
    tempElementSelection = "Date";
}
else {
    console.log("Getting which element from localstorage");
    tempElementSelection = localStorage.getItem("timeElement");

}

// Загрузка/создание порядка отправки войск
if (localStorage.getItem("sendOrder") == null) {
    console.log("No sendorder found, making new one")
    worldUnits = game_data.units;
    var sendOrder = [];
    for (var i = 0; i < worldUnits.length; i++) {
        if (worldUnits[i] != "militia" && worldUnits[i] != "snob" && worldUnits[i] != "ram" && worldUnits[i] != "catapult" && worldUnits[i] != "spy" && worldUnits[i] != "knight") {
            sendOrder.push(worldUnits[i])
        }
    };
    console.log(sendOrder);
    localStorage.setItem("sendOrder", JSON.stringify(sendOrder));
}
else {
    console.log("Getting sendorder from storage");
    var sendOrder = JSON.parse(localStorage.getItem("sendOrder"));
}

// Загрузка/создание времени выполнения очистки (off/def в часах, по умолчанию 4 часа)
if (localStorage.getItem("runTimes") == null) {
    console.log("No runTimes found, making new one")
    var runTimes = {
        "off": 4,
        "def": 4
    }    
	localStorage.setItem("runTimes", JSON.stringify(runTimes));
}
else {
    console.log("Getting runTimes from storage");
	var runTimes = JSON.parse(localStorage.getItem("runTimes"));
}

if (typeof premiumBtnEnabled == 'undefined') {
    var premiumBtnEnabled = false;
}

// ===== ИНИЦИАЛИЗАЦИЯ ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ =====
// Формирование URL запроса для массовой очистки (с учетом ситтера)
if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass`;
}
else {
    URLReq = "game.php?&screen=place&mode=scavenge_mass";
}

// Глобальные переменные для хранения данных
var arrayWithData;                    // Массив данных о деревнях
var enabledCategories = [];            // Включенные категории очистки
var availableUnits = [];               // Доступные типы войск
var squad_requests = [];               // Запросы на отправку отрядов (обычные)
var squad_requests_premium = [];       // Запросы на отправку отрядов (premium)
var scavengeInfo;                      // Информация об очистке
var duration_factor = 0;               // Фактор длительности очистки
var duration_exponent = 0;             // Показатель степени для расчета длительности
var duration_initial_seconds = 0;      // Начальная длительность в секундах

// Парсинг названий категорий из страницы
var categoryNames = JSON.parse("[" + $.find('script:contains("ScavengeMassScreen")')[0].innerHTML.match(/\{.*\:\{.*\:.*\}\}/g) + "]")[0];

// Инициализация времени выполнения очистки (по умолчанию 0)
var time = {
    'off': 0,
    'def': 0
};

// ===== НАСТРОЙКА ТЕМЫ ИНТЕРФЕЙСА =====
// Фиксированная тема TribWars (без выбора темы)
colors = 'tribWars';

//colors for UI
if (typeof colors == 'undefined') {
    var backgroundColor = "#36393f";
    var borderColor = "#3e4147";
    var headerColor = "#202225";
    var titleColor = "#ffffdf";
    cssClassesGalkir95 = `
<style>
.compact * { font-size: 90% !important; }
.compact table.vis td { padding: 2px !important; }
.compact input, .compact textarea, .compact select { padding: 2px 4px !important; }
.sophRowA {
background-color: #32353b;
color: white;
}
.sophRowB {
background-color: #36393f;
color: white;
}
.sophHeader {
background-color: #202225;
font-weight: bold;
color: white;
}
.btnGalkir95
{
    background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%);
}
.btnGalkir95:hover
{ 
    background-image: linear-gradient(#7b7e85 0%, #40444a 30%, #393c40 80%, #171717 100%);
}
#x {
    position: absolute;
    background: red;
    color: white;
    top: 0px;
    right: 0px;
    width: 30px;
    height: 30px;
}
#cog {
    position: absolute;
    background: #32353b;
    color: white;
    top: 0px;
    right: 30px;
    width: 30px;
    height: 30px;
}
</style>`
}
else {
    if (colors == 'pink') {
        //pink theme
        var colors = {
            "backgroundColor": "#FEC5E5",
            "borderColor": "#FF1694",
            "headerColor": "#F699CD",
            "titleColor": "#E11584"
        };
        var backgroundColor = colors.backgroundColor;
        var borderColor = colors.borderColor;
        var headerColor = colors.headerColor;
        var titleColor = colors.titleColor;
        cssClassesGalkir95 = `
        <style>
        .btnGalkir95
        {
            background-image: linear-gradient(#FEC5E5 0%, #FD5DA8 30%, #FF1694 80%, #E11584 100%);
        }
        .btnGalkir95:hover
        { 
            background-image: linear-gradient(#F2B8C6 0%, #FCBACB 30%, #FA86C4 80%, #FE7F9C 100%);
        }
        #x {
            position: absolute;
            background: red;
            color: white;
            top: 0px;
            right: 0px;
            width: 30px;
            height: 30px;
        }
        #cog {
            position: absolute;
            background: #FEC5E5;
            color: white;
            top: 0px;
            right: 30px;
            width: 30px;
            height: 30px;
        }
        </style>`
    }
    else if (colors == 'tribWars') {
        // TribWars-like style (based on trib_wars.js styles)
        var colors = {
            "backgroundColor": "#2c3e50",
            "borderColor": "#34495e",
            "headerColor": "#34495e",
            "titleColor": "#ecf0f1"
        };
        var backgroundColor = colors.backgroundColor;
        var borderColor = colors.borderColor;
        var headerColor = colors.headerColor;
        var titleColor = colors.titleColor;
        cssClassesGalkir95 = `
        <style>
        .compact * { font-size: 90% !important; }
        .compact table.vis td { padding: 2px !important; }
        .compact input, .compact textarea, .compact select { padding: 2px 4px !important; }
        .sophRowA { background-color: #2c3e50; color: #ecf0f1; }
        .sophRowB { background-color: #2c3e50; color: #ecf0f1; }
        .sophHeader { background-color: #34495e; font-weight: bold; color: #ecf0f1; }
        .btnGalkir95 { background: #e74c3c; color: #ffffff; border: none; }
        .btnGalkir95:hover { background: #c0392b; }
        .btn-pp { background: #27ae60; color: #ffffff; }
        .btn-pp:hover { background: #219a52; }
        .btn-success { background: #2d8650; color: #ffffff; border: none; }
        .btn-success:hover { background: #256842; }
        #x { position: absolute; background: #e74c3c; color: white; top: 0px; right: 0px; width: 30px; height: 30px; border: none; }
        #cog { position: absolute; background: #34495e; color: white; top: 0px; right: 30px; width: 30px; height: 30px; border: none; }
        #massScavengeGalkir95 { border: 2px solid #34495e; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        #massScavengeGalkir95Table { border-radius: 6px; }
        /* Units grid */
        .units-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .unit-item { background: #2c3e50; border: 1px solid #34495e; border-radius: 6px; padding: 8px; }
        .unit-header { display: flex; align-items: center; gap: 8px; justify-content: flex-start; margin-bottom: 6px; }
        .unit-checkbox { width: 16px; height: 16px; margin-left: auto; }
        .unit-img { background: #202225; padding: 4px; border-radius: 3px; }
        .unit-name { font-size: 11px; color: #ecf0f1; font-weight: bold; text-transform: capitalize; }
        .unit-controls { display: flex; flex-direction: column; gap: 5px; }
        .unit-backup { width: 80px; font-size: 11px; padding: 4px; text-align: center; background: #2c3e50; color: #ecf0f1; border: 1px solid #7f8c8d; border-radius: 3px; }
        .backup-label { font-size: 10px; color: #bdc3c7; }
        </style>`
    }
    else if (colors == 'modernDark') {
        // modern dark theme (compact-friendly)
        var colors = {
            "backgroundColor": "#1f2430",
            "borderColor": "#2d3446",
            "headerColor": "#151a24",
            "titleColor": "#e6edf3"
        };
        var backgroundColor = colors.backgroundColor;
        var borderColor = colors.borderColor;
        var headerColor = colors.headerColor;
        var titleColor = colors.titleColor;
        cssClassesGalkir95 = `
        <style>
        .compact * { font-size: 90% !important; }
        .compact table.vis td { padding: 2px !important; }
        .compact input, .compact textarea, .compact select { padding: 2px 4px !important; }
        .sophRowA { background-color: #232a36; color: #e6edf3; }
        .sophRowB { background-color: #1f2430; color: #e6edf3; }
        .sophHeader { background-color: #151a24; font-weight: bold; color: #e6edf3; }
        .btnGalkir95 { background-image: linear-gradient(#3a4254 0%, #2a3242 50%, #151a24 100%); color:#e6edf3 }
        .btnGalkir95:hover { background-image: linear-gradient(#4a556b 0%, #39445a 50%, #1b2230 100%); }
        #x { position: absolute; background: #ab2b2b; color: white; top: 0px; right: 0px; width: 30px; height: 30px; }
        #cog { position: absolute; background: #232a36; color: white; top: 0px; right: 30px; width: 30px; height: 30px; }
        </style>`
    }
    else if (colors == "swedish") {
        //yellow/blue

        var colors = {
            "backgroundColor": "#fecd00",
            "borderColor": "#03456b",
            "headerColor": "#006aa8",
            "titleColor": "#ffffdf"
        };
        var backgroundColor = colors.backgroundColor;
        var borderColor = colors.borderColor;
        var headerColor = colors.headerColor;
        var titleColor = colors.titleColor;
        cssClassesGalkir95 = `
        <style>
        .btnGalkir95
        {
            background-image: linear-gradient(#00a1fe 0%, #5d9afd 30%, #1626ff 80%, #1f15e1 100%);
        }
        .btnGalkir95:hover
        { 
            background-image: linear-gradient(#b8bcf2 0%, #babbfc 30%, #8c86fa 80%, #969fff 100%);
        }
        #x {
            position: absolute;
            background: red;
            color: white;
            top: 0px;
            right: 0px;
            width: 30px;
            height: 30px;
        }
        #cog {
            position: absolute;
            background: #fecd00;
            color: white;
            top: 0px;
            right: 30px;
            width: 30px;
            height: 30px;
        }
        </style>`


    }
    else if (colors == "minimalistGray") {
        //gray

        var colors = {
            "backgroundColor": "#f1f1f1",
            "borderColor": "#777777",
            "headerColor": "#ded9d9",
            "titleColor": "#383834"
        };
        var backgroundColor = colors.backgroundColor;
        var borderColor = colors.borderColor;
        var headerColor = colors.headerColor;
        var titleColor = colors.titleColor;
        cssClassesGalkir95 = `
        <style>
        .btnGalkir95
        {
            background-image: linear-gradient(#00a1fe 0%, #5d9afd 30%, #1626ff 80%, #1f15e1 100%);
            color:white
        }
        .btnGalkir95:hover
        { 
            background-image: linear-gradient(#b8bcf2 0%, #babbfc 30%, #8c86fa 80%, #969fff 100%);
            color: white
        }
        #x {
            position: absolute;
            background: red;
            color: white;
            top: 0px;
            right: 0px;
            width: 30px;
            height: 30px;
        }
        #cog {
            position: absolute;
            background: #f1f1f1;
            color: white;
            top: 0px;
            right: 30px;
            width: 30px;
            height: 30px;
        }
        </style>`


    }
    else if (colors == "TW") {
        //TW
        console.log("Changing to TW theme");
        var backgroundColor = "#F4E4BC";
        var borderColor = "#ecd7ac";
        var headerColor = "#c6a768";
        var titleColor = "#803000";
        cssClassesGalkir95 = `
        <style>
        .sophRowA {
            background-color: #f4e4bc;
            color: black;
            }
            .sophRowB {
            background-color: #fff5da;
            color: black;
            }
            .sophHeader {
            background-color: #c6a768;
            font-weight: bold;
            color: #803000;
            }
            .sophLink
            {
                color:#803000;
            }
        .btnGalkir95
        {
            linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%)
            color:white
        }
        .btnGalkir95:hover
        { 
            linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%);
            color: white
        }
        #x {
            position: absolute;
            background: red;
            color: white;
            top: 0px;
            right: 0px;
            width: 30px;
            height: 30px;
        }
        #cog {
            position: absolute;
            background: #f4e4bc;
            color: white;
            top: 0px;
            right: 30px;
            width: 30px;
            height: 30px;
        }
        </style>`
    }
    else {
        //standard
        var backgroundColor = "#36393f";
        var borderColor = "#3e4147";
        var headerColor = "#202225";
        var titleColor = "#ffffdf";
        cssClassesGalkir95 = `
            <style>
            .compact * { font-size: 90% !important; }
            .compact table.vis td { padding: 2px !important; }
            .compact input, .compact textarea, .compact select { padding: 2px 4px !important; }
            .sophRowA {
            background-color: #32353b;
            color: white;
            }
            .sophRowB {
            background-color: #36393f;
            color: white;
            }
            .sophHeader {
            background-color: #202225;
            font-weight: bold;
            color: white;
            }
            .btnGalkir95
            {
                background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%);
            }
            .btnGalkir95:hover
            { 
                background-image: linear-gradient(#7b7e85 0%, #40444a 30%, #393c40 80%, #171717 100%);
            }
            #x {
                position: absolute;
                background: red;
                color: white;
                top: 0px;
                right: 0px;
                width: 30px;
                height: 30px;
            }
            #cog {
                position: absolute;
                background: #32353b;
                color: white;
                top: 0px;
                right: 30px;
                width: 30px;
                height: 30px;
            }
            </style>`
    }
}

//adding UI classes to page
$("#contentContainer").eq(0).prepend(cssClassesGalkir95);
$("#mobileHeader").eq(0).prepend(cssClassesGalkir95);

$.getAll = function (
    urls, // array of URLs
    onLoad, // called when any URL is loaded, params (index, data)
    onDone, // called when all URLs successfully loaded, no params
    onError // called when a URL load fails or if onLoad throws an exception, params (error)
) {
    var numDone = 0;
    var lastRequestTime = 0;
    var minWaitTime = 200; // ms between requests
    loadNext();
    function loadNext() {
        if (numDone == urls.length) {
            onDone();
            return;
        }

        let now = Date.now();
        let timeElapsed = now - lastRequestTime;
        if (timeElapsed < minWaitTime) {
            let timeRemaining = minWaitTime - timeElapsed;
            setTimeout(loadNext, timeRemaining);
            return;
        }
        console.log('Getting ', urls[numDone]);
        $("#progress").css("width", `${(numDone + 1) / urls.length * 100}%`);
        lastRequestTime = now;
        $.get(urls[numDone])
            .done((data) => {
                try {
                    onLoad(numDone, data);
                    ++numDone;
                    loadNext();
                } catch (e) {
                    onError(e);
                }
            })
            .fail((xhr) => {
                onError(xhr);
            })
    }
};

// ===== ПОЛУЧЕНИЕ ДАННЫХ ОБ ОЧИСТКЕ =====
// Получение данных об очистке для текущего мира (каждый мир имеет разные параметры: exponent, factor, initial_seconds)
// Также получаем URL всех страниц массовой очистки
// Это позволяет минимизировать количество запросов, так как страницы массовой очистки содержат все необходимые данные:
// количество войск, какие категории разблокированы для каждой деревни, и наличие точки сбора
function getData() {
    // Удаляем только старое окно с кнопками отправки если есть
    $("#massScavengeFinal").remove();
    URLs = [];
    
    // Получение первой страницы для определения количества страниц и параметров мира
    $.get(URLReq, function (data) {
        // Определение количества страниц с деревнями
        if ($(".paged-nav-item").length > 0) {
            amountOfPages = parseInt($(".paged-nav-item")[$(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]);
        }
        else {
            amountOfPages = 0;
        }
        
        // Формирование списка URL для всех страниц и получение параметров мира
        for (var i = 0; i <= amountOfPages; i++) {
            URLs.push(URLReq + "&page=" + i);
            // Получение параметров мира (exponent, factor, initial_seconds) из первой страницы
            tempData = JSON.parse($(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[0]);
            duration_exponent = tempData[1].duration_exponent;
            duration_factor = tempData[1].duration_factor;
            duration_initial_seconds = tempData[1].duration_initial_seconds;
        }
        console.log(URLs);

    })
        .done(function () {
            // Получение данных всех деревень и формирование массива
            // Необходимо добавить скобки до и после строки для парсинга JSON
            arrayWithData = "[";
            
            // Загрузка данных со всех страниц с ограничением скорости запросов
            $.getAll(URLs,
                (i, data) => {
                    // Извлечение данных о деревнях со страницы
                    thisPageData = $(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[2];
                    arrayWithData += thisPageData + ",";
                },
                () => {
                    // Завершение формирования массива данных
                    arrayWithData = arrayWithData.substring(0, arrayWithData.length - 1);
                    arrayWithData += "]";  // Закрывающая скобка для парсинга в массив
                    scavengeInfo = JSON.parse(arrayWithData);
                    
                    // Подсчет и расчет для каждой деревни: сколько войск нужно отправить по каждой категории
                    // После завершения подсчета: группировка результатов по 200 запросов
                    // Согласно morty, это лимит, который сервер принимает за один запрос
                    count = 0;
                    for (var i = 0; i < scavengeInfo.length; i++) {
                        calculateHaulCategories(scavengeInfo[i]);
                        count++;
                    }
                    
                    // Когда все деревни обработаны
                    if (count == scavengeInfo.length) {
                        console.log("Done");
                        
                        // Разделение всех запросов на группы по 200 (лимит сервера по morty)
                        squads = {};
                        squads_premium = {};
                        per200 = 0;
                        groupNumber = 0;
                        squads[groupNumber] = [];
                        squads_premium[groupNumber] = [];
                        
                        for (var k = 0; k < squad_requests.length; k++) {
                            // Если достигнут лимит в 200 запросов, создаем новую группу
                            if (per200 == 200) {
                                groupNumber++;
                                squads[groupNumber] = [];
                                squads_premium[groupNumber] = [];
                                per200 = 0;
                            }
                            per200++;
                            squads[groupNumber].push(squad_requests[k]);
                            squads_premium[groupNumber].push(squad_requests_premium[k]);
                        }

                        // Автоматическая отправка всех групп без создания UI
                        console.log("Starting automatic send of all groups");
                        sendAllGroupsAuto(false, function() {
                            saveImportantLog("Все группы успешно отправлены автоматически");
                        });
                    }
                },
                (error) => {
                    console.error(error);
                });
        }
        )
}

//first UI, will always open as soon as you run the script.
html = `
<div id="massScavengeGalkir95" class="ui-widget-content" style="width:350px;background-color:${backgroundColor};cursor:move;z-index:50;max-height:85vh;overflow-y:auto;">

<button class="btn" id = "x" onclick="closeWindow('massScavengeGalkir95')">
            X
        </button>
    <table id="massScavengeGalkir95Table" class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}">
        <tr>
            <td colspan="10" id="massScavengeGalkir95Title" style="text-align:center; width:auto; background-color:${headerColor}">
                <h4 style="margin:5px">
                    <center><u>
                            <font color="${titleColor}">G4lKir95 - Mass Collecting</font>
                        </u>
                    </center>
                </h4>
            </td>
        </tr>
        <tr style="background-color:${backgroundColor}">
            <td style="text-align:center;background-color:${headerColor}" colspan="3">
                <h5 style="margin:3px">
                    <center><u>
                            <font color="${titleColor}">Выбор войск</font>
                        </u></center>
                </h5>
            </td>
        </tr>
        <tr style="background-color:${headerColor}">
            <td style="background-color:${headerColor}; padding:4px; color:${titleColor}; font-size:11px; font-weight:bold;">Войско</td>
            <td style="background-color:${headerColor}; padding:4px; text-align:center; color:${titleColor}; font-size:11px; font-weight:bold;">Выбрать</td>
            <td style="background-color:${headerColor}; padding:4px; text-align:center; color:${titleColor}; font-size:11px; font-weight:bold;">Оставить дома</td>
        </tr>
        <tbody id="unitsTableBody">
        </tbody>
    </table>
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tbody>
            <tr style="background-color:${backgroundColor}">
                <td style="text-align:center;background-color:${headerColor}" colspan="2">
                    <h5 style="margin:3px">
                        <center><u>
                                <font color="${titleColor}">${langShinko[2]}</font>
                            </u></center>
                    </h5>
                </td>
            </tr>
            <tr>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">${categoryNames[1].name}</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:right;"><input type="checkbox" ID="category1" name="cat1"></td>
            </tr>
            <tr>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">${categoryNames[2].name}</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:right;"><input type="checkbox" ID="category2" name="cat2"></td>
            </tr>
            <tr>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">${categoryNames[3].name}</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:right;"><input type="checkbox" ID="category3" name="cat3"></td>
            </tr>
            <tr>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">${categoryNames[4].name}</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:right;"><input type="checkbox" ID="category4" name="cat4"></td>
            </tr>
        </tbody>
    </table>
    
    <!-- Время скрыто: фиксировано 4 часа для off/def -->
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tr id="settingPriorityTitle" style="text-align:center; width:auto; background-color:${headerColor}">
            <td colspan="2" style="text-align:center; width:auto; background-color:${headerColor}">
                <center style="margin:3px">
                    <font color="${titleColor}" style="font-size:12px">Какой режим?</font>
                </center>
            </td>
        </tr>
        <tr id="settingPriorityHeader" style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="text-align:center; width:50%; background-color:${headerColor}; padding:2px;">
                <font color="${titleColor}" style="font-size:11px">Сбалансированный</font>
            </td>
            <td style="text-align:center; width:50%; background-color:${headerColor}; padding:2px;">
                <font color="${titleColor}" style="font-size:11px">Приоритет высших категорий</font>
            </td>
        </tr>
        <tr id="settingPriority" style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:2px;"><input type="radio" ID="settingPriorityBalanced" name="prio"></td>
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:2px;"><input type="radio" ID="settingPriorityPriority" name="prio"></td>
        </tr>
    </table>
    
    <!-- Блок Фарм-деревни удалён из интерфейса -->
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tr style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btnGalkir95" id="reset" onclick="resetSettings()" value="Сброс" style="font-size:11px; padding:4px 10px;"></center>
            </td>
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btn-success" id="sendMassOnce" onclick="readyToSendOnce()" value="Запустить один раз" style="font-size:11px; padding:4px 10px;"></center>
            </td>
        </tr>
    </table>


    <div style="text-align:center; position:relative; padding-bottom:5px;">
        <p style="margin:2px; font-size:11px;">
            <font color="${titleColor}">${langShinko[6]} </font><span style="text-shadow:-1px -1px 0 ${titleColor},1px -1px 0 ${titleColor},-1px 1px 0 ${titleColor},1px 1px 0 ${titleColor}; font-size:11px;">G4lKir95</span>
        </p>
        <button class="btn" id="toggleLogUIPanelBtn" style="position:absolute; right:5px; bottom:2px; width:40px; height:20px; font-size:8px; padding:1px; line-height:1; background-color:${backgroundColor}; color:${titleColor}; border:1px solid ${borderColor};">Логи</button>
    </div>
</div>
`;

var targetContainer = is_mobile ? $("#mobileContent").eq(0) : $(".maincell").eq(0);
if (targetContainer.length === 0) {
    // fallback: если основная цель не найдена, используем доступный контейнер
    targetContainer = $(".maincell").eq(0);
    if (targetContainer.length === 0) {
        targetContainer = $("#mobileContent").eq(0);
    }
}

targetContainer.prepend(html);

if (is_mobile == false) {
    $("#massScavengeGalkir95").css("position", "fixed");
    $("#massScavengeGalkir95").draggable();

}

// Инициализация UI лог-панели и кнопки
uiLogEnsurePanel();
$("#toggleLogUIPanelBtn").on('click', function(){ uiLogToggle(); });

// Компактный режим удалён из интерфейса

// Время по умолчанию: фиксировано 4 часа для off/def
runTimes = { off: 4, def: 4 };
localStorage.setItem("runTimes", JSON.stringify(runTimes));

// Блок Фарм-деревни удалён — сохранение/обработчики не требуются

// Время фиксировано, обработчики таймеров отключены

// Русские названия юнитов
var unitNamesRu = {
    "spear": "Копейщик",
    "sword": "Мечник",
    "axe": "Топорщик",
    "archer": "Лучник",
    "light": "Легкая кавалерия",
    "marcher": "Конный лучник",
    "heavy": "Тяжелая кавалерия"
};

//create checkboxes and add them to the UI
for (var i = 0; i < sendOrder.length; i++) {
    var unitKey = sendOrder[i];
    var unitNameRu = unitNamesRu[unitKey] || unitKey;
    $("#unitsTableBody").eq(0).append(`
    <tr>
        <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">${unitNameRu}</td>
        <td style="background-color:${backgroundColor}; padding:4px; text-align:center; width:60px;"><input type="checkbox" ID="${unitKey}" name="${unitKey}"></td>
        <td style="background-color:${backgroundColor}; padding:4px; text-align:center; width:80px;"><input type="text" ID="${unitKey}Backup" name="${unitKey}" value="${keepHome[unitKey]}" size="3" style="text-align:center; width:60px;"></td>
    </tr>`);
    // сортировка отключена — фиксированный порядок юнитов

    if (prioritiseHighCat == true) {
        console.log('setting high priority cat')
        $(`#settingPriorityPriority`).prop("checked", true);
    }
    else {
        console.log('setting balanced')
        $(`#settingPriorityBalanced`).prop("checked", true);
    }

    enableCorrectTroopTypes();
}

//focus calculate button!
$("#sendMassOnce").focus();

// Загружаем логи при загрузке страницы
setTimeout(function() {
    loadImportantLogs();
}, 1000);

// ===== ПОДГОТОВКА К ОТПРАВКЕ =====
// Сбор всех настроек из UI, валидация и сохранение в localStorage
function prepareToSend() {
    // Проверка выбора режима распределения войск (приоритет/сбалансированный)
    if ($("#settingPriorityPriority")[0].checked == false && $("#settingPriorityBalanced")[0].checked == false) {
        alert("Вы не выбрали, как хотите распределить свои войска! Выберите либо приоритет высших категорий до выбранного времени выполнения, либо сбалансированное распределение по всем категориям!");
        throw Error("didn't choose type");
    }

    // Проверка выбора хотя бы одной категории очистки
    if ($("#category1").is(":checked") == false && $("#category2").is(":checked") == false && $("#category3").is(":checked") == false && $("#category4").is(":checked") == false) {
        alert("Вы не выбрали, какие категории хотите использовать!");
        throw Error("didn't choose category");
    }

    // Получение выбранных типов войск из UI
    for (var i = 0; i < sendOrder.length; i++) {
        troopTypeEnabled[sendOrder[i]] = $(`:checkbox#${sendOrder[i]}`).is(":checked");
    }
    
    // Получение количества войск для оставления дома
    for (var i = 0; i < sendOrder.length; i++) {
        keepHome[sendOrder[i]] = $(`#${sendOrder[i]}Backup`).val();
    }
    
    // Получение выбранных категорий очистки
    enabledCategories = [];
    [1,2,3,4].forEach(function(ci){
        enabledCategories.push($(`#category${ci}`).is(":checked"));
    });

    // Время фиксировано: 4 часа для OFF и DEF
    localStorage.setItem("timeElement", "Hours");
    time.off = 4;
    time.def = 4;

    // Получение настройки приоритета
    if ($("#settingPriorityPriority")[0].checked == true) {
        prioritiseHighCat = true;
    }
    else {
        prioritiseHighCat = false;
    }

    // Сохранение всех настроек в localStorage
    localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
    localStorage.setItem("keepHome", JSON.stringify(keepHome));
    localStorage.setItem("categoryEnabled", JSON.stringify(enabledCategories));
    localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
    localStorage.setItem("sendOrder", JSON.stringify(sendOrder));
    localStorage.setItem("runTimes", JSON.stringify(time));

    // Обновление глобальной переменной
    categoryEnabled = enabledCategories;
    
    // Важный лог: запуск с настройками
    var enabledUnits = Object.keys(troopTypeEnabled).filter(k => troopTypeEnabled[k]);
    var enabledCats = enabledCategories.map((e, i) => e ? (i+1) : null).filter(x => x !== null);
    saveImportantLog(`Запуск: юниты=[${enabledUnits.join(',')}], категории=[${enabledCats.join(',')}], режим=${prioritiseHighCat ? 'приоритет' : 'сбалансированный'}`);
}

// Запуск один раз
// ===== ЗАПУСК ОДИН РАЗ =====
// Подготовка данных и запуск одного цикла отправки
function readyToSendOnce() {
    prepareToSend();
    getData();
}

// ===== ОТПРАВКА ГРУППЫ (АВТОМАТИЧЕСКАЯ) =====
// Автоматическая отправка одной группы без подтверждения и UI
// Используется для автоматической отправки всех групп подряд
function sendGroupAuto(groupNr, premiumEnabled, callback) {
    var actuallyEnabled = premiumEnabled === true;
    
    // Выбор обычных или premium запросов
    if (actuallyEnabled) {
        tempSquads = squads_premium[groupNr];
    }
    else {
        tempSquads = squads[groupNr];
    }
    
    // Важный лог: отправка группы
    saveImportantLog(`Отправка группы #${groupNr + 1}${actuallyEnabled ? ' (premium)' : ''}: ${tempSquads.length} заявок`);
    
    // Отправка одной группы (до 200 запросов на очистку)
    TribalWars.post('scavenge_api', 
    { ajaxaction: 'send_squads' }, 
    { "squad_requests": tempSquads }, function () {
        UI.SuccessMessage(`Группа #${groupNr + 1} успешно отправлена`);
        if (callback) callback();  // Вызов callback после успешной отправки
    },
        !1
    );
}

// ===== ОТПРАВКА ВСЕХ ГРУПП ПОСЛЕДОВАТЕЛЬНО =====
// Автоматическая отправка всех групп одна за другой с задержкой между ними
function sendAllGroupsAuto(premiumEnabled, onComplete) {
    var totalGroups = Object.keys(squads).length;
    var currentGroup = 0;
    
    saveImportantLog(`Начата автоматическая отправка всех групп (всего: ${totalGroups})`);
    
    function sendNext() {
        if (currentGroup >= totalGroups) {
            saveImportantLog(`Все группы отправлены (всего: ${totalGroups})`);
            if (onComplete) onComplete();
            return;
        }
        
        sendGroupAuto(currentGroup, premiumEnabled, function() {
            // Задержка между группами для избежания перегрузки сервера
            currentGroup++;
            setTimeout(sendNext, 500);
        });
    }
    
    sendNext();
}

// ===== ОТПРАВКА ГРУППЫ (РУЧНАЯ) =====
// Отправка одной группы с подтверждением для premium (используется при ручной отправке через UI кнопки)
function sendGroup(groupNr, premiumEnabled) {
    var actuallyEnabled = false;
    
    // Запрос подтверждения для premium отправки
    if (premiumEnabled == true) {
        actuallyEnabled = confirm("Отправить с использованием premium? (Это может стоить много PP!)");
    }
    
    // Выбор обычных или premium запросов
    if (actuallyEnabled == true) {
        tempSquads = squads_premium[groupNr];
    }
    else {
        tempSquads = squads[groupNr];
    }
    
    // Важный лог: отправка группы
    saveImportantLog(`Отправка группы #${groupNr}${actuallyEnabled ? ' (premium)' : ''}: ${tempSquads.length} заявок`);
    
    // Отключение кнопок во время отправки
    $(':button[id^="sendMass"]').prop('disabled', true)
    $(':button[id^="sendMassPremium"]').prop('disabled', true)
    
    // Отправка одной группы через API
    TribalWars.post('scavenge_api', 
    { ajaxaction: 'send_squads' }, 
    { "squad_requests": tempSquads }, function () {
        UI.SuccessMessage("Группа успешно отправлена");
    },
        !1
    );

    // После отправки группы: удаление строки из таблицы (но окно не закрываем)
    setTimeout(function () { 
        $(`#sendRow${groupNr}`).remove(); 
        // Проверяем, остались ли еще группы
        var remainingButtons = $(':button[id^="sendMass"]').length;
        if (remainingButtons > 0) {
            $(':button[id^="sendMass"]').prop('disabled', false); 
            $(':button[id^="sendMassPremium"]').prop('disabled', false); 
            $("#sendMass")[0].focus();
        } else {
            // Все группы отправлены, но окно оставляем открытым
            $(':button[id^="sendMass"]').prop('disabled', false); 
            $(':button[id^="sendMassPremium"]').prop('disabled', false);
        }
    }, 200);
}

// ===== РАСЧЕТ КАТЕГОРИЙ ОЧИСТКИ ДЛЯ ДЕРЕВНИ =====
// Расчет количества войск для отправки по каждой категории очистки для одной деревни
function calculateHaulCategories(data) {
    // Проверка наличия точки сбора в деревне
    if (data.has_rally_point == true) {
        // Фарм-логика отключена: не игнорируем light нигде
        var isFarmVillage = false;
		
        // Подсчет доступных войск (с учетом настроек "оставить дома")
        var troopsAllowed = {};
        for (key in troopTypeEnabled) {
            if (troopTypeEnabled[key] == true) {
                // Вычитаем количество, которое нужно оставить дома
                if (data.unit_counts_home[key] - keepHome[key] > 0) {
                    troopsAllowed[key] = data.unit_counts_home[key] - keepHome[key];
                }
                else {
                    troopsAllowed[key] = 0;
                }
            }
        }
		
        // Определение типа войск (off/def) для расчета времени выполнения
        var unitType = {
            "spear": 'def',
            "sword": 'def',
            "axe": 'off',
            "archer": 'def',
            "light": 'off',
            "marcher": 'off',
            "heavy": 'def',
        }

        // Подсчет общего количества off и def войск
        var typeCount = { 'off': 0, 'def': 0 };

        for (var prop in troopsAllowed) {
            typeCount[unitType[prop]] = typeCount[unitType[prop]] + troopsAllowed[prop];
        }

        // Расчет максимально возможного лута
        totalLoot = 0;
        var carryMap = { spear:25, sword:15, axe:10, archer:10, light:80, marcher:50, heavy:50, knight:100 };
        for (key in troopsAllowed) {
            if (carryMap[key]) {
                totalLoot += troopsAllowed[key] * (data.unit_carry_factor * carryMap[key]);
            }
        }
        
        // Если нет войск для отправки, завершаем
        if (totalLoot == 0) {
            return;
        }
        
        // Расчет времени выполнения на основе типа войск (off или def)
        if (typeCount.off > typeCount.def) {
            var baseSecs = (time.off * 3600);  // Время выполнения в секундах
            haul = parseInt(((baseSecs / duration_factor - duration_initial_seconds) ** (1 / (duration_exponent)) / 100) ** (1 / 2));
        } else {
            var baseSecsD = (time.def * 3600);
            haul = parseInt(((baseSecsD / duration_factor - duration_initial_seconds) ** (1 / (duration_exponent)) / 100) ** (1 / 2));
        }

        haulCategoryRate = {};
        //check which categories are enabled

        if (data.options[1].scavenging_squad != null || data.options[2].scavenging_squad != null || data.options[3].scavenging_squad != null || data.options[4].scavenging_squad != null)
		{
			// В одной из категорий уже идёт поиск — пропускаем
		}
		else
		{
            if (data.options[1].is_locked == true || data.options[1].scavenging_squad != null) {
				haulCategoryRate[1] = 0;
			} else {
				haulCategoryRate[1] = haul / 0.1;
			}
            if (data.options[2].is_locked == true || data.options[2].scavenging_squad != null) {
				haulCategoryRate[2] = 0;
			} else {
				haulCategoryRate[2] = haul / 0.25;
			}
            if (data.options[3].is_locked == true || data.options[3].scavenging_squad != null) {
				haulCategoryRate[3] = 0;
			} else {
				haulCategoryRate[3] = haul / 0.50;
			}
            if (data.options[4].is_locked == true || data.options[4].scavenging_squad != null) {
				haulCategoryRate[4] = 0;
			} else {
				haulCategoryRate[4] = haul / 0.75;
			}
		}

        for (var i = 0; i < enabledCategories.length; i++) {
            if (enabledCategories[i] == false) {
                haulCategoryRate[i + 1] = 0;
            }
        }

        totalHaul = haulCategoryRate[1] + haulCategoryRate[2] + haulCategoryRate[3] + haulCategoryRate[4];

        unitsReadyForSend = calculateUnitsPerVillage(troopsAllowed);

        for (var k = 0; k < Object.keys(unitsReadyForSend).length; k++) {
            candidate_squad = { "unit_counts": unitsReadyForSend[k], "carry_max": 9999999999 };
            if (data.options[k + 1].is_locked == false) {
                var req = { "village_id": data.village_id, "candidate_squad": candidate_squad, "option_id": k + 1, "use_premium": false };
                var reqP = { "village_id": data.village_id, "candidate_squad": candidate_squad, "option_id": k + 1, "use_premium": true };
                squad_requests.push(req)
                squad_requests_premium.push(reqP)
            }
        }
    }
    else {
        console.log("no rally point");
    }
}

function enableCorrectTroopTypes() {
    worldUnits = game_data.units;
    for (var i = 0; i < worldUnits.length; i++) {
        if (worldUnits[i] != "militia" && worldUnits[i] != "snob" && worldUnits[i] != "ram" && worldUnits[i] != "catapult" && worldUnits[i] != "spy") {
            if (troopTypeEnabled[worldUnits[i]] == true) {
                $(`#${worldUnits[i]}`).prop("checked", true);
            }
        }
    }
    for (var i = 0; i < categoryEnabled.length + 1; i++) {
        if (categoryEnabled[i] == true) {
            $(`#category${i + 1}`).prop("checked", true);
        }
    }
}

function calculateUnitsPerVillage(troopsAllowed) {
    var unitHaul = {
        "spear": 25,
        "sword": 15,
        "axe": 10,
        "archer": 10,
        "light": 80,
        "marcher": 50,
        "heavy": 50,
        "knight": 100
    };
    //calculate HERE :D
    unitsReadyForSend = {};
    unitsReadyForSend[0] = {};
    unitsReadyForSend[1] = {};
    unitsReadyForSend[2] = {};
    unitsReadyForSend[3] = {};
    if (totalLoot > totalHaul) {
        //too many units
        //prioritise higher category first
        if (version != "old") {
            for (var j = 3; j >= 0; j--) {
                var reach = haulCategoryRate[j + 1];
                sendOrder.forEach((unit) => {
                    if (troopsAllowed.hasOwnProperty(unit) && reach > 0) {
                        var amountNeeded = Math.floor(reach / unitHaul[unit]);

                        if (amountNeeded > troopsAllowed[unit]) {
                            unitsReadyForSend[j][unit] = troopsAllowed[unit];
                            reach = reach - (troopsAllowed[unit] * unitHaul[unit]);
                            troopsAllowed[unit] = 0;
                        } else {
                            unitsReadyForSend[j][unit] = amountNeeded;
                            reach = 0;
                            troopsAllowed[unit] = troopsAllowed[unit] - amountNeeded;
                        }
                    }
                });
            }
        }
        else {
            for (var j = 0; j < 4; j++) {
                for (key in troopsAllowed) {
                    unitsReadyForSend[j][key] = Math.floor((haulCategoryRate[j + 1] * (troopsAllowed[key] / totalLoot)));
                }
            }
        }
    }
    else {
        //not enough units, spread evenly
        troopNumber = 0;
        for (key in troopsAllowed) {
            troopNumber += troopsAllowed[key];
        }
        if (prioritiseHighCat != true && troopNumber > 130) {
            for (var j = 0; j < 4; j++) {
                for (key in troopsAllowed) {
                    unitsReadyForSend[j][key] = Math.floor((totalLoot / totalHaul * haulCategoryRate[j + 1]) * (troopsAllowed[key] / totalLoot));
                }
            }
        }
        else {
            //prioritise higher category first
            for (var j = 3; j >= 0; j--) {
                var reach = haulCategoryRate[j + 1];
                sendOrder.forEach((unit) => {
                    if (troopsAllowed.hasOwnProperty(unit) && reach > 0) {
                        var amountNeeded = Math.floor(reach / unitHaul[unit]);

                        if (amountNeeded > troopsAllowed[unit]) {
                            unitsReadyForSend[j][unit] = troopsAllowed[unit];
                            reach = reach - (troopsAllowed[unit] * unitHaul[unit]);
                            troopsAllowed[unit] = 0;
                        } else {
                            unitsReadyForSend[j][unit] = amountNeeded;
                            reach = 0;
                            troopsAllowed[unit] = troopsAllowed[unit] - amountNeeded;
                        }
                    }
                });
            }
        }
    }
    return unitsReadyForSend;
}

function resetSettings() {
    localStorage.removeItem("troopTypeEnabled");
    localStorage.removeItem("categoryEnabled");
    localStorage.removeItem("prioritiseHighCat");
    localStorage.removeItem("sendOrder");
    localStorage.removeItem("runTimes");
    localStorage.removeItem("keepHome");
    localStorage.removeItem("farmCoords");
    // importantLogs оставляем - они могут быть полезны для истории
    
    UI.BanneredRewardMessage("Настройки сброшены");
    window.location.reload();
}

function closeWindow(title) {
    $("#" + title).remove();
}

function zeroPadded(val) {
    if (val >= 10)
        return val;
    else
        return '0' + val;
}

function setTimeToField(runtimeType) {
    d = Date.parse(new Date(serverDate)) + runtimeType * 1000 * 3600;
    d = new Date(d);
    d = zeroPadded(d.getHours()) + ":" + zeroPadded(d.getMinutes());
    return d;
}

function setDayToField(runtimeType) {
    d = Date.parse(new Date(serverDate)) + runtimeType * 1000 * 3600;
    d = new Date(d);
    d = d.getFullYear() + "-" + zeroPadded(d.getMonth() + 1) + "-" + zeroPadded(d.getDate());
    return d;
}

function fancyTimeFormat(time) {
    if (time < 0) {
        return "Время в прошлом!"
    }
    else {
        // Hours, minutes and seconds
        var hrs = ~~(time / 3600);
        var mins = ~~((time % 3600) / 60);
        var secs = ~~time % 60;

        // Output like "1:01" or "4:03:59" or "123:03:59"
        var ret = "Макс. длительность: ";

        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }
        else {
            ret += "0:" + (mins < 10 ? "0" : "");
        }

        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }
}

function updateTimers() {
    if ($("#timeSelectorDate")[0].checked == true) {
        vLog("[updateTimers] Режим Date — пересчет отображения времени");
        var offVal = fancyTimeFormat((Date.parse($("#offDay").val().replace(/-/g, "/") + " " + $("#offTime").val()) - serverDate) / 1000);
        var defVal = fancyTimeFormat((Date.parse($("#defDay").val().replace(/-/g, "/") + " " + $("#defTime").val()) - serverDate) / 1000);
        $("#offDisplay")[0].innerText = offVal;
        $("#defDisplay")[0].innerText = defVal;
        vLog("[updateTimers] #offDisplay <=", offVal, "| #defDisplay <=", defVal);
    }
    else {
        vLog("[updateTimers] Режим Hours — пересчет отображения времени");
        var offValH = fancyTimeFormat($(".runTime_off").val() * 3600);
        var defValH = fancyTimeFormat($(".runTime_def").val() * 3600);
        $("#offDisplay")[0].innerText = offValH;
        $("#defDisplay")[0].innerText = defValH;
        vLog("[updateTimers] #offDisplay <=", offValH, "| #defDisplay <=", defValH);
    }
}

function selectType(type) {
    console.log("clicked" + type);
    switch (type) {
        case 'Hours':
            if ($("#timeSelectorDate")[0].checked == true) {
                $("#offDay").eq(0).removeAttr('disabled');
                $("#defDay").eq(0).removeAttr('disabled');
                $("#offTime").eq(0).removeAttr('disabled');;
                $("#defTime").eq(0).removeAttr('disabled');
                $(".runTime_off").prop("disabled", true);
                $(".runTime_def").prop("disabled", true);
                vLog("[selectType:Hours] enable #offDay,#defDay,#offTime,#defTime; disable .runTime_off,.runTime_def");
                ['#offDay','#defDay','#offTime','#defTime','.runTime_off','.runTime_def'].forEach(function(s){ logElementInfo(s, 'selectType:Hours состояние поля'); });
            }
            else {
                $("#offDay").prop("disabled", true);
                $("#defDay").prop("disabled", true);
                $("#offTime").prop("disabled", true);
                $("#defTime").prop("disabled", true);
                $(".runTime_off").eq(0).removeAttr('disabled');
                $(".runTime_def").eq(0).removeAttr('disabled');
                vLog("[selectType:Hours] disable #offDay,#defDay,#offTime,#defTime; enable .runTime_off,.runTime_def");
                ['#offDay','#defDay','#offTime','#defTime','.runTime_off','.runTime_def'].forEach(function(s){ logElementInfo(s, 'selectType:Hours состояние поля'); });
            }
            break;
        case 'Date':
            if ($("#timeSelectorHours")[0].checked == true) {
                $("#offDay").prop("disabled", true);
                $("#defDay").prop("disabled", true);
                $("#offTime").prop("disabled", true);
                $("#defTime").prop("disabled", true);
                $(".runTime_off").eq(0).removeAttr('disabled');
                $(".runTime_def").eq(0).removeAttr('disabled');
                vLog("[selectType:Date] disable #offDay,#defDay,#offTime,#defTime; enable .runTime_off,.runTime_def");
                ['#offDay','#defDay','#offTime','#defTime','.runTime_off','.runTime_def'].forEach(function(s){ logElementInfo(s, 'selectType:Date состояние поля'); });
            }
            else {
                $("#offDay").eq(0).removeAttr('disabled');
                $("#defDay").eq(0).removeAttr('disabled');
                $("#offTime").eq(0).removeAttr('disabled');;
                $("#defTime").eq(0).removeAttr('disabled');
                $(".runTime_off").prop("disabled", true);
                $(".runTime_def").prop("disabled", true);
                vLog("[selectType:Date] enable #offDay,#defDay,#offTime,#defTime; disable .runTime_off,.runTime_def");
                ['#offDay','#defDay','#offTime','#defTime','.runTime_off','.runTime_def'].forEach(function(s){ logElementInfo(s, 'selectType:Date состояние поля'); });
            }
            break;
        default:
            break;
    }
}

// Функция очистки координат
function cleanCoords(textArea) {
    var matched = document.getElementById(textArea).value.match(/[0-9]{3}\|[0-9]{3}/g);
    if (matched) {
        var output = matched.join(" ");
        document.getElementById(textArea).value = output;
    } else {
        document.getElementById(textArea).value = "";
    }
}