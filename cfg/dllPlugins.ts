import EConfig from '../libs/settings/EConfig';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
const path = require('path');
const webpack = require('webpack');
const {webpack:{dllConfig}} = EConfig.getInstance();
const {vendors,dllCompileParam:{output,plugins=[]},...otherDll } = dllConfig
const webpackDllManifest = WebpackDllManifest.getInstance();
const distPath = webpackDllManifest.distPath;
const DllPlugins = {}
if (otherDll&& typeof otherDll==='object'&&!Array.isArray(otherDll)) {
    Object.keys(otherDll).forEach((key) => {
        let vendorsDll = []
        if (typeof otherDll[key] === 'object') {
            if (Array.isArray(otherDll[key])) {
                vendorsDll = otherDll[key]
            } else {
                vendorsDll = otherDll[key].FrameList || []
            }
        }
        const isVendorExist =vendorsDll && vendorsDll.length;
        if (isVendorExist) {
            const distFileName = webpackDllManifest.getDllPluginsHash(vendorsDll);
            const dll =  {
                entry: {
                    key:vendorsDll
                },
                mode: 'production',
                output: {
                    ...output,
                    path: distPath,
                    // filename: `${distFileName}.js`,
                    filename: `${key}.dll.${distFileName}.js`,
                    /**
                     * output.library
                     * 将会定义为 window.${output.library}
                     * 在这次的例子中，将会定义为`window.vendor_library`
                     */
                   library: `${key}_${distFileName}_library`,
                   /* library: '[name]_library', */
                },
                plugins: [
                    new webpack.DllPlugin({
                        /**
                         * path
                         * 定义 manifest 文件生成的位置
                         * [name]的部分由entry的名字替换
                         */
                        // path: path.join(distPath, `${distFileName}.json`),
                        path: path.join(distPath, `${key}.dll.json`),
                        /**
                         * name
                         * dll bundle 输出到那个全局变量上
                         * 和 output.library 一样即可。
                         */
                        name: `${key}_${distFileName}_library`
                    }),
                    ...plugins
                ]
            };
            DllPlugins[key] = dll
        }
        else {
            console.log(`webpack dll vendor is empty`);
            module.exports = null;
        }
    })
}
export { DllPlugins };





