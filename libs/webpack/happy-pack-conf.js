"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EConfig_1 = require("../settings/EConfig");
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const { webpack: { disableHappyPack } } = EConfig_1.default.getInstance();
exports.HappyPackPlugins = disableHappyPack ? [] : [
    new HappyPack({
        id: 'js',
        threadPool: happyThreadPool,
        loaders: [{
                path: 'babel-loader',
                query: { cacheDirectory: true }
            }]
    })
];
