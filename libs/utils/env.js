(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../constants/constants"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const constants_1 = require("../constants/constants");
    function isDev() {
        return process.env.NODE_ENV !== constants_1.PRODUCTION;
    }
    exports.isDev = isDev;
});
