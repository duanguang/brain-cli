"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dev_1 = require("./cfg/dev");
const dist_1 = require("./cfg/dist");
const path = require('path');
let env;
if (process.env.NODE_ENV === 'dist') {
    env = 'dist';
}
else {
    env = process.env.NODE_ENV = 'dev';
}
/**
 * Build the webpack configuration
 * @param  {String} wantedEnv The wanted environment
 * @return {Object} Webpack config
 */
function buildConfig(wantedEnv) {
    return (eConfig) => {
        switch (wantedEnv) {
            case 'dist':
                return dist_1.default(eConfig);
            case 'dev':
                return dev_1.default(eConfig);
        }
    };
}
const getConfig = buildConfig(env);
exports.default = getConfig;
