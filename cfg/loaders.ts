import { isDev } from '../libs/utils/env';
import {
  HISTORY_REWRITE_FALL_BACK_REGEX_FUNC,
  DIST,
  WORKING_DIRECTORY,
  DEV,
  nodeModulesPath,
} from '../libs/constants/constants';
import * as path from 'path';
import EConfig from '../libs/settings/EConfig';
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const __DEV__ = isDev();
const CSS_MODULE_OPTION = {
  modules: true,
  importLoaders: 1,
  localIdentName: `[local]-[hash:base64:6]`,
};
let browsers = EConfig.getInstance().postcss.autoprefixer.browsers;
let px2rem = EConfig.getInstance().postcss.px2rem;
const postcss_loader = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: [require('autoprefixer')({ browsers: browsers })],
  },
};
if (px2rem && Object.getOwnPropertyNames(px2rem).length) {
  postcss_loader.options.plugins.push(require('postcss-plugin-px2rem')(px2rem));
}
function generateLoaders(
  cssModule?: {
    modules: boolean;
    importLoaders: number;
    localIdentName: string;
  },
  loader?: string | { loader: string; options: any },
  loaderOptions?
) {
  let style: any = [{ loader: 'css-loader', options: { importLoaders: 1 } }];
  if (cssModule) {
    style[0] = Object.assign(style[0], { options: cssModule });
  }
  if (loader) {
    style.push(loader);
  }
  if (loaderOptions) {
    style.push(loaderOptions);
  }
  if (__DEV__) {
    let styles = ['style-loader', ...style];
    return styles;
  }
  return ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: style,
    /* publicPath: '/', */
  });
}
export const loaders = [
  {
    test: /\.less/,
    use: generateLoaders(null, {
      loader: 'less-loader',
      options: { javascriptEnabled: true },
    }),
    include: [path.resolve(nodeModulesPath, 'antd')],
  },
  {
    test: new RegExp(`^(?!.*\\.modules).*\\.css`),
    use: generateLoaders(null, null, postcss_loader),
    exclude: [nodeModulesPath],
    include: path.join(process.cwd(), './src'),
  },
  {
    /* test: /\.css$/, */
    test: new RegExp(`^(.*\\.modules).*\\.css`),
    use: generateLoaders(CSS_MODULE_OPTION, null, postcss_loader),
    exclude: [nodeModulesPath],
    include: path.join(process.cwd(), './src'),
  },
  {
    test: new RegExp(`^(?!.*\\.modules).*\\.less`),
    use: generateLoaders(null, postcss_loader, {
      loader: 'less-loader',
      options: { javascriptEnabled: true },
    }),
    exclude: [nodeModulesPath],
    include: path.join(process.cwd(), './src'),
  },
  {
    /* test: /\.less/, */
    test: new RegExp(`^(.*\\.modules).*\\.less`),
    use: generateLoaders(CSS_MODULE_OPTION, postcss_loader, {
      loader: 'less-loader',
      options: { javascriptEnabled: true },
    }),
    exclude: [nodeModulesPath],
    include: path.join(process.cwd(), './src'),
  },
];
