var fs = require('fs');
var path = require('path');
var jshint = require('./jshint').JSHINT;
var Parser = require('./parser').Parser;


var SpellChecker = function () {
    var predefinedMethods = [
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
        ["toUpperCase", "ECMA"]
    ];

    this._registerMethod = function (methodName, option)
    {
        if (methodName.charAt(0) === "$")
        {
            methodName = methodName.substring(1);
        }
        if (this._validMap[methodName] === "valid")
        {
            return;
        }
        if (this._validMethods[methodName.length] === undefined)
        {
            this._validMethods[methodName.length] = [[methodName, option]];
        }
        else
        {
            this._validMethods[methodName.length].push([methodName, option]);
        }
        this._validMap[methodName] = "valid";
    };

    function init()
    {
        this._validMethods = [];
        this._validMap = {};
        this._requires = [];
        this._loadedFile = {};
        this._checkTarget = [];
        this._hasFatalError = false;
        this._requireErrors = [];
        this._syntaxErrors = [];

        for (var i = 0; i < predefinedMethods.length; i++)
        {
            var method = predefinedMethods[i];
            this._registerMethod(method[0], method[1]);
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

    var fixPath = function (basepath, filepath)
    {
        var dir = path.dirname(basepath);
        if (filepath.charAt(0) !== '.')
        {
            return filepath;
        }
        return path.join(dir, filepath);
    };

    this._findMethodName = function (tokens, sourcepath)
    {
        var i = 0;
        for (;;)
        {
            var token = tokens[i];
            if (tokens.length <= i || token.type === "(end)")
            {
                return;
            }
            if (token.value === ":" && token.type === "(punctuator)")
            {
                if (tokens[i - 1].identifier && tokens[i + 1].value === "function")
                {
                    var methodname = tokens[i - 1].value;
                    this._registerMethod(methodname, "line " + tokens[i - 1].line + " in " + sourcepath);
                    i += 3;
                }
            }
            else if (token.value === "(" && token.type === "(punctuator)")
            {
                if (tokens[i - 1] === undefined)
                {
                    // do noting
                }
                else if (tokens[i - 1].identifier && tokens[i - 2].value === ".")
                {
                    if (!startsWithNew(tokens, i))
                    {
                        this._checkTarget.push({methodname: tokens[i - 1].value, line: token.line, col: tokens[i - 1].from, filepath: sourcepath});
                    }
                }
                else if (tokens[i - 1].value === "function" && tokens[i - 2].value === "=" &&
                        tokens[i - 3].identifier && tokens[i - 4].value === "." &&
                        tokens[i - 5].value === "prototype")
                {
                    this._registerMethod(tokens[i - 3].value, "line " + tokens[i - 1].line + " in " + sourcepath);
                }
                else if (tokens[i - 1].value === "require" && tokens[i + 1].type === '(string)')
                {
                    var requirepath = fixPath(sourcepath, tokens[i + 1].value);
                    if (this._verbose)
                    {
                        console.log("  '" + sourcepath + "' requires '" + requirepath + "'");
                    }
                    if (!this._loadedFile[requirepath])
                    {
                        this._loadedFile[requirepath] = true;
                        this._requires.push([requirepath, sourcepath, tokens[i - 1].line]);
                    }
                }
            }
            i++;
        }
    };

    function levenshtein(s1, s2, distance)
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

        if (Math.abs(s1_len - s2_len) > distance)
        {
            return 100;
        }
        // BEGIN STATIC
        var split = false;
        try
        {
            split = !('0')[0];
        }
        catch (e)
        {
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

    this._checkMethodName = function (index)
    {
        var methodname = this._checkTarget[index].methodname;
        var linenumber = this._checkTarget[index].line;
        var column = this._checkTarget[index].col;
        var filepath = this._checkTarget[index].filepath;

        if (this._validMap[methodname] === "valid")
        {
            return;
        }
        var suggests = [];
        for (var i = methodname.length - 2; i < methodname.length + 2; ++i)
        {
            var methods = this._validMethods[i];
            if (methods !== undefined)
            {
                for (var j = 0; j < methods.length; j++)
                {
                    var method = methods[j];
                    var score = levenshtein(methodname, method[0], this._distance);
                    if (score <= this._distance)
                    {
                        suggests.push([score, method[0], method[1]]);
                    }
                }
            }
        }
        suggests.sort(function (a, b) { return a[0] - b[0]; });
        return {
            methodname: methodname,
            line: linenumber,
            suggests: suggests,
            col: column,
            filepath: filepath
        };
    };

    this.check = function (path, option)
    {
        this._verbose = option.verbose;
        this._distance = option.distance;
        this._ignoreWarning = option.ignoreWarning;
        this._readFile(path);
    };

    this.hasFatalError = function ()
    {
        return this._hasFatalError;
    };

    this.syntaxErrors = function ()
    {
        return this._syntaxErrors;
    };

    this.requireErrors = function ()
    {
        return this._requireErrors;
    };

    this.spellErrors = function ()
    {
        var spellErrors = [];
        if (this._checkTarget.length > 0)
        {
            for (var i = 0; i < this._checkTarget.length; ++i)
            {
                var spellerror = this._checkMethodName(i);
                if (spellerror)
                {
                    spellErrors.push(spellerror);
                }
            }
            return spellErrors;
        }
        return [];
    };

    this._runCheck = function (tokens, filepath)
    {
        this._findMethodName(tokens, filepath);
        var requires = this._requires;
        this._requires = [];
        for (var i = 0; i < requires.length; ++i)
        {
            this._readFile(requires[i][0], requires[i][1], requires[i][2]);
        }
    };

    var _isMatch = function (path, pattern)
    {
        pattern.replace("\\", "\\\\");
        pattern = pattern.replace(".", "\\.");
        pattern = pattern.replace("?", ".");
        pattern = pattern.replace("*", ".*");
        var reg = new RegExp(pattern);
        return reg.test(path);
    }

    this._readFile = function (filepath, sourcepath, line)
    {
        if (filepath.lastIndexOf(".json") === filepath.length - 5)
        {
            if (!path.existsSync(filepath))
            {
                this._requireErrors.push({filepath: filepath,  sourcepath: sourcepath});
                this._hasFatalError = true;
                return;
            }
            var json;
            try
            {
                json = JSON.parse(fs.readFileSync(filepath, "utf-8"));
            }
            catch (e)
            {
                console.log("JSON syntax error: " + filepath);
                this._hasFatalError = true;
                return;
            }
            var i;
            if (json.code_encrypted)
            {
                for (i = 0; i < json.code_encrypted.length; i++)
                {
                    this._readFile(fixPath(filepath, json.code_encrypted[i])); 
                }
            }
            if (json.code)
            {
                for (i = 0; i < json.code.length; i++)
                {
                    this._readFile(fixPath(filepath, json.code[i])); 
                }
            }
            return;
        }

        if (filepath.lastIndexOf(".js") !== filepath.length - 3)
        {
            filepath = filepath + ".js";
        }

        if (!path.existsSync(filepath))
        {
            this._requireErrors.push({filepath: filepath, sourcepath: sourcepath, line: line});
            this._hasFatalError = true;
            return;
        }

        var data = fs.readFileSync(filepath, "utf-8");
        var option = {
            asi: true,
            es5: true,
            ignoreWarning: _isMatch(filepath, this._ignoreWarning)
        }
        if (jshint(data, option))
        {
            this._runCheck(jshint.tokens(), filepath);
        }
        else //if (!option.ignoreWarning)
        {
            var errors = jshint.data().errors;
            var fatalError = false;
            for (var j = 0; j < errors.length; j++)
            {
                var error = errors[j];
                if (error)
                {
                    error.filepath = filepath;
                    this._syntaxErrors.push(error);
                    switch (error.reason)
                    {
                    case "Missing semicolon.":
                        break;
                    case "Extra comma.":
                        break;
                    default:
                        fatalError = true;
                        break;
                    }
                }
            }
            if (fatalError)
            {
                this._hasFatalError = true;
            }
            else
            {
                this._runCheck(jshint.tokens(), filepath);
            }
        }
        /*else
        {
            this._runCheck(jshint.tokens(), filepath);
        }*/
    };

    init.call(this);
};

exports.SpellChecker = SpellChecker;
