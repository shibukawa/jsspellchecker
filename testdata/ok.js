var SampleObject = {
    validMethod: function ()
    {
    }
};

SampleObject.prototype.test = function () {};

SampleObject.validMethod();
SampleObject.destroy();
SampleObject.setText("text");
SampleObject.hasOwnProperty();
SampleObject.test();

new GL2.Text(); // it is not method
