import EConfig from '../libs/settings/EConfig';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
const path = require('path');
const webpack = require('webpack');
const {webpack:{dllConfig:{vendors}}} = EConfig.getInstance();

const webpackDllManifest = WebpackDllManifest.getInstance();
const distPath = webpackDllManifest.distPath;


const isVendorExist = vendors && vendors.length;

if (isVendorExist) {
    const distFileName = webpackDllManifest.getVendorsHash();
    module.exports = {
        entry: {
            vendors
        },
        output: {
            path: distPath,
            filename: `${distFileName}.js`,
            /**
             * output.library
             * 将会定义为 window.${output.library}
             * 在这次的例子中，将会定义为`window.vendor_library`
             */
            library: '[name]_library'
        },
        plugins: [
            new webpack.DllPlugin({
                /**
                 * path
                 * 定义 manifest 文件生成的位置
                 * [name]的部分由entry的名字替换
                 */
                path: path.join(distPath, `${distFileName}.json`),
                /**
                 * name
                 * dll bundle 输出到那个全局变量上
                 * 和 output.library 一样即可。
                 */
                name: '[name]_library'
            })
        ]
    };
}
else {
    console.log(`webpack dll vendor is empty`);
    module.exports = null;
}

