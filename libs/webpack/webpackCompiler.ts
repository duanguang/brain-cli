import {asSeconds} from '../utils/format';
import getConfig from '../../webpack.config';
import EConfig from '../settings/EConfig';
const webpack = require('webpack');

export default function webpackCompiler() {
    const webpackConfig = getConfig(EConfig.getInstance());

    if (Array.isArray(webpackConfig.pendings)) {
        webpackConfig.pendings.forEach(pending => pending());
    }

    const webpackCompiler = webpack(webpackConfig);

    let bundleStartTime;

    webpackCompiler.plugin('compile', () => {
        console.info('打包中...');
        bundleStartTime = Date.now();
    });

    webpackCompiler.plugin('done', () => {
        const timeSpent = Date.now() - bundleStartTime;
        console.info(`打包完成, 耗时 ${asSeconds(timeSpent)} s. ${new Date()}`);
    });
    return webpackCompiler;
}