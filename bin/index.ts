#!/usr/bin/env node
import Package = UpdateNotifier.Package;
import UpdateNotifier = require('update-notifier');
import programInit from '../libs/program/index';
import {PRODUCTION, DEV,DIST, TEST} from '../libs/constants/constants';
const program = require('commander');
const pkg: Package = require('../package.json');

/**
 * 如果出现cli的新版本, 通过下面方面能够获得相关提示
 * 
 */
const notifier = UpdateNotifier({
    pkg,
    callback: (update) => {
        if (update && ['major', 'minor', 'patch'].indexOf(update.type) > -1) {
            notifier.update = update;
            notifier.notify({message: '发现新版本', defer: false});
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
    .option('-t, --tpl', '创建APP模板')
    .option('-c, --config', '指定配置文件')
    .option('-ic, --ignoreConfig', '指定用户自定义配置文件, 优先级大于<指定配置文件>')
    .parse(process.argv);
if (process.argv.length <= 2) {
    program.outputHelp();
}
else {
    let NODE_ENV='开发环境';
    if(program.dev){
        process.env.environment=DEV;
        process.env.NODE_ENV=DEV;
    }
    else if(program.dist){
        process.env.environment=DIST;
        process.env.NODE_ENV=PRODUCTION;
        NODE_ENV='预发布环境';
    }
    else if(program.prod){
        process.env.environment=PRODUCTION;
        process.env.NODE_ENV=PRODUCTION;
        NODE_ENV='生产环境';
    }
    else if(program.test){
        process.env.environment=TEST;
        process.env.NODE_ENV=PRODUCTION;
        NODE_ENV='测试环境';
    }
  //  process.env.NODE_ENV = program.dist ? PRODUCTION : DEV;
    console.info(`当前编译环境为: ${process.env.NODE_ENV}[${NODE_ENV}]`);
    programInit(program);
}