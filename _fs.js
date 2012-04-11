exports.readFileSync = function (filepath, encode)
{
    var data = null;

    var file = new QFile(filepath);
    if (file.open(QIODevice.ReadOnly))
    {
        var inStream = new QTextStream(file);
        var fileData = inStream.readAll();
        file.close();
        return fileData;
    }
    else
    {
        print('Could not read from file: ' + filepath);
    }
};


exports.writeFileSync = function (filepath, content, encode)
{
    var file = new QFile(filepath);
    if(file.open(QIODevice.OpenMode(QIODevice.WriteOnly)))
    {
        var outStream = new QTextStream(file);
        outStream.writeString(content);
        file.close();
    }
    else
    {
        print('Could not write to file: ' + fileName);
    }
};


exports.statSync = function (path)
{
    var fileinfo = new QFileInfo(path);
    var mtime = fileinfo.lastModified();
    print (mtime);
    print (mtime.prototype)
    return {
        mtime: mtime
    };
};
