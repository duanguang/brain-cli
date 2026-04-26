import EConfig from '../settings/EConfig';
import { isDev } from '../utils/env';
import * as path from 'path';
const {
  webpack:{ disableReactHotLoader, tsCompilePlugin, extend},
  babel,
} = EConfig.getInstance();
const __DEV__ = isDev();
const DisableReactHotLoader = disableReactHotLoader || false;
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
function hasWebpackExtend() {
  if (extend && typeof extend === 'function') {
    return true;
  }
  return false;
}
export const tsloaderPlugin = () => {
  let tsCompileOption = {};
  if (tsCompilePlugin && tsCompilePlugin.option) {
    tsCompileOption = tsCompilePlugin.option;
  }
  return {
    loader: require.resolve('ts-loader'),
    options: {
      ...{
        transpileOnly: true,
        // WP5: 移除 happyPackMode，不再使用 HappyPack
      },
      ...(tsCompileOption || {}),
    },
  };
};
export const getTsLoadersed = (include:string[]=[]) => {
  const loaders = [];
  // WP5: 统一使用 babel-loader + ts-loader，不再区分 HappyPack 模式
  loaders.push({
    test: /\.(ts|tsx)$/,
    include: [path.join(process.cwd(), './src')].concat(include),
    use: [
      {
        loader: 'babel-loader',
        options: babel.query,
      },
      tsloaderPlugin(),
    ],
  });
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      type: 'ts_loader',
    });
  }
  return loaders;
};
export const getJSXLoadersed = (include:string[]=[]) => {
    const loaders = [];
    const hotLoader = [];
  if (__DEV__) {
    if (!DisableReactHotLoader) {
        hotLoader.push({
        test: /\.(jsx|js)?$/,
        loader: 'babel-loader',
        include: [path.join(process.cwd(), './src')].concat(include),
        exclude: [nodeModulesPath],
        options: {
          cacheDirectory: true,
          plugins: ['react-hot-loader/babel'],
        },
      });
      if (hasWebpackExtend()) {
        extend(hotLoader, {
          isDev: __DEV__,
          type: 'hot_loader',
        });
      }
    }
  }
  // WP5: 统一使用 babel-loader，不再区分 HappyPack 模式
  loaders.push({
    test: /\.(jsx|js)?$/,
    include: [path.join(process.cwd(), './src')].concat(include),
    use: [
      {
        loader: `babel-loader`,
        options: babel.query,
      },
    ],
  });
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      type: 'js_loader',
    });
  }
  return [...hotLoader,...loaders];
};
