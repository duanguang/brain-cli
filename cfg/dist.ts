import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
// const getDistConfig = getBaseConfig;
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import { getDllReferencePlugin } from './helpers';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const path = require('path')
export default function getDistConfig(eConfig: EConfig) {
    const config = getBaseConfig(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest.getInstance().resolveManifestPath();
            if (filepath) {
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                    publicPath: path.posix.join('../', 'common/js'),
                }));
                const dllReferencePlugin = getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin)
                }
            }
        }
    ];
    return config;
}