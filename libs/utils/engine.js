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
     * rspack 内核的 Node 版本门槛（与 @rspack/core 2.x engines 对齐：^20.19.0 || >=22.12.0）。
     * @rspack/core 2.x 为 ESM-only 包，低于该版本 require 直接 ERR_REQUIRE_ESM（Node 14.21.1 实测），
     * 必须在选择 rspack 引擎时 fail fast 并给出可操作提示
     */
    function isRspackNodeSupported() {
        const parts = process.versions.node.split('.').map((n) => parseInt(n, 10));
        const major = parts[0];
        const minor = parts[1] || 0;
        if (major > 22) return true;
        if (major === 22) return minor >= 12;
        if (major === 20) return minor >= 19;
        return false;
    }
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
        if (raw === 'rspack' && !isRspackNodeSupported()) {
            console.error(`[brain-cli] rspack 内核要求 Node ^20.19.0 || >=22.12.0（@rspack/core 2.x 为 ESM-only 包），当前 Node ${process.versions.node}。`);
            console.error(`  两种处理：① 升级 Node；② 本次使用旧内核：命令追加 --engine=webpack`);
            process.exit(1);
        }
        return raw;
    }
    exports.default = resolveEngine;
});
