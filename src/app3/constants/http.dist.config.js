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
    exports.HttpConfigPreBeta = void 0;
    exports.HttpConfigPreBeta = {
        gateWay: 'https://gateway.hoolinks.com/api/gateway',
        domainLcm: 'https://uat-lcm.hoolinks.com/',
        domainTms: 'https://tmsuat.hoolinks.com/',
        domain3pl: 'https://uat3pl.hoolinks.com/',
    };
});
