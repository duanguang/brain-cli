/**
 * React Fast Refresh hook 注入代码（共享 snippet，两段式）。
 *
 * 使用方：
 * - loaderCode: reactRefreshHookLoader prepend 进 react-dom 模块（react-dom 走 rspack 编译时）
 * - inlineStubCode: rspackDllHtmlPlugin 注入 HTML 首位（DLL 模式：react-dom 在 DLL bundle 以
 *   script 标签加载、不经过 rspack 编译，loader 无法命中；stub 模仿真 DevTools hook——
 *   inject 直接写 renderers Map，使 DLL react-dom 完成注册；后续由业务侧增强
 *   （rspackRefreshEnhanceLoader）回扫 renderers Map 补登记 helpers）
 *
 * 守卫标志 __reactRefreshInjected 与 reactRefreshEntry 同名，双路径注入后到者自动跳过（幂等）。
 */

var reactRefreshRuntimePath = require.resolve('react-refresh/runtime');

/** loader 版：rspack 模块机制内 require 可用，装 stub + 立即增强，一次完成 */
var loaderCode = [
  'try {',
  '  var __rrRuntime = require("' + reactRefreshRuntimePath.replace(/\\/g, '\\\\') + '");',
  '  var __rrGlobal = typeof window !== "undefined" ? window : globalThis;',
  '  if (!__rrGlobal.__reactRefreshInjected) {',
  '    __rrRuntime.injectIntoGlobalHook(__rrGlobal);',
  '    __rrGlobal.$RefreshSig$ = function () { return function (type) { return type; }; };',
  '    __rrGlobal.$RefreshReg$ = function () {};',
  '    __rrGlobal.__reactRefreshInjected = true;',
  '  }',
  '} catch (e) {}',
].join('\n');

/**
 * 内联 stub 版：供 rspackDllHtmlPlugin 注入 HTML 首位（DLL 模式专用）。
 * 自包含（无 require，浏览器可执行），模仿真 DevTools hook：inject 直接写 renderers Map，
 * 使 DLL react-dom 顶层注册（injectIntoDevTools）能完成；设置 __rrNeedsEnhance 标志，
 * 业务侧首个 refresh 包装模块执行时由增强 loader 回扫 renderers 补登记 helpers。
 * 真 DevTools 已安装时不覆盖（避免破坏扩展）。
 */
var inlineStubCode = [
  '(function () {',
  '  try {',
  '    if (typeof window === "undefined") return;',
  '    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;',
  '    var renderers = new Map();',
  '    var nextID = 0;',
  '    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {',
  '      renderers: renderers,',
  '      supportsFiber: true,',
  '      inject: function (internals) {',
  '        var id = nextID++;',
  '        renderers.set(id, internals);',
  '        return id;',
  '      },',
  '      onScheduleFiberRoot: function () {},',
  '      onCommitFiberRoot: function () {},',
  '      onCommitFiberUnmount: function () {}',
  '    };',
  '    window.__rrNeedsEnhance = true;',
  '  } catch (e) {}',
  '})();',
].join('\n');

module.exports = {
  runtimePath: reactRefreshRuntimePath,
  loaderCode: loaderCode,
  inlineStubCode: inlineStubCode,
};
