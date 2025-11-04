var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

var version = "1.13.2";
var scriptName = "LA Enhancer (1.13.2)";
var scriptURL = "https://ntoombs19.github.io/LA-Enhancer/";
var updateNotesURL = "https://ntoombs19.github.io/LA-Enhancer/";
var working = true;
var resourcesLoaded = false;
var scriptLoaded = false;
var pagesLoaded = false;
var filtersApplied = false;
var cansend = true;
var keySetMode = false;
var hideRow = false;
var editingKey = false;
var troubleshoot = false;
var clearProfiles = false;
var reason = [];
var keyToEdit;
var current_units;
var currentGameTime = getCurrentGameTime();
var sitter = "";
if (window.top.game_data.player.sitter != "0") {
    sitter = "t=" + window.top.game_data.player.id + "&";
}
var link = ["https://" + window.location.host + "/game.php?" + sitter + "village=", "&screen=am_farm"];


var userset;
var s = {
    start_page: 0,
    end_page: 1,
    order_by: 2,
    direction: 3,
    all_none: 4,
    blue: 5,
    green: 6,
    yellow: 7,
    red_yellow: 8,
    red_blue: 9,
    red: 10,
    hide_recent_farms: 11,
    sent_time_filter: 12,
    hide_recent_time: 13,
    enable_hauls: 14,
    full: 15,
    partial: 16,
    enable_attacks: 17,
    attack_operator: 18,
    attack_value: 19,
    enable_walls: 20,
    wall_operator: 21,
    wall_value: 22,
    enable_distances: 23,
    distance_operator: 24,
    distance_value: 25,
    enable_scout: 26,
    scout_report_operator: 27,
    haul_value: 28,
    continent_display: 29,
    continents_list: 30,
    enable_time: 31,
    attack_time_filter: 32,
    time_value: 33,
    enable_auto_run: 34,
    next_village_no_farms: 35,
    next_village_scouts: 36,
    scouts_left: 37,
    next_village_farming_troops: 38,
    farming_troops_left: 39,
    next_village_units: 40
};
var keycodes = {"a": 65, "b": 66, "c": 67, "skip": 83, "right": 39, "left": 37, "master": 77};
var keyPressSettings = {
    "a_code": 65,
    "a_char": "A",
    "b_code": 66,
    "b_char": "B",
    "c_code": 67,
    "c_char": "C",
    "master_code": 77,
    "master_char": "M",
    "skip_code": 83,
    "skip_char": "S",
    "left_code": 37,
    "left_char": "←",
    "right_code": 39,
    "right_char": "→",
    "priorityOneEnabled": true,
    "priorityOneProfile": "По умолчанию",
    "priorityOneButton": "Пропустить",
    "priorityTwoEnabled": true,
    "priorityTwoProfile": "По умолчанию",
    "priorityTwoButton": "Пропустить",
    "priorityThreeEnabled": true,
    "priorityThreeProfile": "По умолчанию",
    "priorityThreeButton": "Пропустить",
    "defaultButton": "Пропустить"
};
var availableLangs = ["ru", "en", "es", "el", "ar", "it"];

// Установка русского языка по умолчанию
if (window.top.$.jStorage.get("language") == null) {
    window.top.$.jStorage.set("language", "ru");
}

window.top.$.getScript(scriptURL + 'lib/jstorage.js', function () {
    window.top.$.getScript(scriptURL + "resources.js", function () {
        window.top.$.getScript(scriptURL + "lang/" + window.top.$.jStorage.get("language") + '.js', function () {
            console.log("init");
            checkPage();
        });
    });
    window.top.$.getScript(scriptURL + 'notify.js');
});

function run() {
    console.log("run");
    checkVersion();
    checkWorking();
    setVersion();
    makeItPretty();
    showSettings();
    turnOnHotkeys();
    hotkeysOnOff();
    if (userset[s.enable_auto_run] != false) {
        applySettings();
    }
}

function checkVersion() {
    if (getVersion() != version) {
        buttons = [{text: 'OK', callback: null, confirm: true}];
        if (clearProfiles) {
            var profileList = window.top.$.jStorage.get("profileList");
            window.top.$.each(profileList, function (i, val) {
                window.top.$.jStorage.deleteKey("profile:" + val);
            });
            window.top.$.jStorage.set("keyPressSettings", keyPressSettings);
            Dialog.show("update_dialog", "Этот скрипт был недавно обновлен до версии <span style='font-weight:bold;'>" + version + "</span> и для работы новой версии все профили и настройки должны быть сброшены. Приносим извинения за неудобства.<br /><br/><a href='" + updateNotesURL + "' target='_blank'>Что нового</a>.</br>Я удалил разницу между оригинальной и альтернативной версиями скрипта. Теперь обе версии одинаково быстры и даже быстрее, чем любая из версий раньше. Если у вас возникнут проблемы, пожалуйста, свяжитесь со мной на форуме! </br></br>Наслаждайтесь!</br>Ibra Gonza II");
        }
        else {
            Dialog.show("update_dialog", "Этот скрипт был недавно обновлен до версии <span style='font-weight:bold;'>" + version + "</span><br /><br/><a href='" + updateNotesURL + "' target='_blank'>Что нового</a>.</br>Я удалил разницу между оригинальной и альтернативной версиями скрипта. Теперь обе версии одинаково быстры и даже быстрее, чем любая из версий раньше. Если у вас возникнут проблемы, пожалуйста, свяжитесь со мной на форуме! </br></br>Наслаждайтесь!</br>Ibra Gonza II");
        }
    } else {
    }
}

function checkWorking() {
    var acknowledged = window.top.$.jStorage.get("working");
    if (acknowledged == null) {
        window.top.$.jStorage.set("working", false);
    }
    if (getVersion() != version) {
        window.top.$.jStorage.set("working", false);
    }
    if (working == false && acknowledged == false) {
        buttons = [{text: 'OK', callback: null, confirm: true}];
        window.top.UI.ConfirmationBox("В этой версии обнаружена ошибка. Вы можете продолжить тестирование скрипта, если не заметили ошибку.", buttons, false, []);
        window.top.$.jStorage.set("working", true);
    }
}

function setVersion() {
    window.top.$.jStorage.set("version", version);
}

function getVersion() {
    var ver = window.top.$.jStorage.get("version");
    if (ver == undefined) {
        setVersion();
        return version;
    }
    return ver;
}

function showAllRows() {
    var pages = window.top.$.trim(window.top.$('#plunder_list_nav tr:first td:last').children().last().html().replace(/\D+/g, ''));
    if (window.top.$('#end_page').val() == "max") {
        window.top.$('#end_page').text(pages);
    }
    window.top.$('#am_widget_Farm tr:last').remove();
    if (pages > parseInt(window.top.$('#end_page').val(), 10)) {
        pages = parseInt(window.top.$('#end_page').val(), 10);
    }
    setTimeout(function () {
        getPage((parseInt(window.top.$('#start_page').val(), 10) - 1), pages);
    }, 1);
}

function getPage(i, pages) {
    if (i < pages) {
        changeHeader("Фильтрация " + (i + 1) + "/" + pages + " <img src='graphic/throbber.gif' height='24' width='24'></img>");
        var url = link[0] + window.top.game_data.village.id + "&order=" + userset[s.order_by] + "&dir=" + userset[s.direction] + "&Farm_page=" + i + "&screen=am_farm";
        window.top.$.ajax({
            type: 'GET', url: url, dataType: "html", error: function (xhr, statusText, error) {
                console.log("Get page failed with error: " + error);
            }, success: function (data) {
                window.top.$('#plunder_list tr', data).slice(2).each(function () {
                    window.top.$('#plunder_list tr:last').after("<tr>" + window.top.$(this).html() + "</tr>");
                });
                setTimeout(function () {
                    getPage(i + 1, pages);
                }, 1);
            }
        });
    } else {
        setTimeout(function () {
            addTableInfo();
            applyFilters();
            changeHeader("LA Enhancer");
            highlightRows();
        }, 1);
        window.top.$('#plunder_list').show();
        window.top.Accountmanager.initTooltips();
        pagesLoaded = true;
        cansend = true;
    }
}

function changeHeader(string) {
    window.top.$("h3:first").html(string);
}

function highlightRows() {
    window.top.$('#am_widget_Farm table').each(function () {
        window.top.$('tr:even:gt(0) td', this).not("table:first").css("backgroundColor", "#FFF5DA");
        window.top.$('tr:odd:gt(0) td', this).not("table:first").css("backgroundColor", "#F0E2BE");
    });
}

function getNewVillage(way) {
    //console.log(getNewVillage);
    if (way == "n")
        window.top.UI.InfoMessage('Переключение на следующую деревню...', 500); else
        window.top.UI.InfoMessage('Переключение на предыдущую деревню...', 500);
    window.onkeydown = function () {
    };
    cansend = false;
    filtersApplied = false;
    Timing.pause();
    fadeThanksToCheese();
    openLoader();
    var vlink = link[0] + way + window.top.game_data.village.id + link[1];
    window.top.$.ajax({
        type: "GET", url: vlink, dataType: "html", error: function (xhr, statusText) {
            alert("Ошибка: " + statusText);
            window.top.$('#fader').remove();
            window.top.$('#loaders').remove();
        }, success: function (data) {
            var v = window.top.$(data);
            var titlePat = /<\s*title\s*>([^<]+)<\/title\s*>/g;
            var titleMatch = titlePat.exec(data);
            var title = titleMatch[1];
            var newGameData = window.top.$.parseJSON(data.split("TribalWars.updateGameData(")[1].split(");")[0]);
            window.top.game_data = newGameData;
            if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
                history.pushState({}, window.top.game_data.village.name + " - Loot Assistant", "https://" + window.top.location.host + game_data.link_base_pure + 'am_farm');
            }
            window.top.$('#header_info').html(window.top.$('#header_info', v).html());
            window.top.$('#topContainer').html(window.top.$('#topContainer', v).html());
            window.top.$('#contentContainer').html(window.top.$('#contentContainer', v).html());
            window.top.$('#quickbar_inner').html(window.top.$('#quickbar_inner', v).html());
            window.top.$('head').find('title').html(title);
            window.top.$('#fader').remove();
            window.top.$('#loaders').remove();
            Timing.resetTickHandlers();
            Timing.pause();
            pagesLoaded = false;
            cansend = false;
            run();
        }
    });
}

function showSettings() {
    window.top.$('head').append("<link type='text/css' rel='stylesheet' href='" + scriptURL + "css/style.css' />");
	window.top.$("#contentContainer h3").eq(0).after(window.top.$("<div class='vis'id='settingsDiv'><table class='settingsTable'><thead><tr><th colspan='5'class='vis'style='padding:0px;'><h4> " + scriptName + " - <a href='https://web.archive.org/web/20240307223803/http://forum.tribalwars.net/showthread.php?266604-ntoombs19-s-FA-Filter'target='_blank'>Форум</a> - Язык: <select id='language'style='margin:0px;'onchange='loadLanguage(window.top.$(&quot;#language&quot;).val())'></select><span style='font-size:10px;float:right;font-weight:normal;font-style:normal'>Скрипт от <a href='https://web.archive.org/web/20240307223803/http://forum.tribalwars.net/member.php?22739-ntoombs19'target='_blank'>ntoombs19</a>&nbsp;<div class='vis'style='float:right;text-align:center;line-height:100%;width:12px;height:12px;margin:0px 0px 0px 0px;position:relative;background-color:tan;opacity:.7'><a href='#'num='2'onclick='uglyHider(window.top.$(this));return false;'>-</a></div></span></h4></th></tr></thead><tbody id='settingsBody'><tr><td class='col1'style='min-width:200px'><span>Страница</span>&nbsp;<input type='text'value=''size='2'maxlength='3'id='start_page'>&nbsp;<span>по</span>&nbsp;<input type='text'value=''size='2'maxlength='3'id='end_page'></td><td colspan='3'><span style='font-weight:bold'>Фильтры</span>&nbsp;<img src='graphic/questionmark.png'width='13'height='13'id='enable_help'></td><td rowspan='5'valign='top'><form><input type='checkbox'id='all_none'>&nbsp;<label for='all_none'style='font-weight:bold'>Все/Ничего</label>&nbsp;<img src='graphic/questionmark.png'width='13'height='13'id='report_help'><br><input type='checkbox'id='blue'><label for='blue'><img src='graphic/dots/blue.png'>&nbsp;Синий</label><br><input type='checkbox'id='green'><label for='green'><img src='graphic/dots/green.png'>&nbsp;Зеленый</label><br><input type='checkbox'id='yellow'><label for='yellow'><img src='graphic/dots/yellow.png'>&nbsp;Желтый</label><br><input type='checkbox'id='red_yellow'><label for='red_yellow'><img src='graphic/dots/red_yellow.png'>&nbsp;Красный-Желтый</label><br><input type='checkbox'id='red_blue'><label for='red_blue'><img src='graphic/dots/red_blue.png'>&nbsp;Красный-Синий</label><br><input type='checkbox'id='red'><label for='red'><img src='graphic/dots/red.png'>&nbsp;Красный</label></form></td></tr><tr><td rowspan='2'><label for='order_by'>Сортировка:</label>&nbsp;<select id='order_by'val='distance'><option value='distance'>Расстояние</option><option value='date'>Дата</option></select><br><label for='direction'>Направление:</label>&nbsp;<select id='direction'val='desc'><option value='asc'>По возрастанию</option><option value='desc'>По убыванию</option></select></td><td style='width:26px'><input type='checkbox'id='enable_hauls'></td><td style='width:110px'><label for='enable_hauls'>Добыча</label></td><td><input type='radio'name='hauls'id='full'><label for='full'><img src='graphic/max_loot/1.png'>Полная</label>&nbsp;<input type='radio'name='hauls'id='partial'><label for='partial'><img src='graphic/max_loot/0.png'>Частичная</label></td></tr><tr><td><input type='checkbox'id='enable_attacks'></td><td><label for='enable_attacks'>Атаки</label></td><td><select id='attack_operator'><option value='greater_than'>Больше чем</option><option value='less_than'>Меньше чем</option><option value='equal_to'>Равно</option></select>&nbsp;<input type='text'id='attack_value'size='2'maxlength='2'value=''></td></tr><tr><td rowspan='1'><span style='font-weight:bold;'>Авто-смена деревни</span></td><td><input type='checkbox'id='enable_walls'></td><td><label for='enable_walls'>Стена</label></td><td><select id='wall_operator'><option value='greater_than'>Больше чем</option><option value='less_than'>Меньше чем</option><option value='equal_to'>Равно</option></select>&nbsp;<input type='text'id='wall_value'size='2'maxlength='2'value=''></td></tr><tr><td><input type='checkbox'id='next_village_no_farms'><label for='next_village_no_farms'>Нет ферм</label></td><td><input type='checkbox'id='enable_distances'></td><td><label for='enable_distances'>Расстояние</label></td><td><select id='distance_operator'val='greater_than'><option value='greater_than'>Больше чем</option><option value='less_than'>Меньше чем</option><option value='equal_to'>Равно</option></select>&nbsp;<input type='text'id='distance_value'size='2'maxlength='2'value=''></td></tr><tr><td><input type='checkbox' id='next_village_units' />Не хватает войск</td><td><input type='checkbox' id='enable_continents' /><td colspan='3'><select id='continent_display'><option value='hide'>Скрыть</option><option value='show'>Показать</option></select>&nbsp;<label for='continents_list'>Континенты</label>&nbsp;<input type='text'size='2'maxlength='150'id='continents_list'value=''>&nbsp;<img src='graphic/questionmark.png'height='13'id='continent_help'></td></tr><tr><td><input type='checkbox' id='next_village_scouts' /><input type='text' size='2' id='scouts_left' /> Шпионов осталось</td><td><input type='checkbox'id='enable_scout'></td><td colspan='3'><label for='enable_scout'>Разведка</label>&nbsp;<select id='scout_report_operator'val='greater_than'><option value='greater_than'>Больше чем</option><option value='less_than'>Меньше чем</option><option value='equal_to'>Равно</option></select>&nbsp;<input type='text'id='haul_value'size='9'maxlength='7'value=''></td></tr><tr><td><input type='checkbox' id='next_village_farming_troops' /><input type='text' size='2' id='farming_troops_left' /> Ферм. войск осталось</td><td><input type='checkbox'id='enable_time'></td><td colspan='3'><select id='attack_time_filter'val='hide'><option value='hide'>Скрыть</option><option value='show'>Показать</option></select>&nbsp;<label for='enable_time'>Время атаки</label>&nbsp;<input type='text'id='time_value'size='2'maxlength='4'value=''><span>минут</span></td></tr><tr><td><input type='checkbox'id='enable_auto_run'><label for='enable_autoRun'>Авто-запуск</label></td><td><input type='checkbox' id='hide_recent_farms' /></td><td colspan='3'><select id='sent_time_filter'val='hide'><option value='hide'>Скрыть</option><option value='show'>Показать</option></select>&nbsp;Скрыть фермы отправленные <input type='text' size='2' id='hide_recent_time' /> минут назад</td></tr><tr><th>Горячие клавиши</th><th colspan='4'>Приоритеты</th></tr><tr><td rowspan='4'><table><tr class='hotkey_values'><td><a href='#'onclick='return setKeyEditMode(\"A\")'id='button_a'class='farm_icon farm_icon_a'></a></td><td><a href='#'onclick='return setKeyEditMode(\"B\")'id='button_b'class='farm_icon farm_icon_b'></a></td><td><a href='#'onclick='return setKeyEditMode(\"C\")'id='button_c'class='farm_icon farm_icon_c'></a></td><td><a href='#'onclick='return setKeyEditMode(\"Master\")'id='button_master'class='farm_icon farm_icon_m'></a></td></tr><tr class='hotkey_values'><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_a'value='A'></td><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_b'value='B'></td><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_c'value='C'></td><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_master'value='M'></td></tr><tr class='hotkey_values'><td colspan='2'><input class='btn tooltip'onclick='return setKeyEditMode(\"Skip\")'type='button'value='Пропустить'style='margin:0px 0px 0px 0px'title='Пропустить ферму'></td><td><input class='btn tooltip'onclick='return setKeyEditMode(\"Left\")'type='button'value='←'style='margin:0px 0px 0px 0px'title='Предыдущая деревня'></td><td><input class='btn tooltip'type='button'onclick='return setKeyEditMode(\"Right\")'value='→'style='margin:0px 0px 0px 0px'title='Следующая деревня'></td></tr><tr class='hotkey_values'><td colspan='2'><input type='text'class='hotkey_value' READONLY id='hotkey_value_skip'value='S'></td><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_left'value='←'></td><td><input type='text'class='hotkey_value' READONLY id='hotkey_value_right'value='→'></td></tr></table></td><td><input type='checkbox' onchange='return updateKeypressSettings();' id='priorityOneEnabled'/></td><td colspan='3'>Профиль <select id='priorityOneProfile' onchange='return updateKeypressSettings();'></select> Кнопка <select id='priorityOneButton' onchange='return updateKeypressSettings();'><option val='Пропустить'>Пропустить</option><option val='A'>A</option><option val='B'>B</option><option val='C'>C</option></select></td></tr><tr><td><input type='checkbox' onchange='return updateKeypressSettings();' id='priorityTwoEnabled'/></td><td colspan='3'>Профиль <select id='priorityTwoProfile' onchange='return updateKeypressSettings();'></select> Кнопка <select id='priorityTwoButton' onchange='return updateKeypressSettings();'><option val='Пропустить'>Пропустить</option><option val='A'>A</option><option val='B'>B</option><option val='C'>C</option></select></td></tr><tr><td><input type='checkbox' onchange='return updateKeypressSettings();' id='priorityThreeEnabled'/></td><td colspan='3'>Профиль <select id='priorityThreeProfile' onchange='return updateKeypressSettings();'></select> Кнопка <select id='priorityThreeButton' onchange='return updateKeypressSettings();'><option val='Пропустить'>Пропустить</option><option val='A'>A</option><option val='B'>B</option><option val='C'>C</option></select></td></tr><tr><td colspan='4'>Кнопка по умолчанию <select id='defaultButton' onchange='return updateKeypressSettings();'><option val='Пропустить'>Пропустить</option><option val='A'>A</option><option val='B'>B</option><option val='C'>C</option></select></td></tr><tr><td colspan='5'><div style='float:left'><input type='submit'value='Применить'onclick='applySettings()'>&nbsp;<input type='submit'value='Сбросить'onclick='resetTable()'></div><div style='float:right'><img src='graphic/questionmark.png'width='13'height='13'id='profile_help'>&nbsp;<label for='settingsProfile'>Профиль:</label>&nbsp;<select id='settingsProfile'onchange='changeProfile(window.top.$(&quot;#settingsProfile&quot;).val())'></select>&nbsp;<input type='submit'value='Создать'onclick='createProfile()'>&nbsp;<input type='submit'value='По умолчанию'onclick='setDefaultProfile()'>&nbsp;<input type='submit'value='Удалить'onclick='deleteProfile()'>&nbsp;<input type='submit'value='Обновить'onclick='updateProfile()'>&nbsp;<input type='submit'value='Экспорт'onclick='exportProfile()'>&nbsp;<input type='submit'value='Импорт'onclick='importProfile()'></div></td></tr></tbody></table></div>"));
    formatSettings();
    addLanguages();
    window.top.$("#language option[value='" + window.top.$.jStorage.get("language") + "']").attr("selected", "selected");
}

// Остальные функции остаются без изменений, но будут использовать русские тексты из language файла

function formatSettings() {
    window.top.$("#all_none").bind("click", function () {
        window.top.$(this).closest('form').find(':checkbox').prop('checked', this.checked);
    });
    var reportHelp = window.top.$('#report_help');
    reportHelp.attr('title', 'Отметьте отчеты, которые хотите скрыть. Синий = игрок не в игре, Зеленый = игрок в игре, Желтый = игрок в режиме отпуска, Красный-Желтый = игрок в режиме отпуска с защитой, Красный-Синий = игрок не в игре с защитой, Красный = игрок в игре с защитой.');
    window.top.UI.ToolTip(reportHelp);
    var enableHelp = window.top.$('#enable_help');
    enableHelp.attr('title', 'Включите фильтры, которые хотите использовать. Каждый фильтр имеет свои настройки.');
    window.top.UI.ToolTip(enableHelp);
    var continentHelp = window.top.$('#continent_help');
    continentHelp.attr('title', 'Введите номера континентов через точку (например: 44.45.46)');
    window.top.UI.ToolTip(continentHelp);
    var recentHelp = window.top.$('#recent_help');
    recentHelp.attr('title', 'Скрыть фермы, на которые уже отправлялись атаки в течение указанного времени');
    window.top.UI.ToolTip(recentHelp);
    var profileHelp = window.top.$('#profile_help');
    profileHelp.attr('title', 'Создавайте и управляйте профилями настроек для разных ситуаций');
    window.top.UI.ToolTip(profileHelp);
    loadDefaultProfile();
    fillProfileList();
    fillMasterSettings();
    fillKeypressSettings();
}

// ... остальной код без изменений ...

function loadDefaultProfile() {
    if (window.top.$.jStorage.get("profile:По умолчанию") == null) {
        window.top.$.jStorage.set("profile:По умолчанию", ["1", "1", "distance", "asc", false, false, false, false, false, false, false, false, "hide", "", false, false, false, false, "greater_than", "", false, "greater_than", "", false, "greater_than", "", false, "greater_than", "", "hide", "", false, "hide", "", false, false, false, "", false, "", false]);
        window.top.$.jStorage.deleteKey("profileList");
        window.top.$.jStorage.set("profileList", ["По умолчанию"]);
    }
    userset = window.top.$.jStorage.get("profile:По умолчанию");
    loadProfile("По умолчанию");
    window.top.$('#settingsProfile').val("По умолчанию");
}

function addLanguages() {
    window.top.$('#language').append("<option value='ru'>Русский</option>");
    window.top.$('#language').append("<option value='en'>English</option>");
    window.top.$('#language').append("<option value='el'>Ελληνικά</option>");
    window.top.$('#language').append("<option value='it'>Italiano</option>");
    window.top.$('#language').append("<option value='es'>Español</option>");
    window.top.$('#language').append("<option value='ar'>اللغة العربية</option>");
}

function parseBool(value) {
    return (typeof value === "undefined") ? false : value.replace(/^\s+|\s+window.top.$/g, "").toLowerCase() === "true";
}
function getURL() {
    var domain = window.location.hostname;
    domain = domain.split('.');
    return domain;
}
function checkPage() {
    console.log("checkPage");
    if (!(window.top.game_data.screen === 'am_farm')) {
        getFA();
    } else {
        run();
    }
}
function getFA() {
    console.log("getFA");
    fadeThanksToCheese();
    openLoader();
    var vlink = link[0] + window.top.game_data.village.id + link[1];
    window.top.$.getScript("https://" + window.top.location.host + "/js/game/Accountmanager.js", function () {
        window.top.$.ajax({
            type: "GET", url: vlink, dataType: "html", error: function (xhr, statusText, error) {
                alert("Get LA error: " + error);
                window.top.$('#fader').remove();
                window.top.$('#loaders').remove();
            }, success: function (data) {
                var v = window.top.$(data);
                var titlePat = /<\s*title\s*>([^<]+)<\/title\s*>/g;
                var titleMatch = titlePat.exec(data);
                var title = titleMatch[1];
                var newGameData = window.top.$.parseJSON(data.split("TribalWars.updateGameData(")[1].split(");")[0]);
                window.top.game_data = newGameData;
                if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
                    history.pushState({}, window.top.game_data.village.name + " - Loot Assistant", "https://" + window.top.location.host + game_data.link_base_pure + 'am_farm');
                }
                window.top.$('#header_info').html(window.top.$('#header_info', v).html());
                window.top.$('#topContainer').html(window.top.$('#topContainer', v).html());
                window.top.$('#contentContainer').html(window.top.$('#contentContainer', v).html());
                window.top.$('head').find('title').html(title);
                window.top.$('#fader').remove();
                window.top.$('#loaders').remove();
                console.log("getFA");
                run();
            }
        });
    });
}
function fadeThanksToCheese() {
    var fader = window.top.document.createElement('div');
    fader.id = 'fader';
    fader.style.position = 'fixed';
    fader.style.height = '100%';
    fader.style.width = '100%';
    fader.style.backgroundColor = 'black';
    fader.style.top = '0px';
    fader.style.left = '0px';
    fader.style.opacity = '0.6';
    fader.style.zIndex = '12000';
    window.top.document.body.appendChild(fader);
}
function openLoader() {
    var widget = window.top.document.createElement('div');
    widget.id = 'loaders';
    widget.style.position = 'fixed';
    widget.style.width = '24px';
    widget.style.height = '24px';
    widget.style.top = '50%';
    widget.style.left = '50%';
    window.top.$(widget).css("margin-left", "-12px");
    window.top.$(widget).css("margin-top", "-12px");
    widget.style.zIndex = 13000;
    window.top.$(widget).append(window.top.$("<img src='graphic/throbber.gif' height='24' width='24'></img>"));
    window.top.$('#contentContainer').append(window.top.$(widget));
}
function makeItPretty() {
    window.top.$('.row_a').css("background-color", "rgb(216, 255, 216)");
    window.top.$('#plunder_list tr').eq(0).remove();
    window.top.$('#plunder_list').find('tr:gt(0)').each(function (index) {
        window.top.$(this).removeClass('row_a');
        window.top.$(this).removeClass('row_b');
        if (index % 2 == 0) {
            window.top.$(this).addClass('row_a');
        } else {
            window.top.$(this).addClass('row_b');
        }
    });
    hideStuffs();
    console.log("makeItPretty");

}
function hideStuffs() {
    window.top.$('#plunder_list').hide();
    window.top.$('#plunder_list_nav').hide();
    window.top.$('#contentContainer').find('div[class="vis"]').eq(0).children().eq(0).append(window.top.$("<div class='vis' style='float:right;text-align:center;line-height:100%;width:12px;height:12px;margin:0px 0px 0px 0px;position:relative;background-color:tan;opacity:.7'><a href='#' num='0' onclick='uglyHider(window.top.$(this));return false;'>+</a></div>"));
    window.top.$('#contentContainer').find('div[class="vis"]').eq(0).children().eq(1).hide();
    window.top.$('#am_widget_Farm').find('h4').eq(0).append(window.top.$("<div class='vis' style='float:right;text-align:center;line-height:100%;width:12px;height:12px;margin:0px 0px 0px 0px;position:relative;background-color:tan;opacity:.7'><a href='#' num='1' onclick='uglyHider(window.top.$(this));return false;'>+</a></div>"));
    window.top.$('#plunder_list_filters').hide();
}
function uglyHider(linker) {
    var basd;
    if (window.top.$('#settingsBody').length > 0) {
        basd = 2;
    } else {
        basd = 1;
    }
    if (window.top.$(linker).text() === "+") {
        window.top.$(linker).text("-");
    } else {
        window.top.$(linker).text("+");
    }
    if (parseInt(window.top.$(linker).attr('num')) == 0) {
        window.top.$('#contentContainer').find('div[class="vis"]').eq(basd).children().eq(1).toggle();
    } else if (parseInt(window.top.$(linker).attr('num')) == 1) {
        window.top.$('#plunder_list_filters').toggle();
    } else if (parseInt(window.top.$(linker).attr('num')) == 2) {
        window.top.$('#settingsBody').toggle();
    }
}


}
