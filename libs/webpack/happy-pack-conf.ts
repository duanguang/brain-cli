import EConfig from '../settings/EConfig';
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const {webpack:{disableHappyPack}} = EConfig.getInstance();

export const HappyPackPlugins=disableHappyPack?[]:[
    new HappyPack({
        id: 'js',
        threadPool: happyThreadPool,
        loaders: [ {
            path: 'babel-loader',
            query: { cacheDirectory: true }
          } ]
      })
]
