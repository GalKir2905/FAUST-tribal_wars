//mass scavenging by Sophie "Shinko to Kuma"
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

$("#massScavengeSophie").remove();
//set global variables

if (typeof version == 'undefined') {
    version = "new";
}

//set translations
var langShinko = [
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

// ===== VERBOSE DEBUG LOGGER =====
// Toggle to enable/disable extremely detailed console tracing
if (typeof DEBUG_VERBOSE === 'undefined') {
    var DEBUG_VERBOSE = true;
}
if (typeof window.vLog === 'undefined') {
    window.vLog = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.log.apply(console, arguments); } catch (e) {}
    };
}
if (typeof window.vGroup === 'undefined') {
    window.vGroup = function(title) {
        if (!DEBUG_VERBOSE) return;
        try { console.groupCollapsed(title); } catch (e) {}
    };
}
if (typeof window.vGroupEnd === 'undefined') {
    window.vGroupEnd = function() {
        if (!DEBUG_VERBOSE) return;
        try { console.groupEnd(); } catch (e) {}
    };
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

//colors for UI
if (typeof colors == 'undefined') {
    var backgroundColor = "#36393f";
    var borderColor = "#3e4147";
    var headerColor = "#202225";
    var titleColor = "#ffffdf";
    cssClassesSophie = `
<style>
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
.btnSophie
{
    background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%);
}
.btnSophie:hover
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
        cssClassesSophie = `
        <style>
        .btnSophie
        {
            background-image: linear-gradient(#FEC5E5 0%, #FD5DA8 30%, #FF1694 80%, #E11584 100%);
        }
        .btnSophie:hover
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
        cssClassesSophie = `
        <style>
        .btnSophie
        {
            background-image: linear-gradient(#00a1fe 0%, #5d9afd 30%, #1626ff 80%, #1f15e1 100%);
        }
        .btnSophie:hover
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
        cssClassesSophie = `
        <style>
        .btnSophie
        {
            background-image: linear-gradient(#00a1fe 0%, #5d9afd 30%, #1626ff 80%, #1f15e1 100%);
            color:white
        }
        .btnSophie:hover
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
        cssClassesSophie = `
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
        .btnSophie
        {
            linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%)
            color:white
        }
        .btnSophie:hover
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
        cssClassesSophie = `
            <style>
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
            .btnSophie
            {
                background-image: linear-gradient(#6e7178 0%, #36393f 30%, #202225 80%, black 100%);
            }
            .btnSophie:hover
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
$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

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
    $("#massScavengeSophie").remove();
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
                        <table id="massScavengeSophieFinalTable" class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}">
                        <tr>
                            <td colspan="10" id="massScavengeSophieTitle" style="text-align:center; width:auto; background-color:${headerColor}">
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
                            htmlWithLaunchButtons += `<tr id="sendRow${s}" style="text-align:center; width:auto; background-color:${backgroundColor}"><td style="text-align:center; width:auto; background-color:${backgroundColor}"><center><input type="button"  class="btn btnSophie" id="sendMass" onclick="sendGroup(${s},false)" value="${langShinko[8]}${s + 1}"></center></td><td style="text-align:center; width:auto; background-color:${backgroundColor}"><center><input type="button"  class="btn btn-pp btn-send-premium" id="sendMassPremium" onclick="sendGroup(${s},true)" value="${langShinko[8]}${s + 1} С PREMIUM" style="display:none"></center></td></tr>`
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
<div id="massScavengeSophie" class="ui-widget-content" style="width:580px;background-color:${backgroundColor};cursor:move;z-index:50;max-height:85vh;overflow-y:auto;">

<button class="btn" id = "x" onclick="closeWindow('massScavengeSophie')">
            X
        </button>
    <table id="massScavengeSophieTable" class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}">
        <tr>
            <td colspan="10" id="massScavengeSophieTitle" style="text-align:center; width:auto; background-color:${headerColor}">
                <h4 style="margin:5px">
                    <center><u>
                            <font color="${titleColor}">${langShinko[0]}</font>
                        </u>
                    </center>
                </h4>
            </td>
        </tr>
        <tr style="background-color:${backgroundColor}">
            <td style="text-align:center;background-color:${headerColor}" colspan="15">
                <h5 style="margin:3px">
                    <center><u>
                            <font color="${titleColor}">${langShinko[1]}</font>
                        </u></center>
                </h5>
            </td>
        </tr>
        <tr id="imgRow">
        </tr>
    </table>
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tbody>
            <tr style="background-color:${backgroundColor}">
                <td style="text-align:center;background-color:${headerColor}" colspan="4">
                    <h5 style="margin:3px">
                        <center><u>
                                <font color="${titleColor}">${langShinko[2]}</font>
                            </u></center>
                    </h5>
                </td>
            </tr>
            <tr id="categories" style="text-align:center; width:auto; background-color:${headerColor}">
                <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                    <font color="${titleColor}" style="font-size:12px">${categoryNames[1].name}</font>
                </td>
                <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                    <font color="${titleColor}" style="font-size:12px">${categoryNames[2].name}</font>
                </td>
                <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                    <font color="${titleColor}" style="font-size:12px">${categoryNames[3].name}</font>
                </td>
                <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                    <font color="${titleColor}" style="font-size:12px">${categoryNames[4].name}</font>
                </td>
            </tr>
            <tr>
                <td style="text-align:center; width:auto; background-color:${backgroundColor}">
                    <center><input type="checkbox" ID="category1" name="cat1"></center>
                </td>
                <td style="text-align:center; width:auto; background-color:${backgroundColor}">
                    <center><input type="checkbox" ID="category2" name="cat2"></center>
                </td>
                <td style="text-align:center; width:auto; background-color:${backgroundColor}">
                    <center><input type="checkbox" ID="category3" name="cat3"></center>
                </td>
                <td style="text-align:center; width:auto; background-color:${backgroundColor}">
                    <center><input type="checkbox" ID="category4" name="cat4"></center>
                </td>
            </tr>
        </tbody>
    </table>
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tr id="runtimesTitle" style="text-align:center; width:auto; background-color:${headerColor}">
            <td colspan="3" style="text-align:center; width:auto; background-color:${headerColor}">
                <center style="margin:3px">
                    <font color="${titleColor}" style="font-size:12px">${langShinko[3]}</font>
                </center>
            </td>
        </tr>
        <tr id="runtimes" style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="background-color:${headerColor};"></td>
            <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                <font color="${titleColor}" style="font-size:11px">Атакующие деревни</font>
            </td>
            <td style="text-align:center; width:auto; background-color:${headerColor};padding: 3px;">
                <font color="${titleColor}" style="font-size:11px">Защитные деревни</font>
            </td>
        </tr>
        <tr>
            <td style="width:20px;background-color:${backgroundColor}; padding:2px;"><input type="radio" ID="timeSelectorDate" name="timeSelector" ></td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;">
                <input type="date" id="offDay" name="offDay" value="${setDayToField(runTimes.off)}" style="font-size:11px; width:48%">
                <input type="time" id="offTime" name="offTime" value="${setTimeToField(runTimes.off)}" style="font-size:11px; width:48%">
            </td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;">
                <input type="date" id="defDay" name="defDay" value="${setDayToField(runTimes.def)}" style="font-size:11px; width:48%">
                <input type="time" id="defTime" name="defTime" value="${setTimeToField(runTimes.def)}" style="font-size:11px; width:48%">
            </td>
        </tr>
        <tr>
            <td style="width:20px;background-color:${backgroundColor}; padding:2px;"><input type="radio" ID="timeSelectorHours" name="timeSelector" ></td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;"><input type="text" class="runTime_off" style="background-color:${backgroundColor};color:${titleColor}; font-size:11px; width:90%" value="${runTimes['off']}" onclick="this.select();"></td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;"><input type="text" class="runTime_def" style="background-color:${backgroundColor};color:${titleColor}; font-size:11px; width:90%" value="${runTimes['def']}" onclick="this.select();"></td>
        </tr>
        <tr>
            <td style="width:20px;background-color:${backgroundColor}; padding:2px;"></td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;"><font color="${titleColor}" style="font-size:10px"><span id="offDisplay"></span></font></td>
            <td style="text-align:center; width:auto; background-color:${backgroundColor}; padding:2px;"><font color="${titleColor}" style="font-size:10px"><span id="defDisplay"></span></font></td>
        </tr>
    </table>
    
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
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tbody>
            <tr style="background-color:${backgroundColor}">
                <td style="text-align:center;background-color:${headerColor}" colspan="2">
                    <h5 style="margin:3px">
                        <center><u>
                                <font color="${titleColor}">Фарм-деревни (легкая кавалерия остается дома)</font>
                            </u></center>
                    </h5>
                </td>
            </tr>
            <tr style="text-align:center; width:auto; background-color:${backgroundColor}">
                <td style="text-align:center; width:70%; background-color:${backgroundColor}; padding:5px;">
                    <textarea 
                        id="farmCoords" 
                        class="form-control" 
                        placeholder="Координаты: 123|456 789|012"
                        rows="2"
                        style="width: 100%; background-color: #202225; color: #ffffdf; border: 1px solid #3e4147; padding: 3px; resize: vertical; font-family: inherit; font-size:11px;">
                    </textarea>
                </td>
                <td style="text-align:center; width:30%; background-color:${backgroundColor}; padding:5px; vertical-align: middle;">
                    <input type="button" class="btn btnSophie" id="saveFarmCoordsBtn" value="Сохранить" style="margin: 2px; font-size:11px; padding:3px 8px;">
                </td>
            </tr>
        </tbody>
    </table>
    
    <table class="vis" border="1" style="width: 100%;background-color:${backgroundColor};border-color:${borderColor}; margin-top:5px;">
        <tr style="text-align:center; width:auto; background-color:${headerColor}">
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btnSophie" id="reset" onclick="resetSettings()" value="Сброс" style="font-size:11px; padding:4px 10px;"></center>
            </td>
            <td style="text-align:center; width:50%; background-color:${backgroundColor}; padding:3px;">
                <center><input type="button" class="btn btnSophie" id="sendMass" onclick="readyToSend()" value="${langShinko[5]}" style="font-size:11px; padding:4px 10px;"></center>
            </td>
        </tr>
    </table>

    <div style="text-align:center; margin:5px 0;">
        <img id="sophieImg" class="tooltip-delayed" title="Sophie -Shinko to Kuma-" src="https://dl.dropboxusercontent.com/s/bxoyga8wa6yuuz4/sophie2.gif" style="cursor:help; height:40px;">
    </div>

    <div style="text-align:center;">
        <p style="margin:2px; font-size:11px;">
            <font color="${titleColor}">${langShinko[6]} </font><a href="https://shinko-to-kuma.my-free.website/" style="text-shadow:-1px -1px 0 ${titleColor},1px -1px 0 ${titleColor},-1px 1px 0 ${titleColor},1px 1px 0 ${titleColor}; font-size:11px;" title="Sophie profile" target="_blank">Sophie "Shinko to Kuma"</a>
        </p>
    </div>
</div>
`;

$(".maincell").eq(0).prepend(html);
$("#mobileContent").eq(0).prepend(html);
if (game_data.locale == "ar_AE") {
    $("#sophieImg").attr("src", "https://media2.giphy.com/media/qYr8p3Dzbet5S/giphy.gif");
}
if (is_mobile == false) {
    $("#massScavengeSophie").css("position", "fixed");
    $("#massScavengeSophie").draggable();

}

$("#offDisplay")[0].innerText = fancyTimeFormat(runTimes.off * 3600);
$("#defDisplay")[0].innerText = fancyTimeFormat(runTimes.def * 3600);
if (tempElementSelection == "Date") {
    $(`#timeSelectorDate`).prop("checked", true);
    selectType("Date");
    updateTimers();
}
else {
    $(`#timeSelectorHours`).prop("checked", true);
    selectType("Hours");
    updateTimers();
}

// Загружаем сохраненные farmCoords
var savedFarmCoords = localStorage.getItem("farmCoords");
if (savedFarmCoords) {
    document.getElementById('farmCoords').value = savedFarmCoords;
}

// Вешаем обработчик на кнопку Save
$('#saveFarmCoordsBtn').click(function() {
    cleanCoords('farmCoords');
    var farmCoordsValue = document.getElementById('farmCoords').value;
    localStorage.setItem("farmCoords", farmCoordsValue);
    console.log("Farm coords saved to localStorage");
});

$("#offDay")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$("#defDay")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$("#offTime")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$("#defTime")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$(".runTime_off")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$(".runTime_def")[0].addEventListener("input", function () {
    updateTimers();
}, false)

$("#timeSelectorDate")[0].addEventListener("input", function () {
    selectType('Date');
    updateTimers();
}, false)

$("#timeSelectorHours")[0].addEventListener("input", function () {
    selectType('Hours');
    updateTimers();
}, false)

//create checkboxes and add them to the UI
for (var i = 0; i < sendOrder.length; i++) {
    $("#imgRow").eq(0).append(`<td align="center" style="background-color:${backgroundColor}">
    <table class="vis" border="1" style="width: 80px">
    <tbody>    
        <tr>
            <td style="text-align:center;background-color:${headerColor};padding: 2px;">
                <img src="https://dsen.innogamescdn.com/asset/cf2959e7/graphic/unit/unit_${sendOrder[i]}.png" title="${sendOrder[i]}" alt="" style="height:20px;">
            </td>
        </tr>
        <tr>
            <td align="center" style="background-color:${backgroundColor};padding: 1px;">
                <input type="checkbox" ID="${sendOrder[i]}" name="${sendOrder[i]}" style="transform:scale(0.8)">
            </td>
        </tr>
        <tr>
            <td style="text-align:center; background-color:#202225;padding: 1px;">
                <font color="#ffffdf" style="font-size:9px">Оставить дома</font>
            </td>
        </tr>
        <tr>
            <td align="center" style="background-color:${backgroundColor};padding: 1px;">
                <input type="text" ID="${sendOrder[i]}Backup" name="${sendOrder[i]}" value="${keepHome[sendOrder[i]]}" size="3" style="font-size:10px; width:30px">
            </td>
        </tr>
    </tbody>  
    </table>
</td>`);
    $("#imgRow").sortable({
        axis: "x",
        revert: 100,
        containment: "parent",
        forceHelperSize: true,
        delay: 100,
        scroll: false
    }).disableSelection();

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
$("#sendMass").focus();

function readyToSend() {
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
        var isChecked = $(`:checkbox#${sendOrder[i]}`).is(":checked");
        troopTypeEnabled[sendOrder[i]] = isChecked;
        vLog(`[readyToSend] Чекбокс юнита ${sendOrder[i]} (${selectorCheck}) => ${isChecked}`);
    }
    for (var i = 0; i < sendOrder.length; i++) {
        var selectorBackup = `#${sendOrder[i]}Backup`;
        var backupVal = $(`#${sendOrder[i]}Backup`).val();
        keepHome[sendOrder[i]] = backupVal;
        vLog(`[readyToSend] Поле 'Оставить дома' для ${sendOrder[i]} (${selectorBackup}) => ${backupVal}`);
    }
    vLog("[readyToSend] Итог включенных типов юнитов:", JSON.parse(JSON.stringify(troopTypeEnabled)));
    enabledCategories.push($("#category1").is(":checked"));
    enabledCategories.push($("#category2").is(":checked"));
    enabledCategories.push($("#category3").is(":checked"));
    enabledCategories.push($("#category4").is(":checked"));
    vLog("[readyToSend] Категории (селекторы #category1..#category4) =>", JSON.parse(JSON.stringify(enabledCategories)));

    if ($("#timeSelectorDate")[0].checked == true) {
        localStorage.setItem("timeElement", "Date");
        var offDay = $("#offDay").val();
        var offTime = $("#offTime").val();
        var defDay = $("#defDay").val();
        var defTime = $("#defTime").val();
        vLog(`[readyToSend] Режим времени=Date; поля (#offDay,#offTime,#defDay,#defTime) =>`, { offDay, offTime, defDay, defTime });
        time.off = Date.parse(offDay.replace(/-/g, "/") + " " + offTime);
        time.def = Date.parse(defDay.replace(/-/g, "/") + " " + defTime);
        time.off = (time.off - serverDate) / 1000 / 3600;
        time.def = (time.def - serverDate) / 1000 / 3600;
    }
    else {
        localStorage.setItem("timeElement", "Hours");
        time.off = $('.runTime_off').val();
        time.def = $('.runTime_def').val();
        vLog(`[readyToSend] Режим времени=Hours; поля (.runTime_off,.runTime_def) =>`, { off: time.off, def: time.def });
    }

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

    sendOrder = [];
    for (var k = 0; k < $("#imgRow :checkbox").length; k++) {
        sendOrder.push($("#imgRow :checkbox")[k].name)
    }
    vLog("[readyToSend] Порядок юнитов после сортировки (источник '#imgRow :checkbox[name]'):", JSON.parse(JSON.stringify(sendOrder)));
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
    getData();
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
		
        // ==== ИСПРАВЛЕННЫЙ КОД: Проверяем по localStorage ====
        var savedFarmCoords = localStorage.getItem("farmCoords");
        var farmCoords = [];
        var isFarmVillage = false;
        
        if (savedFarmCoords && savedFarmCoords.trim() !== "") {
            farmCoords = savedFarmCoords.split(' ');
            var currentVillageCoords = data.village_name.match(/[0-9]{3}\|[0-9]{3}/);
            
            if (currentVillageCoords) {
                currentVillageCoords = currentVillageCoords[0];
                isFarmVillage = farmCoords.includes(currentVillageCoords);
                
                vLog(`[calc] Проверка фарм-деревень: coords текущей=${currentVillageCoords}, список=`, farmCoords);
                if (isFarmVillage) vLog(`[calc] В списке фарма -> light будет игнорироваться`);
            }
        }
        // ==== КОНЕЦ ИСПРАВЛЕННОГО КОДА ====
		
        var troopsAllowed = {};
        vGroup('[calc] troopsAllowed: расчет доступных юнитов с учетом чекбоксов и "Оставить дома"');
        for (key in troopTypeEnabled) {
            if (troopTypeEnabled[key] == true) {
                // ==== ИЗМЕНЕНИЕ: Для farm-деревень игнорируем light ====
                if (isFarmVillage && key == "light") {
                    troopsAllowed[key] = 0; // Игнорируем легких коней
                    vLog(`[calc] ${key}: чекбокс=on, но ферма=true => 0 (игнорируем light)`);
                } else if (data.unit_counts_home[key] - keepHome[key] > 0) {
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
            }
        }
    }
    for (var i = 0; i < categoryEnabled.length + 1; i++) {
        if (categoryEnabled[i] == true) {
            var catSel = `#category${i + 1}`;
            $(catSel).prop("checked", true);
            vLog(`[enableCorrectTroopTypes] Устанавливаем чекбокс категории ${catSel} => checked=true`);
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
            }
            else {
                $("#offDay").prop("disabled", true);
                $("#defDay").prop("disabled", true);
                $("#offTime").prop("disabled", true);
                $("#defTime").prop("disabled", true);
                $(".runTime_off").eq(0).removeAttr('disabled');
                $(".runTime_def").eq(0).removeAttr('disabled');
                vLog("[selectType:Hours] disable #offDay,#defDay,#offTime,#defTime; enable .runTime_off,.runTime_def");
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
            }
            else {
                $("#offDay").eq(0).removeAttr('disabled');
                $("#defDay").eq(0).removeAttr('disabled');
                $("#offTime").eq(0).removeAttr('disabled');;
                $("#defTime").eq(0).removeAttr('disabled');
                $(".runTime_off").prop("disabled", true);
                $(".runTime_def").prop("disabled", true);
                vLog("[selectType:Date] enable #offDay,#defDay,#offTime,#defTime; disable .runTime_off,.runTime_def");
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