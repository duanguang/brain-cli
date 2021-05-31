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
    exports.HttpConfigBeta = void 0;
    exports.HttpConfigBeta = {
        gateWay: 'https://gateway.hoolinks.com/api/gateway',
        domainLcm: 'https://lcm.hoolinks.com/',
        domainTms: 'https://tms.hoolinks.com/',
        domain3pl: 'https://3pl.hoolinks.com/',
    };
});
