import {isDev} from '../../utils/env';
import EConfig from '../../settings/EConfig';
import * as path from 'path';
import * as fs from 'fs';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const minify = require('html-minifier').minify;
const {apps, htmlWebpackPlugin: {title},webpack:{commonsChunkPlugin}} = EConfig.getInstance();
function htmlWebpackPluginInstance(templatePath: string, filename: string, chunks: string[], chunksSortMode?: string) {
    const options: any = {
        template: templatePath,
        filename: filename,
        //minify: isDev() ? false :minify,
        hash: !isDev(),
        inject: true,
        alwaysWriteToDisk: true,
        chunks: chunks,
        // WP5: chunksSortMode 由 webpack 5 原生处理
        title: title||'webApp'
    };
    // chunksSortMode 仅在显式指定时设置：v5 对显式 undefined 会覆盖默认 'auto' 并校验失败
    if (chunksSortMode) {
        options.chunksSortMode = chunksSortMode;
    }
    return new HtmlWebpackPlugin(options);
}

/**
 * Fast Refresh 时序修复：react-dom 被 splitChunks 抽进先加载的 common chunk 后，
 * 其模块顶层的 devtools hook 注册会先于 refresh runtime 执行而永久失效（renderers=0）。
 * 必须让 refresh runtime 独立成 chunk 并以 manual 模式排进 HTML 最前（refresh → common → app）。
 * 仅 rspack dev 传入 refreshChunk 启用；webpack 引擎与生产构建维持原生 'auto' 依赖排序
 */
export default function getHtmlWebpackPlugins(htmlWebpackPlugin:any,entries?,refreshChunk?: string): any[] {
    return (entries() || apps).map((app) => {
        const workingDirectory = process.cwd();
        const chunk = [...new Set(commonsChunkPlugin.concat(['common']))]
        const relativeTargetDirectory = `${app}`;
        const relativeTargetHtml = path.join(relativeTargetDirectory, '/index.html');
        const projectTargetPath = path.resolve(workingDirectory, 'src/',relativeTargetHtml);
        const relativeTargetJSP = path.join(relativeTargetDirectory, '/index.jsp');
        const projectTargetPathJSP = path.resolve(workingDirectory, 'src/',relativeTargetJSP);
        if (refreshChunk) {
            const orderedChunks = [refreshChunk, ...chunk, app];
            const useManual = (templatePath: string, filename: string) => htmlWebpackPluginInstance(templatePath, filename, orderedChunks, 'manual');
            if (fs.existsSync(projectTargetPath)) {
                return useManual(projectTargetPath, relativeTargetHtml);
            }
            else if(fs.existsSync(projectTargetPathJSP)) {
                return useManual(projectTargetPathJSP, relativeTargetJSP);
            }
            else {
                const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
                return useManual(baseTarget, relativeTargetHtml);
            }
        }
        if (fs.existsSync(projectTargetPath)) {
            return htmlWebpackPluginInstance(projectTargetPath, relativeTargetHtml, [app,...chunk]);
        }
        else if(fs.existsSync(projectTargetPathJSP)) {
            return htmlWebpackPluginInstance(projectTargetPathJSP, relativeTargetJSP, [app,...chunk]);
        }
        else {
            const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
            return htmlWebpackPluginInstance(baseTarget, relativeTargetHtml, [app,...chunk]);
        }
    });
}