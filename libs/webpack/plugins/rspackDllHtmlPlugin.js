/**
 * DLL 模式的 HTML 前置注入 + 产物 emit 插件（rspack 引擎 dev 专用）。
 *
 * 对齐 webpack 引擎（AddAssetHtmlPlugin）的语义：
 * - DLL 文件 emit 进编译产物 → URL 走 output.publicPath（如 /public/test/vendor.dll.xxx.js），
 *   dev 由 devMiddleware 服务，与 webpack 引擎的 URL 语义完全一致
 * - script 注入 HTML head 首位（AddAssetHtmlPlugin 的实际注入位置），顺序：
 *   1. Fast Refresh hook stub 内联 script（自包含、无 require，模仿真 DevTools hook：
 *      inject 直接写 renderers Map，使 DLL react-dom 顶层注册能完成；
 *      __rrNeedsEnhance 标志交由业务侧 rspackRefreshEnhanceLoader 消费——
 *      首个业务模块执行时 injectIntoGlobalHook 增强 stub 并回扫 renderers 补登记 helpers）
 *   2. DLL scripts
 *   hook stub → DLL → 业务 entry，依赖加载层面保证 Fast Refresh 时序。
 *   完整 DLL 模式（react-dom 在 DLL 内，production 构建无 refresh API）不注入 hook stub。
 */
var snippet = require('../loaders/reactRefreshHookSnippet.js');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var fs = require('fs');
var path = require('path');
var RawSource = require('@rspack/core').rspack
  ? require('@rspack/core').rspack.sources.RawSource
  : null;

function RspackDllHtmlPlugin(options) {
  this.scripts = (options && options.scripts) || [];
  this.injectHookStub = !options || options.injectHookStub !== false;
}

RspackDllHtmlPlugin.prototype.apply = function (compiler) {
  var self = this;
  var scripts = this.scripts;
  var injectHookStub = this.injectHookStub;
  var inlineStub = snippet.inlineStubCode;
  compiler.hooks.compilation.tap('RspackDllHtmlPlugin', function (compilation, params) {
    // 1. DLL 文件 emit 进编译产物（对齐 AddAssetHtmlPlugin 语义：URL 走 publicPath）
    if (RawSource) {
      compilation.hooks.processAssets.tap(
        { name: 'RspackDllHtmlPlugin', stage: compiler.rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        function () {
          scripts.forEach(function (item) {
            // item: { basename, diskPath } —— DLL 磁盘文件 emit 为 publicPath 下的 asset
            var diskPath = item.diskPath;
            if (fs.existsSync(diskPath) && !compilation.getAsset(item.basename)) {
              compilation.emitAsset(item.basename, new RawSource(fs.readFileSync(diskPath)));
            }
          });
        }
      );
    }
    // 2. HTML script 前置注入（hook stub → DLL），URL = publicPath + basename
    var hooks = HtmlWebpackPlugin.getHooks(compilation);
    hooks.alterAssetTagGroups.tap('RspackDllHtmlPlugin', function (data) {
      var headTags = [];
      if (injectHookStub) {
        headTags.push({
          tagName: 'script',
          innerHTML: inlineStub,
          closeTag: true,
          voidTag: false,
          attributes: {},
        });
      }
      scripts.forEach(function (item) {
        headTags.push({
          tagName: 'script',
          closeTag: true,
          voidTag: false,
          attributes: { src: item.publicSrc, defer: false },
        });
      });
      data.headTags = headTags.concat(data.headTags || []);
      return data;
    });
  });
};

module.exports = RspackDllHtmlPlugin;
