var SpellChecker = require('./_checker_logic').SpellChecker;


function main(path)
{
    var checker = new SpellChecker();
    var i;
    checker.check(path);

    var requireErrors = checker.requireErrors();
    for (i = 0; i < requireErrors.length; i++)
    {
        var filepath = requireErrors[i].filepath;
        var sourcepath = requireErrors[i].sourcepath;
        var line = requireErrors[i].line;
        if (sourcepath)
        {
            console.log("Required file '" + filepath + "' from '" + sourcepath + "' (line " + line + ") is not exists");
        }
        else
        {
            console.log("Required file " + filepath + " is not exists.");
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

    if (checker.hasFatalError())
    {
        spellErrors = [];
        if ((syntaxErrors.length > 0) || (requireErrors.length > 0 && syntaxErrors.length === 0))
        {
            console.log("");
        }
        console.log("There are errors. Please fix them before spell checking.");
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
                console.log("    -> " + (j + 1) + ": " + suggest[1] + " (" + suggest[2] + ")");
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
    }
}

if (process.argv.length !== 3)
{
    console.log("usage:");
    console.log("    node checker.js [javascript-source-path]");
}
else
{
    main(process.argv[2]);
}
