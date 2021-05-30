import EConfig from '../settings/EConfig';
import webpackCompiler from './webpackCompiler';
const webpackDevServer = require('webpack-dev-server');
import webpackConfig from '../../webpack.config';
import { log } from '../utils/logs';
import { URL_PREFIX } from '../constants/constants';
const eConfig = EConfig.getInstance();
const {name: projectName,apps} = eConfig;
/**
 * 启动webpack服务器
 */
export default function startWebpackDevServer(options?:any) {
  return new Promise((resolve, reject) => {
    const { server = '0.0.0.0' } = eConfig;
    const config = webpackConfig(eConfig);
    webpackDevServer.addDevServerEntrypoints(config, config.devServer);
    new webpackDevServer(webpackCompiler(), config.devServer).listen(
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
