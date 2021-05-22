import EConfig, { IDllCompileOptions, IDllConfigType } from '../libs/settings/EConfig';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
const path = require('path');
const webpack = require('webpack');
const {webpack:{dllConfig:{vendors,compileOptions:{output = {},plugins=[]}}}} = EConfig.getInstance();

const webpackDllManifest = WebpackDllManifest.getInstance();
const distPath = webpackDllManifest.distPath;
let value = [];
let options: IDllCompileOptions = {output: {}, plugins: []};
if (Object.prototype.toString.call(vendors) === '[object Object]') {
    const newVendors = vendors as IDllConfigType;
    value = newVendors.value;
    if (newVendors.options) {
        options = newVendors.options;
    }
}
else if (Array.isArray(vendors)) {
    value = vendors;
}

const isVendorExist = value && value.length;
if (isVendorExist) {
    const distFileName = webpackDllManifest.getVendorsHash();
    let dllPlugins = plugins;
    if (
        options.plugins &&
        Array.isArray(options.plugins) &&
        options.plugins.length
    ){
        dllPlugins = options.plugins;
    }
    module.exports = {
        entry: {
            vendors:value
        },
        mode: 'production',
        output: {
            ...{ ...output, ...options.output },
            path: distPath,
            // filename: `${distFileName}.js`,
            filename: `vendor.dll.${distFileName}.js`,
            /**
             * output.library
             * 将会定义为 window.${output.library}
             * 在这次的例子中，将会定义为`window.vendor_library`
             */
           library: `[name]_${distFileName}_library`,
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
                path: path.join(distPath, `vendor.dll.json`),
                /**
                 * name
                 * dll bundle 输出到那个全局变量上
                 * 和 output.library 一样即可。
                 */
                name: `[name]_${distFileName}_library`
            }),
            ...dllPlugins
        ]
    };
}
else {
    console.log(`webpack dll vendor is empty`);
    module.exports = null;
}

