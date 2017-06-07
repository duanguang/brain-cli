"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../../../cfg/helpers");
function getEntries(entries) {
    let appEntry = {};
    entries.forEach((item) => {
        appEntry[`${item}`] = helpers_1.getEntry(`${item}.js`);
    });
    return appEntry;
}
exports.default = getEntries;
