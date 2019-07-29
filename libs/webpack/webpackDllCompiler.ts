import * as webpack from 'webpack';
import WebpackDllManifest from '../settings/WebpackDllManifest';
import { log } from '../utils/logs';
import { DllPlugins } from '../../cfg/dllPlugins';
import EConfig from '../settings/EConfig';
const dllConfig = require('../../cfg/dll');
const {vendors,...otherDll } = EConfig.getInstance().webpack.dllConfig;
export default function webpackDllCompiler(): Promise<any> {
    const requireCompile = WebpackDllManifest.getInstance().isCompileManifestDirty();
    return new Promise((resolve, reject) => {
        if (!dllConfig) {
            log(`ignore webpack dll manifest compile`);
            //console.info('ignore webpack dll manifest compile');
            resolve();
            return;
        }
        if (requireCompile) {
            log(`create webpack dll manifest [vendors]`);
            //console.info('create webpack dll manifest');
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
            log('skip webpack dll manifest [vendors]')
            //console.info('skip webpack dll manifest');
            resolve();
        }
    });
}
export async function webpackDllPluginsCompiler() {
    const promiseDll = []
    Object.keys(DllPlugins).forEach((key) => {
        let vendorsDll = []
        if (typeof otherDll[key] === 'object') {
            if (Array.isArray(otherDll[key])) {
                vendorsDll = otherDll[key]
            } else {
                vendorsDll = otherDll[key].FrameList || []
            }
        }
        const requireCompile = WebpackDllManifest.getInstance().isCompileManifestDirty(key,WebpackDllManifest.getInstance().getDllPluginsHash(vendorsDll));
        const promise= new Promise((resolve, reject) => {
            if (!DllPlugins[key]) {
                log(`ignore webpack dll manifest compile`);
                //console.info('ignore webpack dll manifest compile');
                resolve();
                return;
            }
            if (requireCompile) {
                log(`create webpack dll manifest [${key}]`);
                //console.info('create webpack dll manifest');
                const compiler = webpack(DllPlugins[key]);
                compiler.run((err, stats) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(stats);
                });
            }
            else {
                log(`skip webpack dll manifest [${key}]`)
                //console.info('skip webpack dll manifest');
                resolve();
            }
        });
        promiseDll.push(promise)
    })
    let result = ''
    await Promise.all(promiseDll).then((values) => {
        // @ts-ignore
        result = values
    });
    return result;
}