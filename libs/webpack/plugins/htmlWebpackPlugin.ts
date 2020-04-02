import {isDev} from '../../utils/env';
import EConfig from '../../settings/EConfig';
import * as path from 'path';
import * as fs from 'fs';
import {WORKING_DIRECTORY} from '../../constants/constants';
const HtmlWebpackPlugin = require('html-webpack-plugin');
const minify = require('html-minifier').minify;
const {apps, htmlWebpackPlugin: {title}} = EConfig.getInstance();
function htmlWebpackPluginInstance(templatePath: string, filename: string, chunks: string[]) {
    return new HtmlWebpackPlugin({
        template: templatePath,
        filename: filename,
        //minify: isDev() ? false :minify,
        hash: !isDev(),
        inject: true,
        alwaysWriteToDisk: true,
        chunks: chunks,
        chunksSortMode: 'dependency',
        title:title||'webApp'
    });
}

export default function getHtmlWebpackPlugins(htmlWebpackPlugin:any,entries?): any[] {
    return (entries() || apps).map((app) => {
        const workingDirectory = process.cwd();
        const relativeTargetDirectory = `${app}`;
        const relativeTargetHtml = path.join(relativeTargetDirectory, '/index.html');
        const projectTargetPath = path.resolve(workingDirectory, 'src/',relativeTargetHtml);
        const relativeTargetJSP = path.join(relativeTargetDirectory, '/index.jsp');      
        const projectTargetPathJSP = path.resolve(workingDirectory, 'src/',relativeTargetJSP);
        if (fs.existsSync(projectTargetPath)) {
            return htmlWebpackPluginInstance(projectTargetPath, relativeTargetHtml, [app,'common']);
        }
        else if(fs.existsSync(projectTargetPathJSP)) {
            return htmlWebpackPluginInstance(projectTargetPathJSP, relativeTargetJSP, [app,'common']);
        }
        else {
            const baseTarget = path.resolve(__dirname, '../../../tpl/index.ejs');
            return htmlWebpackPluginInstance(baseTarget, relativeTargetHtml, [app,'common']);
        }
    });
}