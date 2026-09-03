/**
 * DLL 模式的 Fast Refresh 业务侧增强 loader（rspack 引擎 dev 专用）。
 *
 * 背景：DLL 模式下 react-dom 在 DLL bundle 以 script 标签加载（不经过 rspack 编译），
 * reactRefreshHookLoader 无法命中；rspackDllHtmlPlugin 注入的自包含 stub hook
 * （__rrNeedsEnhance=true）让 DLL react-dom 完成注册（renderers Map 有值），
 * 但 react-refresh runtime 的 helpersByRendererID 尚未登记——必须由「业务 bundle 内、
 * 使用同一 runtime 实例」的代码回扫 renderers Map 补登记，performReactRefresh 才有 helpers 可用。
 *
 * 本 loader prepend 到所有 src JS/TS 模块：模块执行时检测 __rrNeedsEnhance 标志，
 * 首个模块执行时调 injectIntoGlobalHook 增强 stub（包装 inject/onCommit 钩子 +
 * renderers.forEach 回扫补登记 helpersByRendererID），随后清标志（幂等）。
 */
var snippet = require('./reactRefreshHookSnippet.js');

/** 增强检查代码：前置到每个 src JS/TS 模块 */
var enhanceCode = [
  'if (typeof window !== "undefined" && window.__rrNeedsEnhance) {',
  '  window.__rrNeedsEnhance = false;',
  '  require(' + JSON.stringify(snippet.runtimePath) + ').injectIntoGlobalHook(window);',
  '}',
].join('\n');

module.exports = function rspackRefreshEnhanceLoader(source) {
  this.cacheable();
  return enhanceCode + '\n' + source;
};
