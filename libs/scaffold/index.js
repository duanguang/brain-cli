(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./init", "./tpl"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const init_1 = require("./init");
    const tpl_1 = require("./tpl");
    const scaffold = {
        init: init_1.default,
        tpl: tpl_1.default
    };
    exports.default = scaffold;
});
