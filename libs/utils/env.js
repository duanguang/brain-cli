"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants/constants");
function isDev() {
    return process.env.NODE_ENV !== constants_1.PRODUCTION;
}
exports.isDev = isDev;
