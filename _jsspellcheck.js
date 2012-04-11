var fs;
var path;
try
{
    fs = require('fs');
    path = require('path');
}
catch (e)
{
    fs = require('./_fs');
    path = require('./_path');
}

var jshint = require('./_jsparser').JSHINT;
var stringsDistance = require('./_distance').stringsDistance;


var SpellChecker = function () {
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
        this._cache = {};
        this._currentCache = undefined;
        this._callback = function () {};
        var predefinedMethods = require('./_predefined_method').predefinedMethods;
        for (var i = 0; i < predefinedMethods.length; i++)
        {
            var method = predefinedMethods[i];
            this._registerMethod(method.word, method.desc);
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

    this._registerMethod = function (methodName, source, line)
    {
        if (methodName.charAt(0) === "$")
        {
            methodName = methodName.substring(1);
        }
        if (this._currentCache)
        {
            this._currentCache.validMethods.push([methodName, source, line]);
        }
        if (this._validMap[methodName] === "valid")
        {
            return;
        }
        if (this._validMethods[methodName.length] === undefined)
        {
            this._validMethods[methodName.length] = [[methodName, source, line]];
        }
        else
        {
            this._validMethods[methodName.length].push([methodName, source, line]);
        }
        this._validMap[methodName] = "valid";
    };

    this._addCheckTarget = function (targetInfo)
    {
        this._checkTarget.push(targetInfo);
        if (this._currentCache)
        {
            this._currentCache.checkTargets.push(targetInfo);
        }
    };

    this._addRequire = function (path, sourcepath, line)
    {
        if (this._currentCache)
        {
            this._currentCache.requires.push([path, sourcepath, line]);
        }
        if (!this._loadedFile[path])
        {
            this._loadedFile[path] = true;
            this._requires.push([path, sourcepath, line]);
        }
    };

    this._findMethodName = function (tokens, sourcepath, ignoreWarning)
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
                    this._registerMethod(methodname, sourcepath, tokens[i - 1].line);
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
                    if (!startsWithNew(tokens, i) && !ignoreWarning)
                    {
                        this._addCheckTarget({methodname: tokens[i - 1].value, line: token.line, col: tokens[i - 1].from, filepath: sourcepath});
                    }
                }
                else if (tokens[i - 1].value === "function" && tokens[i - 2].value === "=" &&
                        tokens[i - 3].identifier && tokens[i - 4].value === "." &&
                        tokens[i - 5].value === "prototype")
                {
                    this._registerMethod(tokens[i - 3].value, sourcepath, tokens[i - 1].line);
                }
                else if (tokens[i - 1].value === "require" && tokens[i + 1].type === '(string)')
                {
                    var requirepath = fixPath(sourcepath, tokens[i + 1].value);
                    if (this._verbose)
                    {
                        console.log("  '" + sourcepath + "' requires '" + requirepath + "'");
                    }
                    this._addRequire(requirepath, sourcepath, tokens[i - 1].line);
                }
            }
            i++;
        }
    };

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
                    var score = stringsDistance(methodname, method[0], this._distance);
                    if (score <= this._distance)
                    {
                        suggests.push([score, method[0], method[1], method[2]]);
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

    this.check = function (filepath, option)
    {
        this._verbose = option.verbose;
        this._distance = option.distance;
        this._ignoreWarning = option.ignoreWarning;
        if (option.callback)
        {
            this._callback = option.callback;
        }
        var cachepath;
        if (filepath.lastIndexOf(".json") === filepath.length - 5)
        {
            cachepath = filepath.slice(0, filepath.length - 5) + ".methodspellcache";
            if (path.existsSync(cachepath))
            {
                var content;
                try
                {
                    this._cache = JSON.parse(fs.readFileSync(cachepath, "utf-8"));
                }
                catch (e)
                {
                    // do nothing
                }
            }
        }
        this._readFile(filepath);
        if (cachepath)
        {
            fs.writeFileSync(cachepath, JSON.stringify(this._cache, undefined, 4), "utf-8");
        }
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

    this._runCheck = function (tokens, filepath, ignoreWarning)
    {
        this._findMethodName(tokens, filepath, ignoreWarning);
        var requires = this._requires;
        this._requires = [];
        for (var i = 0; i < requires.length; ++i)
        {
            this._readFile(requires[i][0], requires[i][1], requires[i][2]);
        }
    };

    var _isMatch = function (path, pattern)
    {
        if (!pattern)
        {
            return false;
        }
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
        var mtime = fs.statSync(filepath).mtime.getTime();
        if (this._cache[filepath])
        {
            var cachedContent = this._cache[filepath];
            var stat = fs.statSync(filepath);
            if (cachedContent.mtime === mtime)
            {
                this._currentCache = undefined;
                var validMethods = cachedContent.validMethods;
                for (i = 0; i < validMethods.length; ++i)
                {
                    var validMethod = validMethods[i];
                    this._registerMethod(validMethod[0], validMethod[1], validMethod[2]);
                }
                var checkTargets = cachedContent.checkTargets;
                for (i = 0; i < checkTargets.length; ++i)
                {
                    this._addCheckTarget(checkTargets[i])
                }
                var requires = cachedContent.requires;
                for (i = 0; i < requires.length; ++i)
                {
                    var requireInfo = requires[i];
                    this._addRequire(requireInfo[0], requireInfo[1], requireInfo[2]);
                }
                requires = this._requires;
                this._requires = [];
                for (var i = 0; i < requires.length; ++i)
                {
                    this._readFile(requires[i][0], requires[i][1], requires[i][2]);
                }
                return;
            }
        }
        this._callback(filepath);
        var data = fs.readFileSync(filepath, "utf-8");
        var option = {
            asi: true,
            es5: true,
            ignoreWarning: _isMatch(filepath, this._ignoreWarning)
        }
        this._currentCache = 
        {
            mtime: mtime,
            validMethods: [],
            checkTargets: [],
            requires: []
        };
        this._cache[filepath] = this._currentCache;
        if (jshint(data, option))
        {
            this._runCheck(jshint.tokens(), filepath, option.ignoreWarning);
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
                    switch (error.raw)
                    {
                    case "Missing semicolon.":
                        break;
                    case "Extra comma.":
                        break;
                    case "'{a}' is already defined.":
                        break;
                    case "Bad line breaking before '{a}'.":
                        break;
                    case "Mixed spaces and tabs.":
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
