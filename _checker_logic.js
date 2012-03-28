var fs = require('fs');
var jshint = require('./jshint').JSHINT;
var Parser = require('./parser').Parser;


var SpellChecker = function () {
    var definedMethods = [
        ["hasOwnProperty", "ECMA"],
        ["toString", "ECMA"],
        ["parse", "ECMA"],
        ["stringify", "ECMA"],
        ["log", "ECMA"],
        ["isNaN", "ECMA"],
        ["push", "ECMA"],
        ["pop", "ECMA"],
        ["sort", "ECMA"],
        ["reverse", "ECMA"],
        ["slice", "ECMA"],
        ["splice", "ECMA"],
        ["max", "ECMA"],
        ["min", "ECMA"],
        ["sin", "ECMA"],
        ["cos", "ECMA"],
        ["ceil", "ECMA"],
        ["floor", "ECMA"],
        ["toLowerCase", "ECMA"],
        ["toUpperCase", "ECMA"],
        ["destroy", "ngCore"],
        ["subclass", "ngCore"],
        ["singleton", "ngCore"],
        ["addChild", "ngCore"],
        ["removeChild", "ngCore"],
        ["getTouchEmitter", "ngCore"],
        ["addListener", "ngCore"],
        ["removeListener", "ngCore"],
        ["setInterfaceOrientation", "ngCore"],
        ["getWidth", "ngCore"],
        ["getHeight", "ngCore"],
        ["getOuterWidth", "ngCore"],
        ["getOuterHeight", "ngCore"],
        ["getScreenWidth", "ngCore"],
        ["getScreenHeight", "ngCore"],
        ["getPlatformOS", "ngCore"],
        ["setPosition", "ngCore"],
        ["getPosition", "ngCore"],
        ["setRotation", "ngCore"],
        ["getRotation", "ngCore"],
        ["setScale", "ngCore"],
        ["getScale", "ngCore"],
        ["setDepth", "ngCore"],
        ["getDepth", "ngCore"],
        ["setAnchor", "ngCore"],
        ["getAnchor", "ngCore"],
        ["setText", "ngCore"],
        ["readFile", "ngCore"]
    ];

    var validMethods = [];
    var validMap = {};
    var errors = [];

    function registerMethod(methodName, option)
    {
        if (validMap[methodName] === "valid")
        {
            console.log("dump: " + methodName);
        }
        if (validMethods[methodName.length] === undefined)
        {
            validMethods[methodName.length] = [[methodName, option]];
        }
        else
        {
            validMethods[methodName.length].push([methodName, option]);
        }
        validMap[methodName] = "valid";
    }

    function init()
    {
        for (var i = 0; i < definedMethods.length; i++)
        {
            var method = definedMethods[i];
            registerMethod(method[0], method[1]);
        }
    }

    var startsWithNew = function (tokens, index)
    {
        --index;
        var shouldIdentifier = true;
        while (index > 0)
        {
            if (shouldIdentifier)
            {
                if (!tokens[index].identifier)
                {
                    return false;
                }
            }
            else
            {
                if (tokens[index].value !== ".")
                {
                    if (tokens[index].identifier)
                    {
                        return (tokens[index].value === "new");
                    }
                }
            }
            shouldIdentifier = !shouldIdentifier;
            --index;
        }
    };

    var findMethodName = function (tokens, jsdocs)
    {
        var i = 0;
        var checktarget = [];
        for (;;)
        {
            var token = tokens[i];
            if (token.type === "(end)")
            {
                return checktarget;
            }
            if (token.value === ":" && token.type === "(punctuator)")
            {
                if (tokens[i - 1].identifier && tokens[i + 1].value === "function")
                {
                    var methodname = tokens[i - 1].value;
                    registerMethod(methodname, "line " + tokens[i - 1].line);
                    i += 3;
                }
            }
            else if (token.value === "(" && token.type === "(punctuator)")
            {
                if (tokens[i - 1].identifier && tokens[i - 2].value === ".")
                {
                    if (!startsWithNew(tokens, i))
                    {
                        checktarget.push([tokens[i - 1].value, token.line]);
                    }
                }
                else if (tokens[i - 1].value === "function" && tokens[i - 2].value === "=" &&
                        tokens[i - 3].identifier && tokens[i - 4].value === "." &&
                        tokens[i - 5].value === "prototype")
                {
                    registerMethod(tokens[i - 3].value, "line " + tokens[i - 1].line);
                }
            }
            i++;
        }
    };

    function levenshtein(s1, s2)
    {
        // http://kevin.vanzonneveld.net
        // +            original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
        // +            bugfixed by: Onno Marsman
        // +             revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
        // + reimplemented by: Brett Zamir (http://brett-zamir.me)
        // + reimplemented by: Alexander M Beedie
        // *                example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
        // *                returns 1: 3

        if (s1 === s2)
        {
            return 0;
        }

        var s1_len = s1.length;
        var s2_len = s2.length;

        if (Math.abs(s1_len - s2_len) > 2)
        {
            return 100;
        }
        // BEGIN STATIC
        var split = false;
        try {
            split = !('0')[0];
        } catch (e) {
            split = true; // Earlier IE may not support access by string index
        }
        // END STATIC
        if (split)
        {
            s1 = s1.split('');
            s2 = s2.split('');
        }

        var v0 = new Array(s1_len + 1);
        var v1 = new Array(s1_len + 1);

        var s1_idx = 0, s2_idx = 0, cost = 0;
        for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++)
        {
            v0[s1_idx] = s1_idx;
        }
        var char_s1 = '';
        var char_s2 = '';
        for (s2_idx = 1; s2_idx <= s2_len; s2_idx++)
        {
            v1[0] = s2_idx;
            char_s2 = s2[s2_idx - 1];

            for (s1_idx = 0; s1_idx < s1_len; s1_idx++)
            {
                char_s1 = s1[s1_idx];
                cost = (char_s1 === char_s2) ? 0 : 1;
                var m_min = v0[s1_idx + 1] + 1;
                var b = v1[s1_idx] + 1;
                var c = v0[s1_idx] + cost;
                if (b < m_min)
                {
                    m_min = b;
                }
                if (c < m_min)
                {
                    m_min = c;
                }
                v1[s1_idx + 1] = m_min;
            }
            var v_tmp = v0;
            v0 = v1;
            v1 = v_tmp;
        }
        return v0[s1_len];
    }

    var checkMethodName = function (methodname, linenumber)
    {
        if (validMap[methodname] === "valid")
        {
            return;
        }
        var suggests = [];
        for (var i = methodname.length - 2; i < methodname.length + 2; ++i)
        {
            var methods = validMethods[i];
            if (methods !== undefined)
            {
                for (var j = 0; j < methods.length; j++)
                {
                    var method = methods[j];
                    var score = levenshtein(methodname, method[0]);
                    if (score < 3)
                    {
                        suggests.push([score, method[0], method[1]]);
                    }
                }
            }
        }
        suggests.sort(function (a, b) { return a[0] - b[0]; });
        return {
            methodName: methodname,
            line: linenumber,
            suggests: suggests
        };
    };

    this.check = function (path)
    {
        var data = fs.readFileSync(path, "utf-8");
        if (jshint(data)) {
            var tokens = jshint.tokens();
            var errors = [];
            var checktarget = findMethodName(tokens);
            for (var i = 0; i < checktarget.length; ++i)
            {
                var error = checkMethodName(checktarget[i][0], checktarget[i][1]);
                if (error)
                {
                    errors.push(error);
                }
            }
            return errors;
        }
        return [];
    };

    init.call(this);
};

exports.SpellChecker = SpellChecker;
