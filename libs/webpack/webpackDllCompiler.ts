import * as webpack from 'webpack';
import WebpackDllManifest from '../settings/WebpackDllManifest';
import { log } from '../utils/logs';
import { DllPlugins } from '../../cfg/dllPlugins';
import EConfig from '../settings/EConfig';
const dllConfig = require('../../cfg/dll');
const {vendors,customDll } = EConfig.getInstance().webpack.dllConfig;
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
    const promiseDll = [];
    const dllManifestInstance = WebpackDllManifest.getInstance();
    Object.keys(DllPlugins).forEach((key) => {
        let vendorsDll = []
        const item = customDll.find((item) => item.key === key);
        if (item) {
            vendorsDll = item.value;
        }
        const hash = dllManifestInstance.getDllPluginsHash(vendorsDll);
        const requireCompile = dllManifestInstance.isCompileManifestDirty(key,hash);
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