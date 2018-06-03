$('#alarm').hide();
$('#hw_enable').hide();

function serializeNameValue(name, value) {
    var encodedName = encodeURIComponent(name);
    var encodedValue = encodeURIComponent(value);
    return (encodedName + "=" + encodedValue).replace(/%20/g, "+");
}

function inputNumberIsValid(input) {
    var value = input.val();
    var min = parseFloat(input.attr("min"));
    var max = parseFloat(input.attr("max"));
    if (!$.isNumeric(value) || +value < min || +value > max) {
        return false;
    }
    return true;
}


$('#controller_param, #additional_form').submit(function () {
   return false; // prevent default action (e.g. on enter)
});

$('form input[type=checkbox]').change(function () {
    var name = $(this).attr('name');
    var value = $(this).is(':checked') == true ? 1 : 0;

    $.post("data/config_bool_params.dat", serializeNameValue(name, value), function () {
        console.log("checkboxes a callback");
    });
});

$('form#controller_param #mode, form#additional_form #speed_ref_select').change(function () {
    var name = $(this).attr('name');
    var value = $(this).find('option:selected').attr('value');

    $.post("data/config_number_params.dat", serializeNameValue(name, value), function () {
        console.log("numbered... b callback");
    });
});

$('#controller_param #speed').change(function () {
    if (!inputNumberIsValid($(this))) {
        return false;
    }

    var value = $(this).val();
    var name = $(this).attr('name');

    $.post("data/config_number_params.dat", serializeNameValue(name, value), function () {
        console.log("numbered... c callback");
    });
});

// additionally send hidden parameter
$('#speed_ref, #speed_ref_select').change(function () {
    var input = $(this).find('#preset_selector');
    var inputName = input.attr("name");
    var inputValue = input.val();

    $.post("data/config_number_params.dat", serializeNameValue(inputName, inputValue), function () {
        console.log("input send");
    });
});

$('#additional_form #speed_ref').change(function () {
    var numString =$(this).val().toString();
    if (!inputNumberIsValid($(this)) ||
        numString.lastIndexOf(".") < numString.length-2) {
        return false;
    }

    var value = ($(this).val() * 10).toFixed(0);
    var name = $(this).attr('name');

    $.post("data/config_number_params.dat", serializeNameValue(name, value), function () {
        console.log("numbered... d callback");
    });
});


$('form#position_form').submit(function () {
    var valid = true;
    $('form#position_form input[type=number]').each(function () {
       if(!inputNumberIsValid($(this))){
           valid = false;
       }
    });

    if (valid) {
        $.post("data/config_number_params.dat", $(this).serialize(), function () {
            console.log("numbered... e callback");
        });
    }

    return false;
});

$('form#function_form').submit(function () {
    var valid = true;
    $(this).find('input[type=number]').each(function () {
        if(!inputNumberIsValid($(this))) {
            valid = false;
        }
    });

    if (valid) {
        $.post("data/position_function_params.dat", $(this).serialize(), function () {
            console.log("numbered... f callback");
        });
    }

    return false;
});