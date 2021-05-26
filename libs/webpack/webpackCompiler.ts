
import {asSeconds} from '../utils/format';
import getConfig from '../../webpack.config';
import EConfig from '../settings/EConfig';
import { log } from '../utils/logs';
import { URL_PREFIX } from '../constants/constants';
const webpack = require('webpack');
export default function webpackCompiler(options?:any) {
    const webpackConfig = getConfig(EConfig.getInstance());
    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }
    delete webpackConfig.pendings;
    const webpackCompiler = webpack(webpackConfig);
    const {name: projectName,apps, defaultPort} = EConfig.getInstance();
    let bundleStartTime;

    webpackCompiler.plugin('compile', () => {
        log('打包中...')
        //console.info('打包中...');
        bundleStartTime = Date.now();
    });

    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        log(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
        log(`server: http://localhost:${defaultPort}/${URL_PREFIX}/${projectName}/${apps.length?apps[0]:''}`);
        //console.info(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}