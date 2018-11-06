#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UpdateNotifier = require("update-notifier");
const index_1 = require("../libs/program/index");
const constants_1 = require("../libs/constants/constants");
const program = require('commander');
const pkg = require('../package.json');
/**
 * 如果出现cli的新版本, 通过下面方面能够获得相关提示
 *
 */
const notifier = UpdateNotifier({
    pkg,
    callback: (update) => {
        if (update && ['major', 'minor', 'patch'].indexOf(update.type) > -1) {
            notifier.update = update;
            notifier.notify({ message: '发现新版本', defer: false });
        }
    }
});
program
    .version(pkg.version)
    .option('-i, --init', '初始化构建项目')
    .option('-D, --dev', '运行Dev开发环境')
    .option('-p, --prod', '运行prod生产环境')
    .option('-t, --test', '运行test测试环境')
    .option('-d, --dist', '运行部署预发布环境')
    .option('-d, --report', '文件信息报告')
    .option('-t, --tpl', '创建APP模板')
    .option('-c, --config', '指定配置文件')
    .option('-ic, --ignoreConfig', '指定用户自定义配置文件, 优先级大于<指定配置文件>')
    .parse(process.argv);
if (process.argv.length <= 2) {
    program.outputHelp();
}
else {
    console.log(program);
    let NODE_ENV = '开发环境';
    if (program.dev) {
        process.env.environment = constants_1.DEV;
        process.env.NODE_ENV = constants_1.DEV;
    }
    else if (program.dist) {
        process.env.environment = constants_1.DIST;
        process.env.NODE_ENV = constants_1.PRODUCTION;
        NODE_ENV = '预发布环境';
    }
    else if (program.prod) {
        process.env.environment = constants_1.PRODUCTION;
        process.env.NODE_ENV = constants_1.PRODUCTION;
        NODE_ENV = '生产环境';
    }
    else if (program.test) {
        process.env.environment = constants_1.TEST;
        process.env.NODE_ENV = constants_1.PRODUCTION;
        NODE_ENV = '测试环境';
    }
    else if (program.report) {
        process.env.environment = constants_1.REPORT;
        process.env.NODE_ENV = constants_1.PRODUCTION;
        NODE_ENV = '正在生成模块信息报告...';
    }
    //  process.env.NODE_ENV = program.dist ? PRODUCTION : DEV;
    console.info(`当前编译环境为: ${process.env.NODE_ENV}[${NODE_ENV}]`);
    index_1.default(program);
}
