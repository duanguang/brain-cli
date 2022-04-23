import EConfig from '../settings/EConfig';
import { isDev } from '../utils/env';
import * as path from 'path';
const {
  webpack: { happyPack, disableReactHotLoader, tsCompilePlugin, extend },
  babel,
} = EConfig.getInstance();
const __DEV__ = isDev();
const DisableReactHotLoader = disableReactHotLoader || false; //默认启用热加载
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
        // disable type checker - we will use it in fork plugin
        transpileOnly: true,
        happyPackMode: true,
      },
      ...(tsCompileOption || {}),
    },
  };
};
export const getTsLoadersed = (include:string[]=[]) => {
  const loaders = [];
  if (happyPack && happyPack.open) {
    loaders.push({
      test: /\.(ts|tsx)$/,
      include: [path.join(process.cwd(), './src')].concat(include),
      loader: 'happypack/loader?id=ts',
      // exclude: [nodeModulesPath],
    });
  } else {
    // 解决多线程下ts-loader 编译插件无法被执行问题
    loaders.push({
      test: /\.(ts|tsx)$/,
      include: [path.join(process.cwd(), './src')].concat(include),
      use: [
        {
          loader: 'babel-loader',
          query: babel.query,
        },
        tsloaderPlugin(),
      ],
      // exclude: [nodeModulesPath],
    });
  }
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      loaderType: 'tsLoader',
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
        // loader: 'react-hot',
        loader: 'babel-loader',
        include: [path.join(process.cwd(), './src')].concat(include),
        exclude: [nodeModulesPath], //优化构建效率
        options: {
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          plugins: ['react-hot-loader/babel'],
        },
      });
      if (hasWebpackExtend()) {
        extend(hotLoader, {
          isDev: __DEV__,
          loaderType: 'hotLoader',
        });
      }
    }
  }
  if (happyPack && happyPack.open) {
    loaders.push({
      test: /\.(jsx|js)?$/,
      include: [path.join(process.cwd(), './src')].concat(include),
      loader: 'happypack/loader?id=js',
    });
  } else {
    loaders.push({
      test: /\.(jsx|js)?$/,
      include: [path.join(process.cwd(), './src')].concat(include),
      use: [
        {
          loader: `babel-loader`,
          query: babel.query,
        },
      ],
    });
  }
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      loaderType: 'jsLoader',
    });
  }
  return [...hotLoader,...loaders];
};
