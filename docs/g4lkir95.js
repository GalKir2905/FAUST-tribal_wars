
serverTimeTemp = $("#serverDate")[0].innerText + " " + $("#serverTime")[0].innerText;
serverTime = serverTimeTemp.match(/^([0][1-9]|[12][0-9]|3[01])[\/\-]([0][1-9]|1[012])[\/\-](\d{4})( (0?[0-9]|[1][0-9]|[2][0-3])[:]([0-5][0-9])([:]([0-5][0-9]))?)?$/);
serverDate = Date.parse(serverTime[3] + "/" + serverTime[2] + "/" + serverTime[1] + serverTime[4]);
var is_mobile = !!navigator.userAgent.match(/iphone|android|blackberry/ig) || false;
var scavengeInfo;
var tempElementSelection="";

//relocate to mass scavenging page
if (window.location.href.indexOf('screen=place&mode=scavenge_mass') < 0) {
    //relocate
    window.location.assign(game_data.link_base_pure + "place&mode=scavenge_mass");
}

$("#massScavengeGalkir95").remove();
//set global variables

if (typeof version == 'undefined') {
    version = "new";
}

//set translations
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

// ===== VERBOSE DEBUG LOGGER =====
// Toggle to enable/disable extremely detailed console tracing
if (typeof DEBUG_VERBOSE === 'undefined') {
    var DEBUG_VERBOSE = true;
}
if (typeof window.vLog === 'undefined') {
    window.vLog = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.log.apply(console, arguments); } catch (e) {}
        try { uiLogAppend(arguments); } catch (e) {}
    };
}
if (typeof window.vGroup === 'undefined') {
    window.vGroup = function(title) {
        if (!DEBUG_VERBOSE) return;
        try { console.groupCollapsed(title); } catch (e) {}
        try { uiLogGroup(title); } catch (e) {}
    };
}
if (typeof window.vGroupEnd === 'undefined') {
    window.vGroupEnd = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.groupEnd(); } catch (e) {}
        try { uiLogGroupEnd(); } catch (e) {}
    };
}

// Detailed element descriptor for future maintenance
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

// ===== UI LOG PANEL =====
if (typeof window.UILOG_ENABLED === 'undefined') {
    var UILOG_ENABLED = true;
}
if (typeof window.UILOG_PAUSED === 'undefined') {
    var UILOG_PAUSED = false;
}
if (typeof window.UILOG_GROUP_DEPTH === 'undefined') {
    var UILOG_GROUP_DEPTH = 0;
}

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

function uiLogToggle(show) {
    uiLogEnsurePanel();
    if (typeof show === 'boolean') {
        if (show) $('#massScavengeLogPanel').show(); else $('#massScavengeLogPanel').hide();
        return;
    }
    $('#massScavengeLogPanel').toggle();
}

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

function uiLogGroup(title) {
    if (!UILOG_ENABLED) return;
    uiLogAppend([`▼ ${title}`]);
    UILOG_GROUP_DEPTH++;
}

function uiLogGroupEnd() {
    if (!UILOG_ENABLED) return;
    UILOG_GROUP_DEPTH = Math.max(0, UILOG_GROUP_DEPTH - 1);
    uiLogAppend(['▲ end']);
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

//loading settings

// troop types

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

// keepHome

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

// categories enabled

if (localStorage.getItem("categoryEnabled") == null) {
    console.log("No category enabled setting found, making new one")
    var categoryEnabled = [true, true, true, true];
    localStorage.setItem("categoryEnabled", JSON.stringify(categoryEnabled));
}
else {
    console.log("Getting which category types are enabled from storage");
    var categoryEnabled = JSON.parse(localStorage.getItem("categoryEnabled"));
}

//priority

if (localStorage.getItem("prioritiseHighCat") == null) {
    console.log("No priority/balance setting found, making new one")
    var prioritiseHighCat = false;
    localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
}
else {
    console.log("Getting prioritiseHighCat from storage");
    var prioritiseHighCat = JSON.parse(localStorage.getItem("prioritiseHighCat"));
}

//Time element

if (localStorage.getItem("timeElement") == null) {
    console.log("No timeElement selected, use Date");
    localStorage.setItem("timeElement", "Date");
    tempElementSelection = "Date";
}
else {
    console.log("Getting which element from localstorage");
    tempElementSelection = localStorage.getItem("timeElement");

}

// sendorder

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

// runtimes

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

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass`;
}
else {
    URLReq = "game.php?&screen=place&mode=scavenge_mass";
}
var arrayWithData;
var enabledCategories = [];
var availableUnits = [];
var squad_requests = [];
var squad_requests_premium = [];
var scavengeInfo;
var duration_factor = 0;
var duration_exponent = 0;
var duration_initial_seconds = 0;
var categoryNames = JSON.parse("[" + $.find('script:contains("ScavengeMassScreen")')[0].innerHTML.match(/\{.*\:\{.*\:.*\}\}/g) + "]")[0];
//basic setting, to be safe
var time = {
    'off': 0,
    'def': 0
};

// THEME: fixed TribWars theme (no theme selector)
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

//get scavenging data that is in play for this world, every world has different exponent, factor, and initial seconds. Also getting the URLS of each mass scavenging page
//we can limit the amount of pages we need to call this way, since the mass scavenging pages have all the data that is necessary: troopcounts, which categories per village are unlocked, and if rally point exists.
function getData() {
    $("#massScavengeGalkir95").remove();
    URLs = [];
    $.get(URLReq, function (data) {
        if ($(".paged-nav-item").length > 0) {
            amountOfPages = parseInt($(".paged-nav-item")[$(".paged-nav-item").length - 1].href.match(/page=(\d+)/)[1]);
        }
        else {
            amountOfPages = 0;
        }
        for (var i = 0; i <= amountOfPages; i++) {
            //push url that belongs to scavenging page i
            URLs.push(URLReq + "&page=" + i);
            //get world data
            tempData = JSON.parse($(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[0]);
            duration_exponent = tempData[1].duration_exponent;
            duration_factor = tempData[1].duration_factor;
            duration_initial_seconds = tempData[1].duration_initial_seconds;
        }
        console.log(URLs);

    })
        .done(function () {
            //here we get all the village data and make an array with it, we won't be able to parse unless we add brackets before and after the string
            arrayWithData = "[";
            $.getAll(URLs,
                (i, data) => {
                    thisPageData = $(data).find('script:contains("ScavengeMassScreen")').html().match(/\{.*\:\{.*\:.*\}\}/g)[2];
                    arrayWithData += thisPageData + ",";
                },
                () => {
                    //on done
                    arrayWithData = arrayWithData.substring(0, arrayWithData.length - 1);
                    //closing bracket so we can parse the data into a useable array
                    arrayWithData += "]";
                    scavengeInfo = JSON.parse(arrayWithData);
                    // count and calculate per village how many troops per category need to be sent. 
                    // Once count is finished, make a new UI element, and group all the results per 200.
                    // According to morthy, that is the limit at which the server will accept squad pushes.
                    count = 0;
                    for (var i = 0; i < scavengeInfo.length; i++) {
                        calculateHaulCategories(scavengeInfo[i]);
                        count++;
                    }
                    if (count == scavengeInfo.length) {
                        //Post here
                        console.log("Done");
                        //need to split all the scavenging runs per 200, server limit according to morty
                        squads = {};
                        squads_premium = {};
                        per200 = 0;
                        groupNumber = 0;
                        squads[groupNumber] = [];
                        squads_premium[groupNumber] = [];
                        for (var k = 0; k < squad_requests.length; k++) {
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

                        //create html send screen with button per launch
                        console.log("Creating launch options");
                        htmlWithLaunchButtons = `<div id="massScavengeFinal" class="ui-widget-content" style="position:fixed;background-color:${backgroundColor};cursor:move;z-index:50;">
                        <button class="btn" id = "x" onclick="closeWindow('massScavengeFinal')">
                            X
                        </button>
                        <table id="massScavengeGalkir95FinalTable" class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}">
                        <tr>
                            <td colspan="10" id="massScavengeGalkir95Title" style="text-align:center; width:auto; background-color:${headerColor}">
                                <h3>
                                    <center style="margin:10px"><u>
                                            <font color="${titleColor}">${langShinko[7]}</font>
                                        </u>
                                    </center>
                                </h3>
                            </td>
                        </tr>`;
                        for (var s = 0; s < Object.keys(squads).length; s++) {
                            //add row with new button
                            htmlWithLaunchButtons += `<tr id="sendRow${s}" style="text-align:center; width:auto; background-color:${backgroundColor}"><td style="text-align:center; width:auto; background-color:${backgroundColor}"><center><input type="button"  class="btn btnGalkir95" id="sendMass" onclick="sendGroup(${s},false)" value="${langShinko[8]}${s + 1}"></center></td><td style="text-align:center; width:auto; background-color:${backgroundColor}"><center><input type="button"  class="btn btn-pp btn-send-premium" id="sendMassPremium" onclick="sendGroup(${s},true)" value="${langShinko[8]}${s + 1} С PREMIUM" style="display:none"></center></td></tr>`
                        }
                        htmlWithLaunchButtons += "</table></div>"
                        //appending to page
                        console.log("Creating launch UI");
                        $(".maincell").eq(0).prepend(htmlWithLaunchButtons);
                        $("#mobileContent").eq(0).prepend(htmlWithLaunchButtons);

                        if (is_mobile == false) {
                            $("#massScavengeFinal").draggable();
                        }
                        for (var prem = 0; prem < $("#sendMassPremium").length; prem++) {
                            if (premiumBtnEnabled == true) {
                                $($("#sendMassPremium")[prem]).show();
                            }
                        }
                        $("#sendMass")[0].focus()
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
        <tbody>
            <tr style="background-color:${backgroundColor}">
                <td style="text-align:center;background-color:${headerColor}" colspan="4">
                    <h5 style="margin:3px">
                        <center><u>
                                <font color="${titleColor}">Настройки повторов</font>
                            </u></center>
                    </h5>
                </td>
            </tr>
            <tr>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">Интервал (минут)</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:center;"><input type="number" id="repeatInterval" min="1" value="60" style="width:60px; text-align:center;"></td>
                <td style="background-color:${backgroundColor}; padding:4px; color:${titleColor}; font-size:12px;">Количество</td>
                <td style="background-color:${backgroundColor}; padding:4px; text-align:center;"><input type="number" id="repeatCount" min="1" value="5" style="width:60px; text-align:center;"></td>
            </tr>
        </tbody>
    </table>
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tr style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btnGalkir95" id="reset" onclick="resetSettings()" value="Сброс" style="font-size:11px; padding:4px 10px;"></center>
            </td>
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btn-success" id="sendMassOnce" onclick="readyToSendOnce()" value="Запустить один раз" style="font-size:11px; padding:4px 10px;"></center>
            </td>
        </tr>
        <tr style="text-align:center; width:auto; background-color:${headerColor}">
            <td colspan="2" style="text-align:center; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btn-success" id="sendMassRepeat" onclick="readyToSendRepeat()" value="Запустить с повторами" style="font-size:11px; padding:4px 10px; width:90%;"></center>
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

$(".maincell").eq(0).prepend(html);
$("#mobileContent").eq(0).prepend(html);

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

// Восстанавливаем повторы при загрузке страницы (если были активны)
setTimeout(function() {
    restoreRepeats();
}, 1000);

// Общая логика подготовки к отправке
function prepareToSend() {
    //check if every setting is chosen, otherwise alert and abort
    if ($("#settingPriorityPriority")[0].checked == false && $("#settingPriorityBalanced")[0].checked == false) {
        // no setting chosen
        alert("Вы не выбрали, как хотите распределить свои войска! Выберите либо приоритет высших категорий до выбранного времени выполнения, либо сбалансированное распределение по всем категориям!");
        throw Error("didn't choose type");
    }

    if ($("#category1").is(":checked") == false && $("#category2").is(":checked") == false && $("#category3").is(":checked") == false && $("#category4").is(":checked") == false) {
        // no category chosen
        alert("Вы не выбрали, какие категории хотите использовать!");
        throw Error("didn't choose category");
    }

    //get trooptypes we wanna use, and runtime
    vGroup("[readyToSend] Считывание настроек UI и подготовка к расчетам");
    vLog("[readyToSend] Порядок юнитов (источник '#imgRow :checkbox[name]'):", sendOrder);
    for (var i = 0; i < sendOrder.length; i++) {
        var selectorCheck = `:checkbox#${sendOrder[i]}`;
        logElementInfo(selectorCheck, `readyToSend: чтение чекбокса юнита ${sendOrder[i]}`);
        var isChecked = $(`:checkbox#${sendOrder[i]}`).is(":checked");
        troopTypeEnabled[sendOrder[i]] = isChecked;
        vLog(`[readyToSend] Чекбокс юнита ${sendOrder[i]} (${selectorCheck}) => ${isChecked}`);
    }
    for (var i = 0; i < sendOrder.length; i++) {
        var selectorBackup = `#${sendOrder[i]}Backup`;
        logElementInfo(selectorBackup, `readyToSend: чтение поля 'Оставить дома' для ${sendOrder[i]}`);
        var backupVal = $(`#${sendOrder[i]}Backup`).val();
        keepHome[sendOrder[i]] = backupVal;
        vLog(`[readyToSend] Поле 'Оставить дома' для ${sendOrder[i]} (${selectorBackup}) => ${backupVal}`);
    }
    vLog("[readyToSend] Итог включенных типов юнитов:", JSON.parse(JSON.stringify(troopTypeEnabled)));
    enabledCategories = [];
    [1,2,3,4].forEach(function(ci){
        var sel = `#category${ci}`;
        logElementInfo(sel, `readyToSend: чтение чекбокса категории ${ci}`);
        enabledCategories.push($(sel).is(":checked"));
    });
    vLog("[readyToSend] Категории (селекторы #category1..#category4) =>", JSON.parse(JSON.stringify(enabledCategories)));

    // Время фиксировано: 4 часа для OFF и DEF
    localStorage.setItem("timeElement", "Hours");
    time.off = 4;
    time.def = 4;
    vLog(`[readyToSend] Время фиксировано: off=4, def=4 (часы)`);

    vLog(`[readyToSend] Итог времени (часы): off=${time.off}, def=${time.def}`);
    if (time.off > 24 || time.def > 24) {
        alert("Ваше время выполнения превышает 24 часа!");
    }

    vLog("[readyToSend] Текущий порядок юнитов перед чтением сортировки:", JSON.parse(JSON.stringify(sendOrder)));
    if ($("#settingPriorityPriority")[0].checked == true) {
        prioritiseHighCat = true;
    }
    else {
        prioritiseHighCat = false;
    }

    // Фиксированный порядок юнитов — не меняем sendOrder
    vLog("[readyToSend] Фиксированный порядок юнитов (без перетаскивания):", JSON.parse(JSON.stringify(sendOrder))); 
    vLog(`[readyToSend] Режим приоритета: prioritiseHighCat=${prioritiseHighCat}`);
    vLog("[readyToSend] Сохраняем в localStorage ключи: troopTypeEnabled, keepHome, categoryEnabled, prioritiseHighCat, sendOrder, runTimes");
    localStorage.setItem("troopTypeEnabled", JSON.stringify(troopTypeEnabled));
    localStorage.setItem("keepHome", JSON.stringify(keepHome));
    localStorage.setItem("categoryEnabled", JSON.stringify(enabledCategories));
    localStorage.setItem("prioritiseHighCat", JSON.stringify(prioritiseHighCat));
    localStorage.setItem("sendOrder", JSON.stringify(sendOrder));
    localStorage.setItem("runTimes", JSON.stringify(time));

    vLog("[readyToSend] Сохранено. Итоговые настройки:");
    vLog("- troopTypeEnabled:", JSON.parse(JSON.stringify(troopTypeEnabled)));
    vLog("- keepHome:", JSON.parse(JSON.stringify(keepHome)));
    vLog("- categoryEnabled:", JSON.parse(JSON.stringify(enabledCategories)));
    vLog("- prioritiseHighCat:", prioritiseHighCat);
    vLog("- sendOrder:", JSON.parse(JSON.stringify(sendOrder)));
    vLog("- runTimes:", JSON.parse(JSON.stringify(time)));
    categoryEnabled = enabledCategories;

    vGroupEnd();
}

// Запуск один раз
function readyToSendOnce() {
    prepareToSend();
    getData();
}

// Глобальные переменные для повторов
var repeatTimer = null;
var repeatCountdown = 0;
var repeatTotal = 0;
var repeatInterval = 0;

// Сохранение состояния повторов в localStorage
function saveRepeatState() {
    var state = {
        total: repeatTotal,
        countdown: repeatCountdown,
        interval: repeatInterval,
        timeNextRun: repeatCountdown > 0 ? Date.now() + (repeatInterval * 60 * 1000) : null
    };
    localStorage.setItem("repeatState", JSON.stringify(state));
    vLog(`[repeat] Сохранено состояние: ${repeatCountdown}/${repeatTotal} осталось, интервал=${repeatInterval} мин`);
}

// Очистка состояния повторов
function clearRepeatState() {
    localStorage.removeItem("repeatState");
    if (repeatTimer) {
        clearInterval(repeatTimer);
        repeatTimer = null;
    }
    repeatTotal = 0;
    repeatCountdown = 0;
    repeatInterval = 0;
}

// Запуск с повторами
function readyToSendRepeat() {
    prepareToSend();
    
    var interval = parseInt($("#repeatInterval").val()) || 60;
    var count = parseInt($("#repeatCount").val()) || 5;
    
    if (interval < 1 || count < 1) {
        alert("Интервал и количество должны быть больше 0!");
        return;
    }
    
    // Останавливаем предыдущие повторы если есть
    clearRepeatState();
    
    repeatTotal = count;
    repeatCountdown = count;
    repeatInterval = interval;
    
    vLog(`[repeat] Запуск с повторами: интервал=${interval} минут, количество=${count}`);
    
    // Первый запуск сразу
    getData();
    repeatCountdown--;
    saveRepeatState();
    
    if (repeatCountdown > 0) {
        // Следующие запуски через интервал
        var intervalMs = interval * 60 * 1000; // минуты в миллисекунды
        repeatTimer = setInterval(function() {
            if (repeatCountdown > 0) {
                vLog(`[repeat] Повтор ${repeatTotal - repeatCountdown + 1}/${repeatTotal}, осталось ${repeatCountdown - 1}`);
                getData();
                repeatCountdown--;
                saveRepeatState();
            } else {
                clearRepeatState();
                vLog(`[repeat] Все повторы завершены (${repeatTotal})`);
                UI.SuccessMessage(`Выполнено ${repeatTotal} запусков`);
            }
        }, intervalMs);
    } else {
        clearRepeatState();
    }
}

// Восстановление повторов при загрузке страницы
function restoreRepeats() {
    try {
        var saved = localStorage.getItem("repeatState");
        if (!saved) return;
        
        var state = JSON.parse(saved);
        if (!state || state.countdown <= 0 || !state.timeNextRun) {
            localStorage.removeItem("repeatState");
            return;
        }
        
        var now = Date.now();
        var timeUntilNext = state.timeNextRun - now;
        
        if (timeUntilNext <= 0) {
            // Время уже прошло - запускаем сразу и продолжаем
            vLog(`[repeat] Восстановление: время пропущено, запускаем сразу`);
            repeatTotal = state.total;
            repeatCountdown = state.countdown;
            repeatInterval = state.interval;
            
            // Запускаем сразу
            getData();
            repeatCountdown--;
            saveRepeatState();
            
            if (repeatCountdown > 0) {
                // Продолжаем с интервалом
                var intervalMs = repeatInterval * 60 * 1000;
                repeatTimer = setInterval(function() {
                    if (repeatCountdown > 0) {
                        vLog(`[repeat] Повтор ${repeatTotal - repeatCountdown + 1}/${repeatTotal}, осталось ${repeatCountdown - 1}`);
                        getData();
                        repeatCountdown--;
                        saveRepeatState();
                    } else {
                        clearRepeatState();
                        vLog(`[repeat] Все повторы завершены (${repeatTotal})`);
                        UI.SuccessMessage(`Выполнено ${repeatTotal} запусков`);
                    }
                }, intervalMs);
            } else {
                clearRepeatState();
            }
        } else {
            // Время еще не пришло - запускаем таймер
            vLog(`[repeat] Восстановление: осталось ${Math.round(timeUntilNext/1000/60)} минут до следующего запуска`);
            repeatTotal = state.total;
            repeatCountdown = state.countdown;
            repeatInterval = state.interval;
            
            // Запускаем таймер на оставшееся время
            repeatTimer = setTimeout(function() {
                // Запускаем сразу
                getData();
                repeatCountdown--;
                saveRepeatState();
                
                if (repeatCountdown > 0) {
                    // Продолжаем с интервалом
                    var intervalMs = repeatInterval * 60 * 1000;
                    repeatTimer = setInterval(function() {
                        if (repeatCountdown > 0) {
                            vLog(`[repeat] Повтор ${repeatTotal - repeatCountdown + 1}/${repeatTotal}, осталось ${repeatCountdown - 1}`);
                            getData();
                            repeatCountdown--;
                            saveRepeatState();
                        } else {
                            clearRepeatState();
                            vLog(`[repeat] Все повторы завершены (${repeatTotal})`);
                            UI.SuccessMessage(`Выполнено ${repeatTotal} запусков`);
                        }
                    }, intervalMs);
                } else {
                    clearRepeatState();
                }
            }, timeUntilNext);
        }
    } catch (e) {
        console.error("[repeat] Ошибка восстановления:", e);
        localStorage.removeItem("repeatState");
    }
}

function sendGroup(groupNr, premiumEnabled) {
    if (premiumEnabled == true) {
        actuallyEnabled = false;
        actuallyEnabled = confirm("Вы уверены, что хотите отправить отряды очистки с использованием premium? Отмена отправит отряд очистки без premium.   ********* В ЗАВИСИМОСТИ ОТ КОЛИЧЕСТВА ЮНИТОВ/ДЕРЕВЕНЬ, КОТОРЫЕ ВЫ ОТПРАВЛЯЕТЕ, ЭТО МОЖЕТ ПРИВЕСТИ К ОЧЕНЬ ВЫСОКИМ ЗАТРАТАМ PP! ИСПОЛЬЗУЙТЕ ЭТУ ФУНКЦИЮ ТОЛЬКО ЕСЛИ ВЫ МОЖЕТЕ СЕБЕ ЭТО ПОЗВОЛИТЬ/ЗНАЕТЕ, СКОЛЬКО БУДУТ СТОИТЬ ОТДЕЛЬНЫЕ ЗАДАНИЯ С PP! *********");
    }
    else {
        actuallyEnabled = false;
    }
    if (actuallyEnabled == true) {
        tempSquads = squads_premium[groupNr];
    }
    else {
        tempSquads = squads[groupNr];
    }
    vGroup(`[sendGroup] Отправка группы #${groupNr} (premium=${actuallyEnabled})`);
    vLog(`[sendGroup] Количество заявок в группе: ${tempSquads.length}`);
    if (tempSquads.length > 0) {
        try {
            var example = tempSquads[0];
            vLog('[sendGroup] Пример первой заявки:', {
                village_id: example.village_id,
                option_id: example.option_id,
                use_premium: example.use_premium,
                unit_counts: JSON.parse(JSON.stringify(example.candidate_squad.unit_counts))
            });
        } catch (e) {}
    }
    //Send one group(one page worth of scavenging)
    $(':button[id^="sendMass"]').prop('disabled', true)
    $(':button[id^="sendMassPremium"]').prop('disabled', true)
    TribalWars.post('scavenge_api', 
    { ajaxaction: 'send_squads' }, 
    { "squad_requests": tempSquads }, function () {
        UI.SuccessMessage("Группа успешно отправлена");
        vLog('[sendGroup] Успех отправки группы #'+groupNr);
    },
        !1
    );

    //once group is sent, remove the row from the table
    setTimeout(function () { 
        $(`#sendRow${groupNr}`).remove(); 
        $(':button[id^="sendMass"]').prop('disabled', false); 
        $(':button[id^="sendMassPremium"]').prop('disabled', false); 
        $("#sendMass")[0].focus(); 
        vGroupEnd();
    }, 200);
}

function calculateHaulCategories(data) {
    //check if village has rally point
    if (data.has_rally_point == true) {
        vGroup(`[calc] Деревня ${data.village_name} (#${data.village_id}) — возможно собирать`);
        vLog(`[calc] Параметры мира: duration_factor=${duration_factor}, duration_exponent=${duration_exponent}, duration_initial_seconds=${duration_initial_seconds}`);
		
        // Фарм-логика отключена: не игнорируем light нигде
        var isFarmVillage = false;
		
        var troopsAllowed = {};
        vGroup('[calc] troopsAllowed: расчет доступных юнитов с учетом чекбоксов и "Оставить дома"');
        for (key in troopTypeEnabled) {
            if (troopTypeEnabled[key] == true) {
                if (data.unit_counts_home[key] - keepHome[key] > 0) {
                    troopsAllowed[key] = data.unit_counts_home[key] - keepHome[key];
                    vLog(`[calc] ${key}: чекбокс=on, доступно=${data.unit_counts_home[key]}, оставить_дома=${keepHome[key]} => ${troopsAllowed[key]}`);
                }
                else {
                    troopsAllowed[key] = 0;
                    vLog(`[calc] ${key}: чекбокс=on, но доступно <= оставить_дома => 0`);
                }
            }
        }
        vGroupEnd();
		
        var unitType = {
            "spear": 'def',
            "sword": 'def',
            "axe": 'off',
            "archer": 'def',
            "light": 'off',
            "marcher": 'off',
            "heavy": 'def',
        }

        var typeCount = { 'off': 0, 'def': 0 };

        for (var prop in troopsAllowed) {
            typeCount[unitType[prop]] = typeCount[unitType[prop]] + troopsAllowed[prop];
        }
        vLog(`[calc] typeCount: off=${typeCount.off}, def=${typeCount.def}`);

        totalLoot = 0;

        //check what the max possible loot is
        var carryMap = { spear:25, sword:15, axe:10, archer:10, light:80, marcher:50, heavy:50, knight:100 };
        for (key in troopsAllowed) {
            if (carryMap[key]) {
                var add = troopsAllowed[key] * (data.unit_carry_factor * carryMap[key]);
                totalLoot += add;
                vLog(`[calc] вклад по ${key}: ${troopsAllowed[key]} * (${data.unit_carry_factor} * ${carryMap[key]}) = ${add}`);
            }
        }
        vLog(`[calc] Итого потенциальная добыча totalLoot=${totalLoot}`);
        if (totalLoot == 0) {
            //can't loot from here, end
            vGroupEnd();
            return;
        }
        if (typeCount.off > typeCount.def) {
            var baseSecs = (time.off * 3600);
            haul = parseInt(((baseSecs / duration_factor - duration_initial_seconds) ** (1 / (duration_exponent)) / 100) ** (1 / 2));
            vLog(`[calc] Выбран OFF runtime: baseSecs=${baseSecs}; формула => haul=int((((baseSecs/${duration_factor})-${duration_initial_seconds})^(1/${duration_exponent})/100)^(1/2)) = ${haul}`);
        } else {
            var baseSecsD = (time.def * 3600);
            haul = parseInt(((baseSecsD / duration_factor - duration_initial_seconds) ** (1 / (duration_exponent)) / 100) ** (1 / 2));
            vLog(`[calc] Выбран DEF runtime: baseSecs=${baseSecsD}; формула => haul=int((((baseSecs/${duration_factor})-${duration_initial_seconds})^(1/${duration_exponent})/100)^(1/2)) = ${haul}`);
        }

        haulCategoryRate = {};
        //check which categories are enabled

        if (data.options[1].scavenging_squad != null || data.options[2].scavenging_squad != null || data.options[3].scavenging_squad != null || data.options[4].scavenging_squad != null)
		{
			vLog("[calc] В одной из категорий уже идёт поиск — пропускаем расчеты распределения");
		}
		else
		{
            if (data.options[1].is_locked == true || data.options[1].scavenging_squad != null) {
				haulCategoryRate[1] = 0;
				vLog('[calc] Категория 1: заблокирована -> 0');
			} else {
				haulCategoryRate[1] = haul / 0.1;
				vLog(`[calc] Категория 1: unlocked => haul/0.1 = ${haulCategoryRate[1]}`);
			}
            if (data.options[2].is_locked == true || data.options[2].scavenging_squad != null) {
				haulCategoryRate[2] = 0;
				vLog('[calc] Категория 2: заблокирована -> 0');
			} else {
				haulCategoryRate[2] = haul / 0.25;
				vLog(`[calc] Категория 2: unlocked => haul/0.25 = ${haulCategoryRate[2]}`);
			}
            if (data.options[3].is_locked == true || data.options[3].scavenging_squad != null) {
				haulCategoryRate[3] = 0;
				vLog('[calc] Категория 3: заблокирована -> 0');
			} else {
				haulCategoryRate[3] = haul / 0.50;
				vLog(`[calc] Категория 3: unlocked => haul/0.50 = ${haulCategoryRate[3]}`);
			}
            if (data.options[4].is_locked == true || data.options[4].scavenging_squad != null) {
				haulCategoryRate[4] = 0;
				vLog('[calc] Категория 4: заблокирована -> 0');
			} else {
				haulCategoryRate[4] = haul / 0.75;
				vLog(`[calc] Категория 4: unlocked => haul/0.75 = ${haulCategoryRate[4]}`);
			}
		}
        vLog('[calc] haulCategoryRate до отключений:', JSON.parse(JSON.stringify(haulCategoryRate)));

        for (var i = 0; i < enabledCategories.length; i++) {
            if (enabledCategories[i] == false) {
                vLog(`[calc] Категория ${i+1} отключена пользователем (#category${i+1}) => 0`);
                haulCategoryRate[i + 1] = 0;
            }
        }

        totalHaul = haulCategoryRate[1] + haulCategoryRate[2] + haulCategoryRate[3] + haulCategoryRate[4];
        vLog(`[calc] totalHaul = ${totalHaul}`);

        unitsReadyForSend = calculateUnitsPerVillage(troopsAllowed);
        vLog('[calc] unitsReadyForSend по категориям:', JSON.parse(JSON.stringify(unitsReadyForSend)));

        for (var k = 0; k < Object.keys(unitsReadyForSend).length; k++) {
            candidate_squad = { "unit_counts": unitsReadyForSend[k], "carry_max": 9999999999 };
            if (data.options[k + 1].is_locked == false) {
                var req = { "village_id": data.village_id, "candidate_squad": candidate_squad, "option_id": k + 1, "use_premium": false };
                var reqP = { "village_id": data.village_id, "candidate_squad": candidate_squad, "option_id": k + 1, "use_premium": true };
                squad_requests.push(req)
                squad_requests_premium.push(reqP)
                vLog(`[calc] Добавлена заявка в squad_requests: option_id=${k+1}, village_id=${data.village_id}, unit_counts=`, JSON.parse(JSON.stringify(candidate_squad.unit_counts)));
            }
        }
        vGroupEnd();
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
                var sel = `#${worldUnits[i]}`;
                $(sel).prop("checked", true);
                vLog(`[enableCorrectTroopTypes] Устанавливаем чекбокс ${sel} => checked=true`);
                logElementInfo(sel, 'enableCorrectTroopTypes: после установки checked=true');
            }
        }
    }
    for (var i = 0; i < categoryEnabled.length + 1; i++) {
        if (categoryEnabled[i] == true) {
            var catSel = `#category${i + 1}`;
            $(catSel).prop("checked", true);
            vLog(`[enableCorrectTroopTypes] Устанавливаем чекбокс категории ${catSel} => checked=true`);
            logElementInfo(catSel, 'enableCorrectTroopTypes: после установки checked=true');
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
    vGroup('[calcUnits] Распределение юнитов по категориям');
    vLog('[calcUnits] Вход troopsAllowed:', JSON.parse(JSON.stringify(troopsAllowed)));
    unitsReadyForSend = {};
    unitsReadyForSend[0] = {};
    unitsReadyForSend[1] = {};
    unitsReadyForSend[2] = {};
    unitsReadyForSend[3] = {};
    if (totalLoot > totalHaul) {
        //too many units
        vLog('[calcUnits] Слишком много юнитов относительно totalHaul (totalLoot > totalHaul), наполняем сверху вниз');
        //prioritise higher category first
        if (version != "old") {
            for (var j = 3; j >= 0; j--) {
                var reach = haulCategoryRate[j + 1];
                vGroup(`[calcUnits] Категория ${j+1}: старт reach=${reach}`);
                sendOrder.forEach((unit) => {
                    if (troopsAllowed.hasOwnProperty(unit) && reach > 0) {
                        var amountNeeded = Math.floor(reach / unitHaul[unit]);

                        if (amountNeeded > troopsAllowed[unit]) {
                            unitsReadyForSend[j][unit] = troopsAllowed[unit];
                            reach = reach - (troopsAllowed[unit] * unitHaul[unit]);
                            troopsAllowed[unit] = 0;
                            vLog(`[calcUnits] ${unit}: требуется=${amountNeeded}, доступно меньше => берем ${unitsReadyForSend[j][unit]}, новый reach=${reach}`);
                        } else {
                            unitsReadyForSend[j][unit] = amountNeeded;
                            reach = 0;
                            troopsAllowed[unit] = troopsAllowed[unit] - amountNeeded;
                            vLog(`[calcUnits] ${unit}: требуется=${amountNeeded}, достаточно => берем ${amountNeeded}, reach=0`);
                        }
                    }
                });
                vGroupEnd();
            }
        }
        else {
            for (var j = 0; j < 4; j++) {
                for (key in troopsAllowed) {
                    unitsReadyForSend[j][key] = Math.floor((haulCategoryRate[j + 1] * (troopsAllowed[key] / totalLoot)));
                }
                vLog(`[calcUnits] old-mode Категория ${j+1}:`, JSON.parse(JSON.stringify(unitsReadyForSend[j])));
            }

        }
    }
    else {
        //not enough units, spread evenly
        troopNumber = 0;
        for (key in troopsAllowed) {
            troopNumber += troopsAllowed[key];
        }
        vLog(`[calcUnits] Недостаточно юнитов: troopNumber=${troopNumber}`);
        if (prioritiseHighCat != true && troopNumber > 130) {
            for (var j = 0; j < 4; j++) {
                vLog('[calcUnits] Равномерное распределение (нет приоритета, troopNumber>130)');
                for (key in troopsAllowed) {
                    unitsReadyForSend[j][key] = Math.floor((totalLoot / totalHaul * haulCategoryRate[j + 1]) * (troopsAllowed[key] / totalLoot));
                }
                vLog(`[calcUnits] Категория ${j+1}:`, JSON.parse(JSON.stringify(unitsReadyForSend[j])));
            }
        }
        else {
            //prioritise higher category first
            for (var j = 3; j >= 0; j--) {
                var reach = haulCategoryRate[j + 1];
                vGroup(`[calcUnits] Приоритет: Категория ${j+1}: старт reach=${reach}`);
                sendOrder.forEach((unit) => {
                    if (troopsAllowed.hasOwnProperty(unit) && reach > 0) {
                        var amountNeeded = Math.floor(reach / unitHaul[unit]);

                        if (amountNeeded > troopsAllowed[unit]) {
                            unitsReadyForSend[j][unit] = troopsAllowed[unit];
                            reach = reach - (troopsAllowed[unit] * unitHaul[unit]);
                            troopsAllowed[unit] = 0;
                            vLog(`[calcUnits] ${unit}: требуется=${amountNeeded}, доступно меньше => берем ${unitsReadyForSend[j][unit]}, новый reach=${reach}`);
                        } else {
                            unitsReadyForSend[j][unit] = amountNeeded;
                            reach = 0;
                            troopsAllowed[unit] = troopsAllowed[unit] - amountNeeded;
                            vLog(`[calcUnits] ${unit}: требуется=${amountNeeded}, достаточно => берем ${amountNeeded}, reach=0`);
                        }
                    }
                });
                vGroupEnd();
            }
        }
    }
    vLog('[calcUnits] Итог unitsReadyForSend:', JSON.parse(JSON.stringify(unitsReadyForSend)));
    vGroupEnd();
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