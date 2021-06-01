(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "babel-core"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const babel = require("babel-core");
    const Module = require('module');
    const rawModuleCompile = Module.prototype._compile;
    function requireBabelify(filename, options = {}) {
        const presets = [options.version || 'es2015'];
        Module.prototype._compile = function (content, filename) {
            const result = babel.transform(content, { presets }).code;
            rawModuleCompile.apply(this, [result, filename]);
            Module.prototype._compile = rawModuleCompile;
        };
        return require(filename);
    }
    exports.requireBabelify = requireBabelify;
});
