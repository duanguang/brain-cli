(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../settings/EConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.happyPackToTsPlugin = exports.happyPackToJsPlugin = void 0;
    const EConfig_1 = require("../settings/EConfig");
    const { webpack: { happyPack }, babel, } = EConfig_1.default.getInstance();
    /** JS编译线程插件 - WP5 已移除 HappyPack，使用原生并行处理 */
    const happyPackToJsPlugin = () => {
        return [];
    };
    exports.happyPackToJsPlugin = happyPackToJsPlugin;
    /** TS编译线程插件 - WP5 已移除 HappyPack，使用原生并行处理 */
    const happyPackToTsPlugin = () => {
        return [];
    };
    exports.happyPackToTsPlugin = happyPackToTsPlugin;
});
