import start from '../../server';
import * as UpdateNotifier from 'update-notifier';
import scaffold from '../scaffold';
import {configFileList, default as EConfig} from '../settings/EConfig';
import * as path from 'path';
import getConfig from '../../webpack.config';
import Package = UpdateNotifier.Package;
import webpack = require('webpack');
import ICommand = commander.ICommand;
import commander = require('commander');

export default function programInit(program: any) {
    if (program.init) {
        scaffold.init();
    }
    else if (program.tpl) {
        scaffold.tpl();
    }
    else if (program.dev) {
        /**
         * 在开发环境中, 允许直接配置config和ignoreConfig并更新指定常量区域
         */
        program.config && (configFileList[0] = program.config);
        program.ignoreConfig && (configFileList[1] = program.ignoreConfig);
        //noinspection JSIgnoredPromiseFromCall
        start();
    }
    else if (program.dist) {
        const eConfig = EConfig.getInstance();
        const webpackConfig = getConfig(eConfig);
        delete webpackConfig.pendings;
        webpack(webpackConfig, function (err, stats) {
            if (err) throw err;
            process.stdout.write(stats.toString({
                    colors: true,
                    modules: false,
                    children: false,
                    chunks: false,
                    chunkModules: false
                })
                + `\n`);
        });

        // function compile(webpackConfig) {
        //     return new Promise((resolve) => {
        //         webpack(webpackConfig, function (err, stats) {
        //             if (err) throw err;
        //             process.stdout.write(stats.toString({
        //                     colors: true,
        //                     modules: false,
        //                     children: false,
        //                     chunks: false,
        //                     chunkModules: false
        //                 })
        //                 + `\n`);
        //             resolve();
        //         });
        //     })
        // }
        //
        // const eConfig = EConfig.getInstance();
        // const results = [];
        // [...eConfig.apps].forEach(async(app) => {
        //     const newEConfig = Object.assign({}, eConfig, {apps: [app]});
        //     const webpackConfig = getConfig(newEConfig);
        //     const {name} = newEConfig;
        //     const {path:outputPath} = webpackConfig.output;
        //     const newOutPath = path.resolve(outputPath, app);
        //     const newPublicPath = `/public/${name}/${app}/`;
        //     const result = Object.assign({}, webpackConfig, {output: {...webpackConfig.output, path: newOutPath, publicPath: newPublicPath}});
        //     await compile(result);
        // });
    }
}