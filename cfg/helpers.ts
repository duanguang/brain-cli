import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import * as path from 'path';
const {DllReferencePlugin} = require('webpack');
const glob = require('glob');

export function getDllReferencePlugin(entityName:string='vendor') {
    try {
        const webpackDllManifest = WebpackDllManifest.getInstance();
        // const vendorsHash = webpackDllManifest.getVendorsHash();
        const distPath = webpackDllManifest.distPath;
        // const manifest = require(path.join(distPath, vendorsHash + `.json`));
        const manifest = require(path.join(distPath,`${entityName}.dll` + `.json`));
        return new DllReferencePlugin({
            context: process.cwd(),
            manifest
        });
    } catch (e) {
        console.error(e);
        return null;
    }
}

export function getEntry(pathDir: string): string[] {
    let files = glob.sync(`${pathDir}`);
    let entries = [],
        entry, dirname, basename, pathname, extname;

    for (let i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.normalize(path.join(dirname, basename));
        pathDir = path.normalize(pathDir);
        if (pathname.startsWith(pathDir)) {
            pathname = pathname.substring(pathDir.length)
        }
        entries.push('./' + entry);
    }
    return entries;
}