(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./cfg/dev", "./cfg/dist"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const dev_1 = require("./cfg/dev");
    const dist_1 = require("./cfg/dist");
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
            switch (env) {
                case 'production':
                    //return getDistConfig(eConfig);
                    return dist_1.default(eConfig);
                case 'dev':
                    // return getDevConfig(eConfig);
                    return dev_1.default(eConfig);
            }
        };
    }
    const getConfig = buildConfig();
    exports.default = getConfig;
});
