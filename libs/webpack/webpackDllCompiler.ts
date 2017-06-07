import * as webpack from 'webpack';
import WebpackDllManifest from '../settings/WebpackDllManifest';
const dllConfig = require('../../cfg/dll');

export default function webpackDllCompiler(): Promise<any> {
    const requireCompile = WebpackDllManifest.getInstance().isCompileManifestDirty();
    return new Promise((resolve, reject) => {
        if (!dllConfig) {
            console.info('ignore webpack dll manifest compile');
            resolve();
            return;
        }
        if (requireCompile) {
            console.info('create webpack dll manifest');
            const compiler = webpack(dllConfig);
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(stats);
            });
        }
        else {
            console.info('skip webpack dll manifest');
            resolve();
        }
    });
}