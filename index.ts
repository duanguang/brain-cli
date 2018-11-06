import * as program from 'commander';
import start from './server';
import * as UpdateNotifier from 'update-notifier';
import Package = UpdateNotifier.Package;
const pkg: Package = require('./package.json');

/**
 * 如果出现cli的新版本, 通过下面方面能够获得相关提示
 * TODO: 由于@kad/brain-cli在私有源, 估计无法生效或报错
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

// program
//     .version(pkg.version)
//     .option('-i, --init', '初始化构建项目')
//     .option('-D, --dev', '运行Dev开发环境')
//     .option('-t, --tpl', '创建APP模板')
//     .parse(process.argv);

// if (process.argv.length <= 2) {
//     program.outputHelp();
// }

//noinspection JSIgnoredPromiseFromCall
start();