"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const EConfig_1 = require("../settings/EConfig");
exports.PROJECT_USER_CONFIG_FILE = `.e-config.js`;
exports.PROJECT_USER_CONFIG_IGNORE_FILE = `.e-config-ignore.js`;
exports.DIST = `dist`;
exports.DEV = `dev`;
exports.PRODUCTION = `production`;
exports.WEBPACK_DLL_MANIFEST_DIST = path.join(process.cwd(), 'node_modules/.cache', 'library-manifest');
exports.WORKING_DIRECTORY = `src`;
exports.HISTORY_REWRITE_FALL_BACK_REGEX_FUNC = (name) => {
    const { name: projectName } = EConfig_1.default.getInstance();
    const path = `${exports.URL_PREFIX}/${projectName}/${name}`;
    return new RegExp(`^/((${path}(?=/)|(${path}$)))`);
};
exports.URL_PREFIX = `app`;
