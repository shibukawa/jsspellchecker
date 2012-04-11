exports.dirname = function (filepath)
{
    var fileinfo = new QFileInfo(filepath);
    return fileinfo.dir().path();
};

exports.existsSync = function (filepath)
{
    var fileinfo = new QFileInfo(filepath);
    return fileinfo.exists();
}

var join = function ()
{
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 2)
    {
        return args[0];
    }
    var parent = args.shift();
    var startWithPeriod = (parent.indexOf("./") === 0);
    var child = args[0];
    var path
    if (parent[parent.length - 1] !== "/" && child[0] !== "/")
    {
        path = QDir.cleanPath([parent, child].join("/"));
    }
    else
    {
        path = QDir.cleanPath([parent, child].join(""));
    }
    if (startWithPeriod)
    {
        args[0] = "./" + path;
    }
    else
    {
        args[0] = path;
    }
    return join.apply(this, args);
};

exports.join = join;
