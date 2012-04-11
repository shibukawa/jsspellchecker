function calcWeight(index, length)
{
    var distance = (length - 1 - index) / (length - 1);
    return distance * distance * 0.5 + 1;
}

function stringsDistance(source, target, distanceLimit)
{
    if (source === target)
    {
        return 0;
    }
    var m = source.length;
    var n = target.length;
    if (Math.abs(m - n) > distanceLimit)
    {
        return 100;
    }
    var H = [];
    var i, j;
    for (i = 0; i < m + 2; i++)
    {
        var HH = [];
        H[i] = HH;
        for (j = 0; j < n + 2; j++)
        {
            HH[j] = 0;
        }
    }
    var INF = m + n;
    H[0][0] = INF;
    for (i = 0; i <= m; i++)
    {
        H[i + 1].splice(0, 2, INF, i);
    }
    var H1 = H[1];
    var H0 = H[0];
    for (j = 0; j <= n; j++)
    {
        H1[j + 1] = j;
        H0[j + 1] = INF;
    }
    var sd = {};
    for (i = 1; i <= m; i++)
    {
        var DB = 0;
        var Hi = H[i];
        var Hi1 = H[i + 1];
        var weight = calcWeight(i - 1, m);
        var c1 = source[i - 1].toLowerCase();
        for (j = 1; j <= n; j++)
        {
            var i1 = sd[target[j - 1]] || 0;
            var j1 = DB;
            var c2 = target[j - 1];
            if (c1 === c2.toLowerCase())
            {
                Hi1[j + 1] = Hi[j];
                DB = j;
            }
            else
            {
                Hi1[j + 1] = Math.min(Hi[j], Hi1[j], Hi[j + 1]) + 1 * weight;
            }
            Hi1[j + 1] = Math.min(Hi1[j + 1], H[i1][j1] + ((i - i1 - 1) + 1 + (j - j1 - 1)) * weight);
        }
        sd[source[i - 1]] = i;
        //console.log(H);
    }
    return H[m + 1][n + 1];
}

exports.stringsDistance = stringsDistance;
