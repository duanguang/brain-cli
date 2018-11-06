"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
class Command {
    constructor() {
        this.commands = ['build', 'start', 'dev'];
        this.program = program;
    }
    version() {
        const pkg = require(path.resolve(__dirname, '../../package.json'));
        this.program.version(pkg.version);
    }
    option() {
        this.program
            .option('-V,--version', 'output the version number');
    }
    dev() {
        this.program
            .command('dev [env]')
            .description('start webpack dev server for develoment mode')
            .action(env => {
        });
    }
    start() {
        this.program
            .command('start [env]')
            .description('start webpack dev server for develoment mode')
            .action(env => {
        });
    }
    build() {
        this.program
            .command('build [env]')
            .option('-s', 'webpack build size analyzer tool, support size: default analyzer')
            .description('webpack building')
            .action((env = 'prod', options) => {
        });
    }
    command() {
        this.commands.forEach(cmd => {
            if (this[cmd]) {
                this[cmd].apply(this);
            }
            else {
                console.log(chalk.red(`The command [${cmd}] is not implemented!`));
            }
        });
    }
    parse() {
        this.program.parse(process.argv);
    }
    run() {
        this.version();
        this.option();
        this.command();
        this.parse();
    }
}
exports.Command = Command;
