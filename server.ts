import startWebpackDevServer from './libs/webpack/webpackDevServer';
import webpackDllCompiler from './libs/webpack/webpackDllCompiler';
import EConfig from './libs/settings/EConfig';
import {displayAvailableIPs} from './libs/utils/ip';
import {warning} from './libs/utils/logs';
import {URL_PREFIX} from './libs/constants/constants';
const openBrowser = require('open');
// const config = require('./webpack.config');
// const {port} = config;

function autoOpenBrowser(open: boolean, ip: string, port: number, targetApp: string) {
    const {name: projectName} = EConfig.getInstance();
    if (open) {
        if (!targetApp) {
            warning(`忽略自动打开浏览器功能:`);
            warning(`请提供指定需要app name作为相对路径`);
        }
        else {
            openBrowser(`http://${ip}:${port}/${URL_PREFIX}/${projectName}/${targetApp}`);
        }
    }
}

/**
 * 程序入口点开始方法
 */
export default async function start() {
    try {
        /**
         * 按需创建编译webpack dll manifest文件
         */
        await webpackDllCompiler();

        /**
         * 开启webpack dev server
         */
        await startWebpackDevServer();
        /**
         * 获取配置文件
         */
        const {open, server, apps, defaultPort} = EConfig.getInstance();
        let ip = server;
        if (server === `0.0.0.0`) {
            /**
             * 显示可选IP列表
             */
            displayAvailableIPs();
            /**
             * 开启后判断配置文件是否需要自动打开浏览器
             */
            ip = `localhost`;
        }
        autoOpenBrowser(open, ip, defaultPort, apps[0]);
    } catch (e) {
        console.error(e);
    }
}