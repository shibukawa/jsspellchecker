var opts = require('./opts');
var SpellChecker = require('./_jsspellcheck').SpellChecker;


function main(path, option)
{
    var checker = new SpellChecker();
    var i;
    checker.check(path, option);

    var requireErrors = checker.requireErrors();
    for (i = 0; i < requireErrors.length; i++)
    {
        var filepath = requireErrors[i].filepath;
        var sourcepath = requireErrors[i].sourcepath;
        var line = requireErrors[i].line;
        if (line)
        {
            console.log("Required file '" + filepath + "' from '" + sourcepath + "' (line " + line + ") is not exists");
        }
        else
        {
            console.log("Required file '" + filepath + "' from '" + sourcepath + "' is not exists");
        }
    }

    var syntaxErrors = checker.syntaxErrors();

    if (requireErrors.length > 0 && syntaxErrors.length > 0)
    {
        console.log("");
    }

    for (i = 0; i < syntaxErrors.length; i++)
    {
        var syntaxError = syntaxErrors[i];
        console.log(syntaxError.filepath + ": line " + syntaxError.line + ", col " + syntaxError.character + ", " + syntaxError.reason);
    }

    var spellErrors;

    if (option.requireOnly || checker.hasFatalError())
    {
        spellErrors = [];
        if ((syntaxErrors.length > 0) || (requireErrors.length > 0 && syntaxErrors.length === 0))
        {
            console.log("");
        }
        if (checker.hasFatalError())
        {
            console.log("There are errors. Please fix them before spell checking.");
        }
    }
    else
    {
        spellErrors = checker.spellErrors();

        if ((syntaxErrors.length > 0 && spellErrors.length > 0) || (requireErrors.length > 0 && syntaxErrors.length === 0 && spellErrors.length > 0))
        {
            console.log("");
        }
    }

    for (i = 0; i < spellErrors.length; i++)
    {
        var spellError = spellErrors[i];
        console.log(spellError.methodname + ": line " + spellError.line + ", col " + spellError.col + ", in " + spellError.filepath);
        if (spellError.suggests.length > 0)
        {
            for (var j = 0; j < spellError.suggests.length; j++)
            {
                var suggest = spellError.suggests[j];
                if (suggest[3])
                {
                    console.log("    -> " + (j + 1) + ": " + suggest[1] + "() (line " + suggest[3] + " in " + suggest[2] + ")");
                }
                else
                {
                    console.log("    -> " + (j + 1) + ": " + suggest[1] + "() (from " + suggest[2] + ")");
                }
            }
        }
        else
        {
            console.log("    there is no suggestion");
        }
    }

    if (requireErrors.length > 0 || syntaxErrors.length > 0 || spellErrors.length > 0 || checker.hasFatalError())
    {
        console.log("");
    }

    var summary = [];
    if (requireErrors.length > 0)
    {
        summary.push(String(requireErrors.length) + " require errors");
    }
    if (syntaxErrors.length > 0)
    {
        summary.push(String(syntaxErrors.length) + " syntax errors");
    }
    if (spellErrors.length > 0)
    {
        summary.push(String(spellErrors.length) + " spell errors");
    }
    if (summary.length > 0)
    {
        console.log(summary.join(", ") + " founds.");
        process.exit(1);
    }
    process.exit(0);
}


var version = "1.0";


var options =
[
    {
        short: 'd',
        long: 'distance',
        description: 'Damerau-Levenshtein Distance to find near method names. Default is 2',
        value: true
    },
    {
        short: 'r',
        long: 'requirecheck',
        description: 'Check require only'
    },
    {
        short: 'i',
        long: 'ignorewarning',
        description: 'File name pattern for ignoring JavaScript syntax warning. Sample: "*/lib/*"',
        value: true
    },
    {
        short: 'v',
        long: 'verbose',
        description: 'Dump require function call.'
    },
    {
        short: 'V',
        long: 'version',
        description: 'Show version and exit',
        callback: function ()
        {
            console.log("JSSpellChecker version." + version + " by Yoshiki Shibukawa");
            process.exit(1);
        }
    }
];


var args =
[
    {
        name: 'script',
        required: true
    }
]


opts.parse(options, args, true);


var option =
{
    verbose: opts.get('v'),
    distance: opts.get('d') || 2,
    ignoreWarning: opts.get('i'),
    requireOnly: opts.get('r')
};


main(opts.arg('script'), option);
