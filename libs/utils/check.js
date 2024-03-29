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
    function hasBabelPolyfill(content) {
        const trait = `only one instance of babel-polyfill is allowed`;
        return ~content.indexOf(trait);
    }
    //这里写插件就好了
    function isValid(content) {
        return hasBabelPolyfill(content);
    }
    exports.default = isValid;
});
