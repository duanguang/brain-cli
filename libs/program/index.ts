import start from '../../server';
import {configFileList, default as EConfig} from '../settings/EConfig';
import * as path from 'path';
import getConfig from '../../webpack.config';
import webpack = require('webpack');
import commander = require('commander');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
// import ICommand = commander.ICommand;
export default function programInit(env: string,cmd?:{smp:'true'|'false',cssModules:'true'|'false'}) {
    if (env==='dev') {
        /**
         * 在开发环境中, 允许直接配置config和ignoreConfig并更新指定常量区域
         */
        // program.config && (configFileList[0] = program.config);
        // program.ignoreConfig && (configFileList[1] = program.ignoreConfig);
        //noinspection JSIgnoredPromiseFromCall
        start(cmd);
    }
    else if (env==='production') {
        const eConfig = EConfig.getInstance();
        if (cmd.cssModules !== undefined) {
            if (cmd.cssModules === 'true') {
              eConfig.webpack.cssModules.enable = true
            }
            if (cmd.cssModules === 'false') {
              eConfig.webpack.cssModules.enable = false
            }
        }
        const webpackConfig = getConfig(eConfig);
        if (Array.isArray(webpackConfig.pendings)) {
            webpackConfig.pendings.forEach(pending => pending());
        }
        delete webpackConfig.pendings;
        webpack((cmd&&cmd['smp']==='true')?smp.wrap(webpackConfig):webpackConfig, function (err, stats) {
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