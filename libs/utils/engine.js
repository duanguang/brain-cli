(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "invariant"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const invariant = require("invariant");
    /**
     * v3 默认内核：rspack（规格 §1.1 决策 2）
     */
    const ENGINE_DEFAULT = 'rspack';
    const ENGINE_LIST = ['webpack', 'rspack'];
    /**
     * 解析当前构建内核。
     * 判定时机必须在配置分发时（不能放 EConfig.init()）：
     * EConfig 单例在模块 require 时已构造，而 --engine 在 commander action 阶段才写 env。
     *
     * 优先级：process.env.BRAIN_ENGINE（CLI --engine 写入）> eConfig.engine（.e-config.js 字段）> 默认 rspack
     */
    function resolveEngine(eConfig) {
        const raw = String((process.env.BRAIN_ENGINE || (eConfig && eConfig.engine) || ENGINE_DEFAULT))
            .toLowerCase()
            .trim();
        invariant(ENGINE_LIST.indexOf(raw) > -1, `非法 engine: "${raw}"，合法值: ${ENGINE_LIST.join(' | ')}（默认 ${ENGINE_DEFAULT}）`);
        return raw;
    }
    exports.default = resolveEngine;
});
