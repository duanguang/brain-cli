(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const path = require('path');
    /*: IExtraWrite[]*/
    const eConfig = [
        {
            absolutePath: path.resolve(__dirname, '../../.e-config.js'),
            relativePath: '.e-config.js'
        }
    ];
    function init() {
    }
    exports.default = init;
});
