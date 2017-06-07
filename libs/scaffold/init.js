"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_brain_cli_1 = require("generator-brain-cli");
const path = require('path');
/*: IExtraWrite[]*/
const eConfig = [
    {
        absolutePath: path.resolve(__dirname, '../../.e-config.js'),
        relativePath: '.e-config.js'
    }
];
function init() {
    generator_brain_cli_1.default('init', eConfig);
}
exports.default = init;
