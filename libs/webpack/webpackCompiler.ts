import {asSeconds} from '../utils/format';
import getConfig from '../../webpack.config';
import EConfig from '../settings/EConfig';
import { log, logAppRunning } from '../utils/logs';
import { chkUpdateNotifier } from '../utils/update-notifier';
import { URL_PREFIX } from '../constants/constants';
const webpack = require('webpack');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
export default function webpackCompiler(cmd?:{smp:'true'|'false'}) {
    const webpackConfig = getConfig(EConfig.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    delete webpackConfig.pendings;
    const webpackCompiler = webpack((cmd&&cmd.smp==='true')?smp.wrap(webpackConfig):webpackConfig);
    const {name: projectName,apps, defaultPort,devServer:{https},server} = EConfig.getInstance();
    const projectUrl=`${URL_PREFIX}/${projectName}/${apps.length ? apps[0] : ''}`
    let bundleStartTime;

    webpackCompiler.plugin('compile', () => {
        log('打包中...')
        //console.info('打包中...');
        bundleStartTime = Date.now();
    });

    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        log(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
        logAppRunning({ port: defaultPort,projectUrl,https,server });
        chkUpdateNotifier();
        //console.info(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}