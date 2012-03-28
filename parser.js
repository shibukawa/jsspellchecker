var Variable = function (name)
{
    function init() {
        this.name = name;
        this.initialValue = null;
    }
};

var Namespace = function ()
{
    function init() {
        this.args = [];
        this.variables = [];
    }

    this.init.call(this);
};

var Statement = function ()
{
    function init() {
        this.sideeffects = [];
        this.inputs = [];
    }

    this.init.call(this);
};

var Parser = function (tokens) {
    function init() {
    }

    this.init.call(this);
};

exports.Parser = Parser;
