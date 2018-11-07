"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require('chalk');
function warning(message) {
    console.warn(chalk.yellow(`[brain-cli]:${message}`));
}
exports.warning = warning;
function log(info, color = 'green') {
    /* istanbul ignore next */
    console.log(chalk.blue(`[brain-cli]:${chalk[color](info)}`));
}
exports.log = log;
