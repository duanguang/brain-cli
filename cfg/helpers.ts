import WebpackDllManifest from '../libs/settings/WebpackDllManifest';
import EConfig from '../libs/settings/EConfig';
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

/**
 * rspack 版 DllReferencePlugin 工厂（cfg/rspack/dev.js DLL 注入用）。
 * webpack 包的 DllReferencePlugin 在 @rspack/core 2.x 编译器下 hook 不兼容会崩
 * （同 DefinePlugin 前科），必须用 @rspack/core 的实现；manifest 为标准 JSON 协议，
 * 可直接消费 brain-cli dll（webpack DllPlugin）构建的产物。
 */
/**
 * DLL 显式关闭判定：读用户侧原始 .e-config.js / .e-config-ignore.js（后者优先），
 * 判断 vendors 是否被显式配置为空——数组形式 [] 或对象形式 { value: [] } 均视为关闭。
 *
 * 为什么不读 EConfig 单例：EConfig 用 deep-assign 合并默认模板与项目配置，数组按索引
 * 合并（[] 无法清空模板值，实测 vendors: [] 合并后残留为模板全量），导致「配置空数组
 * 关闭 DLL」的直觉失效。本函数绕过合并语义直接读原始文件，尊重用户显式意图。
 *
 * 双引擎共用：rspack（cfg/rspack/dev.js、isReactDomInDll）与 webpack（cfg/dev.js、
 * webpackDllCompiler 自动构建）的 DLL 判定均接入此函数，行为保持一致。
 */
export function isDllExplicitlyDisabled() {
    const fs = require('fs');
    const files = [
        path.resolve(process.cwd(), '.e-config.js'),
        path.resolve(process.cwd(), '.e-config-ignore.js'),
    ];
    let rawVendors;
    // 按优先级取「最后显式配置了 vendors 的文件」的原始值
    files.forEach(function (file) {
        if (!fs.existsSync(file)) {
            return;
        }
        try {
            const raw = require(file);
            const vendors = raw && raw.webpack && raw.webpack.dllConfig && raw.webpack.dllConfig.vendors;
            if (typeof vendors !== 'undefined') {
                rawVendors = vendors;
            }
        }
        catch (e) {
            // 配置文件本身加载失败时交由 EConfig 主链路报错，此处静默
        }
    });
    if (Array.isArray(rawVendors)) {
        return rawVendors.length === 0;
    }
    if (rawVendors && typeof rawVendors === 'object') {
        return Array.isArray(rawVendors.value) && rawVendors.value.length === 0;
    }
    return false;
}

export function getRspackDllReferencePlugin(entityName:string='vendor') {
    try {
        const webpackDllManifest = WebpackDllManifest.getInstance();
        const distPath = webpackDllManifest.distPath;
        const manifest = require(path.join(distPath,`${entityName}.dll` + `.json`));
        const { DllReferencePlugin: RspackDllReferencePlugin } = require('@rspack/core');
        return new RspackDllReferencePlugin({
            context: process.cwd(),
            manifest
        });
    } catch (e) {
        return null;
    }
}

/**
 * 完整 DLL 模式判定：DLL 将注入（配置 + 产物存在）且 react-dom 在注入的 DLL 内。
 * DLL 为 production 构建，其 react-dom 的 Fast Refresh API（scheduleRefresh 等）
 * 为 null（React 16 仅 DEV 构建提供）——此模式下必须同时关闭：
 * 1. ReactRefreshRspackPlugin（dev.js，运行时/包装定义提供者）
 * 2. babel 侧 react-refresh/babel 组件签名转换（base.js，$RefreshSig$ 调用插入者）
 * 两者必须同开同关：只关 1 会留下裸 $RefreshSig$ 调用且无定义 → 启动即崩
 * （legions-pro-examples 实证缺陷，2026-09-04 修复）
 */
export function isReactDomInDll() {
    // 用户显式关闭（vendors 为空数组/空 value）时 DLL 不生效，直接返回 false
    if (isDllExplicitlyDisabled()) {
        return false;
    }
    const webpackDllManifest = WebpackDllManifest.getInstance();
    const eConfig = EConfig.getInstance();
    const dllConfig: any = (eConfig.webpack && eConfig.webpack.dllConfig) || {};
    const vendors = dllConfig.vendors;
    const vendorsValue = Array.isArray(vendors) ? vendors : ((vendors && vendors.value) || []);
    const customDll = dllConfig.customDll;
    const reactDomIn = (value:any) => Array.isArray(value) && value.indexOf('react-dom') !== -1;
    // react-dom 在主 vendors 且主 DLL 产物已构建
    if (reactDomIn(vendorsValue) && webpackDllManifest.resolveManifestPath()) {
        return true;
    }
    // react-dom 在某项 customDll 且该 DLL 产物已构建
    if (Array.isArray(customDll)) {
        for (let i = 0; i < customDll.length; i++) {
            const item = customDll[i];
            if (reactDomIn(item.value) &&
                webpackDllManifest.resolveManifestPath(item.key, webpackDllManifest.getDllPluginsHash(item.value || []))) {
                return true;
            }
        }
    }
    return false;
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