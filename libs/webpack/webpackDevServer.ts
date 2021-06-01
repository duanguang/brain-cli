/*
 * @Author: duanguang
 * @Date: 2021-06-01 00:16:31
 * @LastEditTime: 2021-06-01 17:50:02
 * @LastEditors: duanguang
 * @Description: 
 * @FilePath: /brain-cli/libs/webpack/webpackDevServer.ts
 * 「扫去窗上的尘埃，才可以看到窗外的美景。」
 */
import EConfig from '../settings/EConfig';
import webpackCompiler from './webpackCompiler';
const WebpackDevServer = require('webpack-dev-server');
import webpackConfig from '../../webpack.config';
import { log } from '../utils/logs';
const eConfig = EConfig.getInstance();

/**
 * 启动webpack服务器
 */
export default function startWebpackDevServer(cmd?:{smp:'true'|'false'}) {
  return new Promise((resolve, reject) => {
    const { server } = eConfig;
    const config = webpackConfig(eConfig);
    new WebpackDevServer(webpackCompiler(cmd), config.devServer).listen(
      eConfig.defaultPort,
      server,
      err => {
        if (err) {
          reject(err);
        }
        log(`监听本地 ${server}:${eConfig.defaultPort}`);
        //console.log(`监听本地 ${server}:${eConfig.defaultPort}`);
        resolve();
      }
    );
  });
}
