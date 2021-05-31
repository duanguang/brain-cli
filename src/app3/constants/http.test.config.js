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
    exports.HttpConfigTest = void 0;
    exports.HttpConfigTest = {
        gateWay: 'https://gateway.hoolinks.com/api/gateway',
        domainLcm: 'https://qa-lcm.hoolinks.com/',
        domainTms: 'https://tmsqa.hoolinks.com/',
        domain3pl: 'https://qa3pl.hoolinks.com/',
    };
});
