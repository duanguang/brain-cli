
import {asSeconds} from '../utils/format';
import getConfig from '../../webpack.config';
import EConfig from '../settings/EConfig';
import { log, logAppRunning } from '../utils/logs';
import { URL_PREFIX } from '../constants/constants';
import { chkUpdateNotifier } from '../utils/update-notifier';
import { displayAvailableIPs, getAvailableIPs } from '../utils/ip';
const webpack = require('webpack');
export default function webpackCompiler(options?:any) {
    const webpackConfig = getConfig(EConfig.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    delete webpackConfig.pendings;
    const webpackCompiler = webpack(webpackConfig);
    const {name: projectName,apps, defaultPort,devServer:{https},server} = EConfig.getInstance();
    const projectUrl=`${URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`
    let bundleStartTime;

    // WP5: 使用 hooks API 替代 plugin() 方法
    webpackCompiler.hooks.compile.tap('brain-cli', () => {
        log('打包中...');
        bundleStartTime = Date.now();
    });

    webpackCompiler.hooks.done.tap('brain-cli', () => {
        const timeSpent = Date.now() - bundleStartTime;
        log(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
        logAppRunning({ port: defaultPort,projectUrl,https,server });
        chkUpdateNotifier();
    });
    return webpackCompiler;
}
