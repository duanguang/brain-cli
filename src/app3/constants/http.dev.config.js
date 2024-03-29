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
    exports.HttpConfigDev = void 0;
    exports.HttpConfigDev = {
        gateWay: 'https://gateway.hoolinks.com/api/gateway',
        /* gateWay:'http://localhost:7001/api/gateway', */
        domainLcm: 'https://qa-lcm.hoolinks.com/',
        domainTms: 'https://tmsqa.hoolinks.com/',
        /* domainTms: 'http://192.168.100.132:8088/', */
        domain3pl: 'https://qa3pl.hoolinks.com/',
    };
});
