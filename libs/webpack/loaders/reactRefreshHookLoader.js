/**
 * React Fast Refresh 时序修复 loader（rspack 引擎 dev 专用，规则见 cfg/rspack/base.js）。
 *
 * 问题：react-dom 被 splitChunks 抽进先加载的 common chunk，插件默认注入的
 * refresh runtime（匿名 entry）模块被一同抽进 common 但从未被执行，devtools hook
 * 从未安装，react-dom 顶层的 renderer 注册（injectIntoDevTools → hook.inject）
 * 因 hook 缺失被永久跳过，热更新只剩模块替换、无法驱动 React 重渲染。
 *
 * 方案：在 react-dom 模块前 prepend hook 安装代码，把 react-refresh/runtime 的
 * injectIntoGlobalHook 强制绑定在 react-dom 顶层注册之前——依赖图层面的确定性时序，
 * 不受 chunk 拆分影响。守卫标志与 reactRefreshEntry 同名，双路径注入时后到者自动跳过。
 *
 * DLL 启用时 react-dom 在 DLL bundle 以 script 加载、本 loader 不命中，
 * 时序由 rspackDllHtmlPlugin 的 HTML 前置注入接管（见 reactRefreshHookSnippet.js）。
 */
var snippet = require('./reactRefreshHookSnippet.js');

module.exports = function reactRefreshHookLoader(source) {
  this.cacheable();
  return snippet.loaderCode + '\n' + source;
};
