"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const server_1 = require("./server");
const UpdateNotifier = require("update-notifier");
const scaffold_1 = require("./libs/scaffold");
const pkg = require('./package.json');
/**
 * 如果出现cli的新版本, 通过下面方面能够获得相关提示
 * TODO: 由于@kad/legion-cli在私有源, 估计无法生效或报错
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
    .option('-t, --tpl', '创建APP模板')
    .parse(process.argv);
if (process.argv.length <= 2) {
    program.outputHelp();
}
else if (program.init) {
    scaffold_1.default.init();
}
else if (program.tpl) {
    scaffold_1.default.tpl();
}
else if (program.dev) {
    //noinspection JSIgnoredPromiseFromCall
    server_1.default();
}
