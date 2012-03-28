var SpellChecker = require('./_checker_logic').SpellChecker;

function main(path)
{
    var checker = new SpellChecker();
    var errors = checker.check(path);
    for (var i = 0; i < errors.length; i++)
    {
        var error = errors[i];
        console.log(error.methodName + " (line " + error.line + ")");
        if (error.suggests.length > 0)
        {
            for (var j = 0; j < error.suggests.length; j++)
            {
                var suggest = error.suggests[j];
                console.log("    -> " + (j + 1) + ": " + suggest[1] + " (" + suggest[2] + ")");
            }
        }
        else
        {
            console.log("    there is no suggestion");
        }
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
