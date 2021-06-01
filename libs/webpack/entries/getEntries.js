(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../../cfg/helpers", "../../utils/logs", "../../settings/EConfig"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const helpers_1 = require("../../../cfg/helpers");
    const logs_1 = require("../../utils/logs");
    const EConfig_1 = require("../../settings/EConfig");
    const { apps } = EConfig_1.default.getInstance();
    function getApps() {
        let entries = [];
        return function () {
            if (entries.length > 0) {
                return entries;
            }
            else {
                let envApps = process.env.apps;
                if (typeof envApps === 'string') {
                    envApps = envApps.split(',');
                }
                if (envApps.length > 0) {
                    let ignore = [];
                    let entriesList = envApps.filter((item) => {
                        if (apps.findIndex((entity) => entity === item) > -1) {
                            return item;
                        }
                        else {
                            ignore.push(item);
                        }
                    });
                    function writeLog() {
                        if (ignore.length === envApps) {
                            logs_1.warning(`当前无匹配应用  打包范围为[全部app]...`);
                        }
                        if (ignore.length > 0) {
                            logs_1.warning(`无匹配应用[${ignore.join(',')}]...`);
                        }
                    }
                    if (entriesList.length === apps.length || entriesList.length === 0) {
                        logs_1.log(`打包范围为[全部app]...`);
                    }
                    else {
                        logs_1.log(`打包应用[${entriesList.join(',')}]...`);
                    }
                    writeLog();
                    entries = entriesList.length > 0 ? entriesList : apps;
                    return entries;
                }
            }
            entries = apps;
            return entries;
        };
    }
    exports.getApps = getApps;
    function getEntries(entries) {
        let appEntry = {};
        entries.forEach((item) => {
            appEntry[`${item}`] = helpers_1.getEntry(`${item}.js`);
        });
        return appEntry;
    }
    exports.default = getEntries;
});
