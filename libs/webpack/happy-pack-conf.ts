import EConfig from '../settings/EConfig';
import { tsloaderPlugin } from './javaScriptLoader';
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const {
  webpack: { happyPack },
  babel,
} = EConfig.getInstance();

/** JS编译线程插件 */
export const happyPackToJsPlugin = () => {
  if (happyPack && happyPack.open) {
    const jsConfig = happyPack.procJs || {};
    return [
      new HappyPack({
        threads: os.cpus().length - 1,
        ...jsConfig,
        id: 'js',
        /* threadPool: happyThreadPool, */
        use: [
          {
            loader: `babel-loader`,
            query: babel.query,
          },
        ],
      }),
    ];
  }
  return [];
};

export const happyPackToTsPlugin = () => {
  if (happyPack && happyPack.open) {
    const jsConfig = happyPack.procTs || {};
    return [
      new HappyPack({
        threads: os.cpus().length - 1,
        ...jsConfig,
        /* threadPool: happyThreadPool, */
        id: 'ts',
        use: [
          {
            loader: 'babel-loader',
            query: babel.query,
          },
          tsloaderPlugin(),
        ],
      }),
    ];
  }
  return [];
};
