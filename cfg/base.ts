import * as path from 'path';
import EConfig from '../libs/settings/EConfig';
import {
  HISTORY_REWRITE_FALL_BACK_REGEX_FUNC,
  DIST,
  WORKING_DIRECTORY,
  DEV,
} from '../libs/constants/constants';
import * as webpack from 'webpack';
import htmlWebpackPlugins from '../libs/webpack/plugins/htmlWebpackPlugin';
import { isDev } from '../libs/utils/env';
import LegionExtractStaticFilePlugin from '../libs/webpack/plugins/LegionExtractStaticFilePlugin';
import { getApps } from '../libs/webpack/entries/getEntries';
import { merge } from '../libs/utils/objects';
import { getJSXLoadersed, getTsLoadersed } from '../libs/webpack/javaScriptLoader';
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const SpritesmithPlugin = require('webpack-spritesmith');
const express = require('express');
const TerserPlugin = require('terser-webpack-plugin');
const Optimization = {
  runtimeChunk: false,
  splitChunks: {
    cacheGroups: {
      common: {
        test: /[\\/]node_modules[\\/]/,
        name: 'common',
        chunks: 'initial',
        minChunks: 1,
        priority: 6,
      },
    },
  },
};
const entries = getApps();
export default function getBaseConfig({
  name,
  devServer,
  imageInLineSize,
  defaultPort,
  publicPath,
  apps,
  server,
  babel,
  webpack: webpackConfig,
  htmlWebpackPlugin,
  isTslint,
}: EConfig) {
  const __DEV__ = isDev();

  publicPath += name + '/';
  const {
    disableReactHotLoader,
    commonsChunkPlugin,
    plugins,
    output,
    css,
  } = webpackConfig;
  const NewOptimization = merge(Optimization, webpackConfig.optimization);
  const { noInfo, proxy,before,stats,
    contentBase,historyApiFallback,
    headers = {},hot,port, ...serverProps
  } = devServer;
  const webpackDevEntries = [
    /* 'react-hot-loader/patch',  */
    /*  `webpack-dev-server/client?http://localhost:${defaultPort}`,
    `webpack/hot/only-dev-server` */
    /* 'webpack/hot/dev-server' */
  ];
  function getEntries(): any[] {
    let entity = entries().reduce((prev, app) => {
      prev[app] = `./src/${app}/index`;
      return prev;
    }, {} as any);
    let chunk = {};
    /* chunk[CommonsChunkPlugin.name] = CommonsChunkPlugin.value; */
    entity = Object.assign(entity, chunk);
    return entity;
  }
  function getCssLoaders(css:EConfig['webpack']['css']) {
    const CSS_MODULE_QUERY = `?modules&importLoaders=1&localIdentName=[local]-[hash:base64:6]`;
    const CSS_MODULE_OPTION = {
      modules: {
        localIdentName: `[local]-[hash:base64:6]`,
      },
      importLoaders: 1,
    };
    let browsers = EConfig.getInstance().postcss.autoprefixer.browsers;
    let px2rem = EConfig.getInstance().postcss.px2rem;
    const postcss_loader = {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [require('autoprefixer')({ overrideBrowserslist: browsers })],
        },
      },
    };
    if (px2rem&&Object.getOwnPropertyNames(px2rem).length) {
      postcss_loader.options.postcssOptions.plugins.push(require('postcss-plugin-px2rem')(px2rem));
    }
    function generateLoaders(
      cssModule?: {
        modules: object,
        importLoaders: number,
      },
      loader?: string | { loader: string; options: any },
      loaderOptions?
    ) {
      let style: any = [
        { loader: 'css-loader', options: { importLoaders: 1 } },
      ];
      if (cssModule) {
        style[0] = Object.assign(style[0], { options: cssModule });
      }
      if (loader) {
        style.push(loader);
      }
      if (loaderOptions) {
        style.push(loaderOptions);
      }
      if (__DEV__) {
        let styles = ['style-loader', ...style];
        return styles;
      }
      // WP5: 使用 MiniCssExtractPlugin 替代 ExtractTextPlugin
      return [MiniCssExtractPlugin.loader, ...style];
    }
    if (!__DEV__) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: '[name]/styles/[name].[contenthash:8].bundle.css',
          chunkFilename: 'common/styles/[name].[contenthash:8].bundle.css',
        })
      );
      // WP5: 使用 CssMinimizerWebpackPlugin 替代 OptimizeCssAssetsPlugin
      config.optimization.minimizer = [
        ...(config.optimization.minimizer || []),
        new CssMinimizerWebpackPlugin(),
      ];
    }
    const loaders = [
      {
        test: /\.less/,
        use: generateLoaders(null, {
          loader: 'less-loader',
          options: { lessOptions: { javascriptEnabled: true } },
        }),
        include: [path.resolve(nodeModulesPath, 'antd'),/antd/],
      },
      {
        test: new RegExp(`^(?!.*\\.modules).*\\.css`),
        use: generateLoaders(null, null, postcss_loader),
        include:  [path.join(process.cwd(), './src')].concat(css?.loader_include||[]),
      },
      {
        test: new RegExp(`^(.*\\.modules).*\\.css`),
        use: generateLoaders(CSS_MODULE_OPTION, null, postcss_loader),
        include:  [path.join(process.cwd(), './src')].concat(css?.loader_include||[]),
      },
      {
        test: new RegExp(`^(?!.*\\.modules).*\\.less`),
        use: generateLoaders(
          null,
          postcss_loader,
          { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true } } },
        ),
        include:  [path.join(process.cwd(), './src')].concat(css?.loader_include||[]),
      },
      {
        test: new RegExp(`^(.*\\.modules).*\\.less`),
        use: generateLoaders(
          CSS_MODULE_OPTION,
          postcss_loader,
          { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true } } },
        ),
        include:  [path.join(process.cwd(), './src')].concat(css?.loader_include||[]),
      },
    ];
    if (webpackConfig.extend && typeof webpackConfig.extend === 'function') {
      webpackConfig.extend &&
        webpackConfig.extend(loaders, {
          isDev: __DEV__,
          type: 'style_loader',
          transform: {
            cssModule: CSS_MODULE_OPTION,
            postcss_loader: postcss_loader,
            execution: generateLoaders,
          },
        });
    }
    return loaders;
  }
  // WP5: 原生支持 JSON，无需 json-loader
  function getJsonLoaders() {
    return [];
  }
  // WP5: 使用 Asset Modules 替代 file-loader/url-loader
  function getImageLoaders() {
    if (__DEV__) {
      return [
        {
          test: /\.(png|jpe?g|gif)$/,
          type: 'asset/resource' as const,
          generator: {
            emit: false,
          },
        },
      ];
    }
    return [
      {
        test: /\.(png|jpe?g|gif)$/,
        type: 'asset' as const,
        parser: {
          dataUrlCondition: {
            maxSize: imageInLineSize,
          },
        },
        generator: {
          filename: 'common/images/[hash:8].[name].[ext]',
        },
      },
    ];
  }

  // WP5: 使用 Asset modules 替代 url-loader
  function getFontLoaders() {
    return [
      {
        test: /\.(woff|woff2|svg|eot|ttf)$/,
        type: 'asset' as const,
        parser: {
          dataUrlCondition: {
            maxSize: imageInLineSize,
          },
        },
        generator: {
          filename: 'fonts/[hash:8].[name].[ext]',
        },
      },
    ];
  }
  // WP5: 使用 Asset modules 替代 file-loader
  function getFileResourcesLoaders() {
    return [
      {
        test: /\.(mp4|ogg)$/,
        type: 'asset/resource' as const,
        generator: {
          filename: 'others/[name].[ext]',
        },
      },
    ];
  }
  // WP5: 使用 Asset modules 替代 raw-loader
  function getTemplateJspLoaders() {
    return [
      {
        test: /\.jsp$/,
        type: 'asset/source' as const,
        exclude: [nodeModulesPath],
      },
    ];
  }
  function getTslintLoaders() {
    if (isTslint) {
      return [
        {
          test: /\.ts|tsx$/,
          exclude: /node_modules/,
          enforce: 'pre',
          loader: 'tslint-loader',
        },
      ];
    }
    return [];
  }
  function getHtmlWebpackPlugins() {
    if (__DEV__) {
      return htmlWebpackPlugins(null, entries);
    } else {
      return htmlWebpackPlugins(null, entries);
    }
  }
  const templateFunction = function (data) {
    const shared = '.w-icon { background-image: url(I); }'.replace(
      'I',
      data.sprites.length ? data.sprites[0].image : ''
    );
    const perSprite = data.sprites
      .map(function (sprite: any) {
        return '.w-icon-N { width: SWpx; height: SHpx; }\n.w-icon-N .w-icon, .w-icon-N.w-icon { width: Wpx; height: Hpx; background-position: Xpx Ypx; margin-top: -SHpx; margin-left: -SWpx; } '
          .replace(/N/g,sprite.name)
          //@ts-ignore
          .replace(/SW/g, sprite.width / 2)
           //@ts-ignore
          .replace(/SH/g, sprite.height / 2)
          .replace(/W/g, sprite.width)
          .replace(/H/g, sprite.height)
          .replace(/X/g, sprite.offset_x)
          .replace(/Y/g, sprite.offset_y);
      })
      .join('\n');

    return shared + '\n' + perSprite;
  };
  const SpritesmithPlugins = apps.map(item => {
    return new SpritesmithPlugin({
      src: {
        cwd: path.resolve(process.cwd(), `./src/${item}/assets/images/icons/`),
        glob: '**/*.png',
      },
      target: {
        image: path.resolve(
          process.cwd(),
          `./src/${item}/assets/css/sprites-generated.png`
        ),
        css: [
          [
            path.resolve(
              process.cwd(),
              `./src/${item}/assets/css/sprites-generated.css`
            ),
            {
              format: 'function_based_template',
            },
          ],
        ],
      },
      customTemplates: {
        function_based_template: templateFunction,
      },
      apiOptions: {
        cssImageRef: './sprites-generated.png',
      },
      spritesmithOptions: {
        padding: 4,
      },
    });
  });
  const library = {};
  if (output && typeof output === 'object' && !Array.isArray(output)) {
    const libraryArrylist = ['library','libraryTarget'];
    libraryArrylist.map((item) => {
      if (output.hasOwnProperty(item)) {
        if (typeof output[item] === 'string') {
          library[item] = output[item];
        }
        else if (typeof output[item] === 'function') {
          library[item] = output[item](name);
        }
      }
    })
  }
  const config: any = {
    entry: getEntries(),
    // WP5: 文件系统缓存，替代 DLL 解决内存增长问题
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(process.cwd(), '.webpack_cache'),
    },
    output: {
      ...library,
      // WP5: chunkLoadingGlobal 替代 jsonpFunction
      chunkLoadingGlobal: process.env.webpackJsonp || 'webpackJsonpName',
      path: path.join(process.cwd(), `${DIST}`),
      filename: __DEV__
        ? `[name]/js/[name].js`
        : `[name]/js/[name].[chunkhash:5].bundle.js`,
      chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js',
      publicPath: __DEV__ ? publicPath : process.env.cdnRelease || '../',
      // WP5: 使用更快的 hash 算法
      hashFunction: 'xxhash64',
    },
    devtool: __DEV__ && 'cheap-module-source-map',
    resolve: {
      ...webpackConfig.resolve,
      extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'],
      modules: [
        'src',
        'node_modules',
        path.join(process.cwd(), `src`),
        path.join(process.cwd(), `node_modules`),
      ],
    },
    mode: isDev() ? 'development' : 'production',
    optimization: NewOptimization,
    plugins: [
      ...getHtmlWebpackPlugins(),
      ...SpritesmithPlugins,
      ...plugins,
      // WP5: 移除 HappyPack，使用原生并行处理
      ...(isDev()
        ? []
        : [
            new TerserPlugin({
              parallel: true,
              extractComments: false,
              terserOptions: {
                compress: {
                  drop_debugger: true,
                  drop_console: true,
                },
              },
            }),
          ]),
      // WP5: mode 自动设置 process.env.NODE_ENV，不再需要 DefinePlugin 手动定义
      new webpack.DefinePlugin({
        'process.env.environment': '"' + process.env.environment + '"',
        'process.env.apps': '"' + process.env.apps + '"',
        'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
        'process.env.cdnRelease': '"' + process.env.cdnRelease + '"',
      }),
    ],
  };
  if (__DEV__) {
    config.devServer = {
      ...serverProps,
      static: {
        directory: path.resolve(process.cwd(), WORKING_DIRECTORY),
      },
      // WP5: publicPath 移到 devMiddleware
      devMiddleware: {
        publicPath: publicPath,
        stats: 'errors-only',
      },
      historyApiFallback: {
        rewrites: apps.map((app: string) => ({
          from: HISTORY_REWRITE_FALL_BACK_REGEX_FUNC(app),
          to: `${publicPath}/${app}/index.html`,
        })),
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        ...headers,
      },
      hot: true,
      port: defaultPort,
      proxy: proxy,
      // WP5 dev-server v4: setupMiddlewares 替代 onBeforeSetupMiddleware
      setupMiddlewares: function (middlewares, devServer) {
        if (!devServer) return middlewares;
        devServer.app.use(path.posix.join(`/static`),express.static('./static'));
        before && before(devServer.app);
        return middlewares;
      },
    };
  } else {
    if (process.env.environment === 'report') {
      config.plugins.push(
        new BundleAnalyzerPlugin()
      );
    }
    config.plugins.push(new LegionExtractStaticFilePlugin());
    // WP5: CopyWebpackPlugin v11 使用对象格式
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(process.cwd(), `static`),
            to: 'common',
            globOptions: {
              ignore: ['.*'],
            },
          },
        ],
      })
    );
  }
  config.module = {
    rules: [
      ...getJSXLoadersed(babel?.loader_include||[]),
      ...getTsLoadersed(babel?.loader_include||[]),
      ...getCssLoaders(css),
      ...getImageLoaders(),
      ...getJsonLoaders(),
      ...getFontLoaders(),
      ...getFileResourcesLoaders(),
      ...getTemplateJspLoaders(),
    ],
  };
  if (webpackConfig.extend && typeof webpackConfig.extend === 'function') {
    webpackConfig.extend &&
      webpackConfig.extend(config?.module?.rules||[], {
        isDev: __DEV__,
        type: 'module_rule',
      });
  }
  return config;
}
