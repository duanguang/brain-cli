import EConfig from '../settings/EConfig';
import { isDev } from '../utils/env';
import * as path from 'path';
const {
  webpack: { happyPack, disableReactHotLoader, tsCompilePlugin, extend },
  babel,
  projectType,
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
export const getTsLoadersed = () => {
  const loaders = [];
  if (happyPack && happyPack.open) {
    loaders.push({
      test: /\.(ts|tsx)$/,
      include: [path.join(process.cwd(), './src')],
      loader: 'happypack/loader?id=ts',
      exclude: [],
    });
  } else {
    // 解决多线程下ts-loader 编译插件无法被执行问题
    loaders.push({
      test: /\.(ts|tsx)$/,
      include: [path.join(process.cwd(), './src')],
      use: [
        {
          loader: 'babel-loader',
          query: babel.query,
        },
        tsloaderPlugin(),
      ],
      exclude: [],
    });
  }
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      loaderType: 'TsLoader',
      projectType,
    });
  }
  return loaders;
};
export const getJSXLoadersed = () => {
    const loaders = [];
    const hotLoader = [];
  if (__DEV__) {
    if (!DisableReactHotLoader) {
        hotLoader.push({
         test: /\.(jsx|js)?$/,
        // loader: 'react-hot',
        loader: 'react-hot-loader!babel-loader',
        include: [path.join(process.cwd(), './src')],
        exclude: [nodeModulesPath], //优化构建效率
      });
      if (hasWebpackExtend()) {
        extend(hotLoader, {
          isDev: __DEV__,
          loaderType: 'HotLoader',
          projectType,
        });
      }
    }
  }
  if (happyPack && happyPack.open) {
    loaders.push({
      test: /\.(jsx|js)?$/,
      include: [path.join(process.cwd(), './src')],
      loader: 'happypack/loader?id=js',
      exclude: [],
    });
  } else {
    loaders.push({
      test: /\.(jsx|js)?$/,
      include: [path.join(process.cwd(), './src')],
      use: [
        {
          loader: `babel-loader`,
          query: babel.query,
        },
      ],
      exclude: [],
    });
  }
  if (hasWebpackExtend()) {
    extend(loaders, {
      isDev: __DEV__,
      loaderType: 'JsLoader',
      projectType,
    });
  }
  return [...hotLoader,...loaders];
};
