"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../server");
const scaffold_1 = require("../scaffold");
const EConfig_1 = require("../settings/EConfig");
const webpack_config_1 = require("../../webpack.config");
const webpack = require("webpack");
function programInit(program) {
    if (program.init) {
        scaffold_1.default.init();
    }
    else if (program.tpl) {
        scaffold_1.default.tpl();
    }
    else if (program.dev) {
        /**
         * 在开发环境中, 允许直接配置config和ignoreConfig并更新指定常量区域
         */
        program.config && (EConfig_1.configFileList[0] = program.config);
        program.ignoreConfig && (EConfig_1.configFileList[1] = program.ignoreConfig);
        //noinspection JSIgnoredPromiseFromCall
        server_1.default();
    }
    else if (program.dist) {
        const eConfig = EConfig_1.default.getInstance();
        const webpackConfig = webpack_config_1.default(eConfig);
        delete webpackConfig.pendings;
        webpack(webpackConfig, function (err, stats) {
            if (err)
                throw err;
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
exports.default = programInit;
