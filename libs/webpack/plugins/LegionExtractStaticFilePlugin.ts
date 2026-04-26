import { Compiler, Compilation } from 'webpack';

/**
 * LegionExtractStaticFilePlugin
 *
 * 将模块级别的静态资源重新定位到对应的 chunk 目录下，
 * 并清理根目录下的重复资源。
 *
 * WP5 Migration:
 * - compiler.plugin() → compiler.hooks.compilation.tap()
 * - compilation.plugin('before-chunk-assets') → compilation.hooks.processAssets.tap()
 * - mainTemplate.plugin('asset-path') → Removed (MiniCssExtractPlugin handles CSS placement)
 * - compilation.plugin('emit') → merged into processAssets
 */
export default function LegionExtractStaticFilePlugin(options?: any) {
  this.options = options;
}

LegionExtractStaticFilePlugin.prototype.apply = function (compiler: Compiler) {
  compiler.hooks.compilation.tap(
    'LegionExtractStaticFilePlugin',
    (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'LegionExtractStaticFilePlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        () => {
          const chunks = [...compilation.chunks];
          if (!chunks.length) return;

          for (const module of compilation.modules) {
            if (!module.assets || !Object.keys(module.assets).length) continue;

            const moduleChunks = module.getChunks
              ? [...module.getChunks()]
              : [];
            if (!moduleChunks.length) continue;

            const assetKeys = Object.keys(module.assets);
            for (const key of assetKeys) {
              for (const chunk of moduleChunks) {
                if (chunk.name && key in compilation.assets) {
                  const newPath = `${chunk.name}/${key}`;
                  if (!(newPath in compilation.assets)) {
                    compilation.assets[newPath] = compilation.assets[key];
                  }
                }
              }
              delete compilation.assets[key];
            }
          }
        }
      );
    }
  );
};
