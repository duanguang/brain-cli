(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./cfg/dev", "./cfg/dist", "./cfg/rspack/dev", "./cfg/rspack/dist", "./libs/utils/engine"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const dev_1 = require("./cfg/dev");
    const dist_1 = require("./cfg/dist");
    const rspack_dev_1 = require("./cfg/rspack/dev");
    const rspack_dist_1 = require("./cfg/rspack/dist");
    const resolveEngine = require("./libs/utils/engine").default;
    const path = require('path');
    /**
     * Build the webpack configuration
     * @param  {String} wantedEnv The wanted environment
     * @return {Object} Webpack config
     */
    function buildConfig() {
        return (eConfig) => {
            let env;
            if (process.env.NODE_ENV === 'production') {
                env = 'production';
            }
            else {
                env = process.env.NODE_ENV = 'dev';
            }
            // v3 双内核分发：engine × NODE_ENV 四路路由（webpack 链路零改动）
            if (resolveEngine(eConfig) === 'rspack') {
                return env === 'production' ? (0, rspack_dist_1.default)(eConfig) : (0, rspack_dev_1.default)(eConfig);
            }
            switch (env) {
                case 'production':
                    //return getDistConfig(eConfig);
                    return (0, dist_1.default)(eConfig);
                case 'dev':
                    // return getDevConfig(eConfig);
                    return (0, dev_1.default)(eConfig);
            }
        };
    }
    const getConfig = buildConfig();
    exports.default = getConfig;
});
