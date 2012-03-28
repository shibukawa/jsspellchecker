var fs = require('fs');
var jshint = require('./jshint').JSHINT;

var dump_from_source = function (data)
{
    jshint(data);
    var tokens = jshint.tokens();
    var jsdocs = jshint.jsdocs();
    dump(tokens, jsdocs);
}

var dump = function (tokens, jsdocs) {
    for (var i = 0; i < tokens.length; i++)
    {
        var token = tokens[i];
        console.log(i);
        for (var key in token)
        {
            if (token.hasOwnProperty(key))
            {
                var value = token[key];
                if (typeof value === 'object')
                {
                    console.log("    " + key + ":");
                    for (var keyforvalue in value)
                    {
                        if (value.hasOwnProperty(keyforvalue)) {
                            console.log("        " + keyforvalue + ": " + value[keyforvalue]);
                        }
                    }
                }
                else
                {
                    console.log("    " + key + ": " + token[key]);
                }
            }
        }
    }
    console.log("jsdoc:");
    for (var j = 0; j < jsdocs.length; j++)
    {
        console.log("    line: " + jsdocs[j].line);
        var directives = jsdocs[j].directives;
        for (var k = 0; k < directives.length; k++)
        {
            console.log("        " + directives[k]);
        }
    }
}

exports.dump = dump;

function main(path)
{
    fs.readFile(path, "utf-8", function (err, data) {
    if (err) throw err;
        dump_from_source(data);
    });
}

if (process.argv.length !== 3)
{
    console.log("usage:");
    console.log("    node dump_token.js [javascript-source-path]");
}
else
{
    main(process.argv[2]);
}

