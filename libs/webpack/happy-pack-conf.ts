import EConfig from '../settings/EConfig';
const {
  webpack: { happyPack },
  babel,
} = EConfig.getInstance();

/** JS编译线程插件 - WP5 已移除 HappyPack，使用原生并行处理 */
export const happyPackToJsPlugin = () => {
  return [];
};

/** TS编译线程插件 - WP5 已移除 HappyPack，使用原生并行处理 */
export const happyPackToTsPlugin = () => {
  return [];
};
