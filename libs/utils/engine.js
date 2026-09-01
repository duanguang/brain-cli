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
    /**
     * v3 默认内核：rspack（规格 §1.1 决策 2）
     */
    const ENGINE_DEFAULT = 'rspack';
    const ENGINE_LIST = ['webpack', 'rspack'];
    /**
     * 解析当前构建内核。
     * 判定时机必须在配置分发时（不能放 EConfig.init()）：
     * engine 在 commander action 阶段才写 env，而 EConfig 单例在模块 require 时已构造。
     *
     * 优先级：process.env.BRAIN_ENGINE（CLI --engine 写入）> eConfig.engine（.e-config.js 字段）> 默认 rspack
     */
    function resolveEngine(eConfig) {
        const raw = String((process.env.BRAIN_ENGINE || (eConfig && eConfig.engine) || ENGINE_DEFAULT))
            .toLowerCase()
            .trim();
        if (ENGINE_LIST.indexOf(raw) === -1) {
            // 不用 invariant 抛错：server.js 既有 try/catch 会吞掉异常导致退出码 0，
            // CLI 场景 fail fast 必须保证非 0 退出码（自动化脚本可感知）
            console.error(`非法 engine: "${raw}"，合法值: ${ENGINE_LIST.join(' | ')}（默认 ${ENGINE_DEFAULT}）`);
            process.exit(1);
        }
        return raw;
    }
    exports.default = resolveEngine;
});
