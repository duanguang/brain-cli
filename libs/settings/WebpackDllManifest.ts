import EConfig from './EConfig';
import {shortHash} from '../utils/hash';
import * as fs from 'fs';
import {WEBPACK_DLL_MANIFEST_DIST} from '../constants/constants';
import * as path from 'path';
import {emulateNodeRecursiveLookup} from '../utils/node';

export default class WebpackDllManifest {

    private static instance: WebpackDllManifest;

    public static getInstance(): WebpackDllManifest {
        if (!WebpackDllManifest.instance) {
            WebpackDllManifest.instance = new WebpackDllManifest();
        }
        return WebpackDllManifest.instance;
    }

    private vendors: string[];
    public distPath: string;

    private constructor() {
        this.vendors = EConfig.getInstance().webpack.dllConfig.vendors;
        this.distPath = WEBPACK_DLL_MANIFEST_DIST;
    }

    private hashValue: string;

    public getVendorsHash(): string {
        const isVendorsExist = this.vendors && this.vendors.length;
        if (!this.hashValue && isVendorsExist) {
            const identifier = this.vendors.reduce((prev, vendorName: string) => {
                const vendorVersion = WebpackDllManifest.getVendorVersion(vendorName);
                /**
                 * 这里采取拼接的方式是因为vendors的是一个array, 且顺序为dll编译顺序
                 * 拼接的结果作为唯一标识, hash base64后得到一个简短合法用于唯一标识的文件名
                 */
                return prev + vendorName + vendorVersion;
            }, ``);
            this.hashValue = shortHash(identifier);
        }
        return this.hashValue;
    }

    private static getVendorVersion(vendorName: string, baseDir = process.cwd()) {
        const packageJson = emulateNodeRecursiveLookup(baseDir, `node_modules/${vendorName}/package.json`);
        if (!packageJson) {
            throw new Error(`vendor[${vendorName}] package not found`);
        }
        const vendorVersion = packageJson.version;
        if (!vendorVersion) {
            throw new Error(`vendor[${vendorName}] version is empty`);
        }
        return vendorVersion;
    }

    public isCompileManifestDirty() {
        try {
            return !fs.existsSync(this.resolveManifestPath());
        } catch (e) {
            return true;
        }
    }re

    public resolveManifestPath() {
        /**
         * require.resolve为了提前判断是否存在该模块
         */
        try {
            // return require.resolve(path.resolve(this.distPath, this.getVendorsHash() + `.js`))
            return require.resolve(path.resolve(this.distPath, `vendor.dll.${this.getVendorsHash()}` + `.js`))
        } catch (e) {
            return null;
        }
    }
}

