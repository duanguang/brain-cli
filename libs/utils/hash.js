"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rawObjectHash = require("object-hash");
function shortHash(val) {
    return rawObjectHash(val, { encoding: 'base64' });
}
exports.shortHash = shortHash;
