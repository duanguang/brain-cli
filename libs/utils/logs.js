"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require('chalk');
function warning(message) {
    console.warn(chalk.yellow(message));
}
exports.warning = warning;
