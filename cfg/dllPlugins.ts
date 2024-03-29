
import EConfig from '../libs/settings/EConfig';
import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
const path = require('path');
const webpack = require('webpack');
const {
  webpack: { dllConfig },
} = EConfig.getInstance();
const {
  vendors,
  compileOptions: { output = {}, plugins = [] },
  customDll,
} = dllConfig;
const webpackDllManifest = WebpackDllManifest.getInstance();
const distPath = webpackDllManifest.distPath;
const DllPlugins = {};
if (Array.isArray(customDll)) {
  customDll.map(item => {
    let vendorsDll = item.value || [];
    const options = item.options || { output: {}, plugins: [] };
    let dllPlugins = plugins;
    if (
      options.plugins &&
      Array.isArray(options.plugins) &&
      options.plugins.length
    ) {
      dllPlugins = options.plugins;
    }
    const isVendorExist = vendorsDll && vendorsDll.length;
    if (isVendorExist) {
      const distFileName = webpackDllManifest.getDllPluginsHash(vendorsDll);
      const dll = {
        entry: {
          key: vendorsDll,
        },
        mode: 'production',
        output: {
          ...{ ...output, ...options.output },
          path: distPath,
          // filename: `${distFileName}.js`,
          filename: `${item.key}.dll.${distFileName}.js`,
          /**
           * output.library
           * 将会定义为 window.${output.library}
           * 在这次的例子中，将会定义为`window.vendor_library`
           */
          library: `${item.key}_${distFileName}_library`,
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
            path: path.join(distPath, `${item.key}.dll.json`),
            /**
             * name
             * dll bundle 输出到那个全局变量上
             * 和 output.library 一样即可。
             */
            name: `${item.key}_${distFileName}_library`,
          }),
          ...dllPlugins,
        ],
      };
      DllPlugins[item.key] = dll;
    } else {
      console.log(`webpack dll vendor is empty`);
      module.exports = null;
    }
  });
}
export { DllPlugins };
