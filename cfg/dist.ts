import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
// const getDistConfig = getBaseConfig;
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import { getDllReferencePlugin } from './helpers';
import { DllPlugins } from './dllPlugins';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const {webpack:{dllConfig}} = EConfig.getInstance();
const {vendors,customDll} = dllConfig
const path = require('path')
export default function getDistConfig(eConfig: EConfig) {
    const config = getBaseConfig(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest.getInstance().resolveManifestPath();
            const AssetHtmlPlugin = []
            if (filepath) {
                let publicPath = path.posix.join('../','common/js')
                let cdn = ''
                if (typeof vendors === 'object') {
                    if (!Array.isArray(vendors)) {
                        if (vendors.externalUrl) {
                            cdn = vendors.externalUrl
                        }
                    }
                }
                if (cdn) {
                    publicPath = `${cdn}/common/js`
                }
                AssetHtmlPlugin.push({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                
                    publicPath,
                })
                /* config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                
                    publicPath,
                })); */
                const dllReferencePlugin = getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin)
                }
            }
            Object.keys(DllPlugins).forEach((key) => {
                let vendorsDll = []
                let publicPath = path.posix.join('../','common/js');
                let cdn = '';
                const item = customDll.find((i) => i.key === key);
                if (item) {
                    vendorsDll = item.value;
                    cdn = item.externalUrl;
                }
                if (cdn || process.env.cdnRelease) {
                    publicPath = `${cdn||process.env.cdnRelease}/common/js`
                }
                
                const filepath = WebpackDllManifest.getInstance().resolveManifestPath(key,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    /* config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false,filepath,
                        outputPath: 'common/js',
                        publicPath
                    })); */
                    AssetHtmlPlugin.push({
                        includeSourcemap: false, filepath,
                        outputPath: 'common/js',
                    
                        publicPath,
                    })
                    const dllReference = getDllReferencePlugin(key);
                    if (dllReference) {
                        config.plugins.push(dllReference)
                    }
                }
            })
            config.plugins.push(new AddAssetHtmlPlugin(AssetHtmlPlugin));
        }
    ];
    return config;
}