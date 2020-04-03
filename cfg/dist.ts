import getBaseConfig from './base';
import EConfig from '../libs/settings/EConfig';
// const getDistConfig = getBaseConfig;
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import { getDllReferencePlugin } from './helpers';
import { DllPlugins } from './dllPlugins';
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const {webpack:{dllConfig}} = EConfig.getInstance();
const {vendors,...otherDll } = dllConfig
const path = require('path')
export default function getDistConfig(eConfig: EConfig) {
    const config = getBaseConfig(eConfig);
    config.pendings = [
        () => {
            //TODO:暂时放在这里
            const filepath = WebpackDllManifest.getInstance().resolveManifestPath();
            if (filepath) {
                let publicPath = path.posix.join('../','common/js')
                let cdn = ''
                if (typeof vendors === 'object' && !Array.isArray(vendors)) {
                    if (vendors.cdn) {
                        cdn = vendors.cdn
                    }
                }
                if (cdn || process.env.cdnRelease) {
                    publicPath = `${cdn||process.env.cdnRelease}/common/js`
                }
                config.plugins.push(new AddAssetHtmlPlugin({
                    includeSourcemap: false, filepath,
                    outputPath: 'common/js',
                
                    publicPath,
                }));
                const dllReferencePlugin = getDllReferencePlugin();
                if (dllReferencePlugin) {
                    config.plugins.push(dllReferencePlugin)
                }
            }
            Object.keys(DllPlugins).forEach((key) => {
                let vendorsDll = []
                let publicPath = path.posix.join('../','common/js')
                let cdn =''
                if (typeof otherDll[key] === 'object') {
                    if (Array.isArray(otherDll[key])) {
                        vendorsDll = otherDll[key]
                    } else {
                        vendorsDll = otherDll[key].FrameList || []
                        if (otherDll[key].cdn) {
                            cdn = otherDll[key].cdn
                        }
                    }
                    if (cdn || process.env.cdnRelease) {
                        publicPath = `${cdn||process.env.cdnRelease}/common/js`
                    }
                }
                const filepath = WebpackDllManifest.getInstance().resolveManifestPath(key,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
                if (filepath) {
                    config.plugins.push(new AddAssetHtmlPlugin({
                        includeSourcemap: false,filepath,
                        outputPath: 'common/js',
                        publicPath
                        /* publicPath:process.env.cdnRelease?`${process.env.cdnRelease}/common/js`:path.posix.join('../', 'common/js'), */
                    }));
                    const dllReference = getDllReferencePlugin(key);
                    if (dllReference) {
                        config.plugins.push(dllReference)
                    }
                }
            })
        }
    ];
    return config;
}