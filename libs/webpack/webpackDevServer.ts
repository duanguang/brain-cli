import EConfig from '../settings/EConfig';
import webpackCompiler from './webpackCompiler';
const WebpackDevServer = require('webpack-dev-server');
import webpackConfig from '../../webpack.config';
import { log } from '../utils/logs';
import { URL_PREFIX } from '../constants/constants';
const eConfig = EConfig.getInstance();
const {name: projectName,apps} = eConfig;
/**
 * 启动webpack服务器 (WP5 + webpack-dev-server v4)
 */
export default function startWebpackDevServer(options?:any) {
  return new Promise((resolve, reject) => {
    const { server = '0.0.0.0' } = eConfig;
    const config = webpackConfig(eConfig);
    // 处理 pendings（DLL 引用插件等）
    if (Array.isArray(config.pendings)) {
      config.pendings.forEach(pending => pending());
    }
    delete config.pendings;
    const compiler = webpackCompiler();
    // WP5 + webpack-dev-server v4: 构造函数签名变更 (options, compiler)
    // v4 移除了 addDevServerEntrypoints，不再需要手动调用
    const devServerOptions = config.devServer || {};
    // 确保端口和 host 配置正确
    devServerOptions.port = eConfig.defaultPort;
    devServerOptions.host = server;
    const devServer = new WebpackDevServer(devServerOptions, compiler);
    // v4: startCallback 只接收回调函数，端口/host 从 devServerOptions 读取
    devServer.startCallback((err) => {
      if (err) {
        reject(err);
      }
      log(`监听本地 ${server}:${eConfig.defaultPort}`);
      resolve(undefined);
    });
  });
}
