var statuses = {
    0: "Inhibit",
    1: "Ready",
    2: "Stop",
    3: "Scan",
    4: "Run",
    5: "Supply Loss",
    6: "Deceleration",
    7: "dc Injection",
    8: "Position",
    9: "Trip",
    10: "Active",
    11: "Off",
    12: "Hand",
    13: "Auto",
    14: "Heat",
    15: "Under Voltage",
    16: "Inhibit"
};

var alarms = {
    0: "None",
    1: "Brake Resistor",
    2: "Motor Overload",
    3: "Ind Overload",
    4: "Drive Overload",
    5: "Auto Tune",
    6: "Limit Switch",
    7: "Fire Mode",
    8: "Low Load",
    9: "Option Slot 1",
    10: "Option Slot 2",
    11: "Option Slot 3",
    12: "Option Slot 4"
};


$.ajaxSetup({
    cache: false,
    mimeType: "text/plain"
});

function setClickListeners() {
    $('a.loader').click(function (event) {
        event.preventDefault();

        $('#menu').find('li.selected').each(function () {
            $(this).removeClass('selected');
        });
        $(this).parent().addClass('selected');

        var html_path = $(this).attr('href');
        var id_name = $(this).attr('id');
        $('#content').load(html_path, function completed(resp, status) {
            if (status === 'success' && id_name === 'positioning') {
                $.getScript('script/positioning_partial.js');
            }
        });
    });
}


function preprocess_num(key, obj) {
    return [{
        types: '.' + key,
        value: (obj.value / (Math.pow(10, obj.precision))).toFixed(obj.precision)
    }];
}

function preprocess_bool(key, obj) {
    return [{
        types: '.' + key,
        value: obj.value == "1"
    }];
}

function preprocess_status_word(key, obj) {
    var values = [];
    if (obj.value > 32767 || obj.value < 0) {
        return values;
    }

    var bits = (parseInt(obj.value, 16) >>> 0).toString(2);
    for (var i = 14; i >= 0; i--) {
        values.push({
            types: '#sw_bit_' + i,
            value:  i >= bits.length ? false : bits.charAt(bits.length-i-1) === '1'
        });
    }
    return values;
}

function preprocess_display_status(key, obj) {
    return [{
        types: '.' + key,
        value: statuses[obj.value]
    }];
}

function preprocess_alarm(key, obj) {
    return [{
        types: '.' + key,
        value: alarms[obj.value]
    }];
}


function textLabelsCallback(value) {
    $(value.types).each(function () {
        $(this).text(value.value);
    });
}

var revs;
var pos;
function numberCallback(value) {
    if (revs === undefined && value.types === ".Revolutions") {
        revs = value.value;
        return;
    }

    if (pos === undefined && value.types === ".Position") {
        pos = value.value;
        return;
    }

    if (pos !== undefined && revs !== undefined) {
        var full_position = (+revs + +pos / 65536.0) * 2 * Math.PI;
        revs = pos = undefined;
        $('.rotary').css("transform", "rotate(" + (full_position) + "rad)");
    }
}


function boolCallback(value) {
    $(value.types).each(function () {
        if ($(this).hasClass("alert-warning")) {
            if (value.value)
                $(this).hide();
            else
                $(this).show();
            return;
        }

        var color = (value.value !== "None" && $(this).hasClass("error")) ? "#ff1f00" : "#27ae60";
        $(this).css('background-color', value.value ? color : "#7a7a7a");
    });
}

function alarmCallback(value) {
    $(value.types).each(function () {
        if ($(this).hasClass("indicator")) {
            $(this).css('background-color', (value.value !== "None") ? "#ff1f00" : "#7a7a7a");
            return;
        }

        if (value.value === "None" && $(this).hasClass("alert")) {
            $(this).hide();
        } else {
            $(this).find('span').text(value.value);
            $(this).show();
        }
    });
}

var callbacks = new Map();
callbacks.set("Number", [textLabelsCallback, numberCallback]);
callbacks.set("Bool", [boolCallback]);
callbacks.set("SW", [boolCallback]);
callbacks.set("CodeStatus", [textLabelsCallback]);
callbacks.set("CodeAlarm", [alarmCallback]);

var processors = new Map();
processors.set("Number", preprocess_num);
processors.set("Bool", preprocess_bool);
processors.set("SW", preprocess_status_word);
processors.set("CodeStatus", preprocess_display_status);
processors.set("CodeAlarm", preprocess_alarm);



function createAjaxUpdateReq(url_path, complete_callback) {
    return $.ajax({
        url: url_path,
        method: "POST",
        dataType: 'json',
        complete: complete_callback,
        success: function (feedback) {
            for (var key in feedback) {
                var obj = feedback[key];
                var values = processors.get(obj.type)(key, obj);
                for (var value in values) {
                    var functions = callbacks.get(obj.type);
                    functions.forEach(function (t) {
                        t(values[value]);
                    });
                }
            }
        }
    });
}


var updater = new Object();
updater.jobPool = [];
updater.interval = 1000;
updater.processed = 0;
updater.run = function () {
    for (var i = 0; i < updater.jobPool.length; i++) {
        updater.jobPool[i]();
    }
};

updater.ajax_done = function () {
    updater.processed++;
    if (updater.processed === updater.jobPool.length) {
        updater.processed = 0;
        setTimeout(updater.run, updater.interval);
    }
};


updater.jobPool[0] = function() {createAjaxUpdateReq("data/feedback_ex.json", updater.ajax_done);};
updater.jobPool[1] = function() {createAjaxUpdateReq("data/position_params_ex.json", updater.ajax_done);};
updater.jobPool[2] = function() {createAjaxUpdateReq("data/drive_status_ex.json", updater.ajax_done);};
updater.jobPool[3] = function() {createAjaxUpdateReq("data/drive_commands_ex.json", updater.ajax_done);};



$(document).ready(function () {
    setClickListeners();
    $('#home_page').click();
    updater.run();
});

