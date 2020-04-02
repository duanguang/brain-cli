import EConfig from '../settings/EConfig';
import webpackCompiler from './webpackCompiler';
const webpackDevServer = require('webpack-dev-server');
import webpackConfig from '../../webpack.config';
import { log } from '../utils/logs';
const eConfig = EConfig.getInstance();

/**
 * 启动webpack服务器
 */
export default function startWebpackDevServer(cmd?:{smp:'true'|'false',cssModules:'true'|'false'}) {
  return new Promise((resolve, reject) => {
    const { server } = eConfig;
    if (cmd.cssModules !== undefined) {
      if (cmd.cssModules === 'true') {
        eConfig.webpack.cssModules.enable = true
      }
      if (cmd.cssModules === 'false') {
        eConfig.webpack.cssModules.enable = false
      }
    }
    const config = webpackConfig(eConfig);
    webpackDevServer.addDevServerEntrypoints(config, config.devServer);
    new webpackDevServer(webpackCompiler(cmd), config.devServer).listen(
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
