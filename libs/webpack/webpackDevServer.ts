import EConfig from '../settings/EConfig';
import webpackCompiler from './webpackCompiler';
const WebpackDevServer = require('webpack-dev-server');
import webpackConfig from '../../webpack.config';
import { log } from '../utils/logs';
const eConfig = EConfig.getInstance();

/**
 * 启动webpack服务器
 */
export default function startWebpackDevServer() {
    return new Promise((resolve, reject) => {
        const {server} = eConfig;
        const config = webpackConfig(eConfig);
        new WebpackDevServer(webpackCompiler(), config.devServer).listen(eConfig.defaultPort, server, (err) => {
            if (err) {
                reject(err);
            }
            log(`监听本地 ${server}:${eConfig.defaultPort}`)
            //console.log(`监听本地 ${server}:${eConfig.defaultPort}`);
            resolve();
        });
    });
}