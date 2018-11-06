"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const index_1 = require("./index");
const constants_1 = require("../constants/constants");
const logs_1 = require("../utils/logs");
class Command {
    constructor() {
        this.commands = ['build', 'start', 'dev'];
        this.env = { 'dev': '开发环境', 'dist': '预发布环境', 'prod': '生产环境', 'test': '测试环境' };
        this.program = program;
    }
    setProcessEnv(env) {
        if (env === 'dev') {
            process.env.environment = constants_1.DEV;
            process.env.NODE_ENV = constants_1.DEV;
        }
        else if (env === 'dist') {
            process.env.environment = constants_1.DIST;
            process.env.NODE_ENV = constants_1.PRODUCTION;
        }
        else if (env === 'prod') {
            process.env.environment = constants_1.PRODUCTION;
            process.env.NODE_ENV = constants_1.PRODUCTION;
        }
        else if (env === 'test') {
            process.env.environment = constants_1.TEST;
            process.env.NODE_ENV = constants_1.PRODUCTION;
        }
        else if (env === 'report') {
            process.env.environment = constants_1.REPORT;
            process.env.NODE_ENV = constants_1.PRODUCTION;
        }
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
            .command('dev')
            .description('start webpack dev server for develoment mode')
            .action((options) => {
            let env = 'dev';
            this.setProcessEnv(env);
            logs_1.log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
            index_1.default(env);
        });
    }
    start() {
        this.program
            .command('start')
            .description('start webpack dev server for develoment mode')
            .action(options => {
            let env = 'dev';
            this.setProcessEnv(env);
            logs_1.log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
            index_1.default(env);
        });
    }
    build() {
        this.program
            .command('build [env]')
            .option('-s', 'webpack build size analyzer tool, support size: default analyzer')
            .description('webpack building')
            .action((env = 'prod', options) => {
            if (options.S) {
                this.setProcessEnv('report');
            }
            else {
                this.setProcessEnv(env);
            }
            logs_1.log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
            index_1.default(env);
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
