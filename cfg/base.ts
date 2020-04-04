import * as path from 'path';
import EConfig from '../libs/settings/EConfig';
import {
  HISTORY_REWRITE_FALL_BACK_REGEX_FUNC,
  DIST,
  WORKING_DIRECTORY,
  DEV
} from '../libs/constants/constants';
import * as webpack from 'webpack';
import htmlWebpackPlugins from '../libs/webpack/plugins/htmlWebpackPlugin';
import { warning, log } from '../libs/utils/logs';
import * as invariant from 'invariant';
import { isDev } from '../libs/utils/env';
import LegionExtractStaticFilePlugin from '../libs/webpack/plugins/LegionExtractStaticFilePlugin';
import { getApps } from '../libs/webpack/entries/getEntries';
import { merge } from '../libs/utils/objects';
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
/* const ExtractTextPlugin = require('extract-text-webpack-plugin'); */
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const SpritesmithPlugin = require('webpack-spritesmith');
const express = require('express');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const Optimization = {
  runtimeChunk: false,
  splitChunks: {
      cacheGroups: {
        common: {
        test: /[\\/]node_modules[\\/]/,
              name: 'common',
              chunks: "initial",
              minChunks: 1,
              priority: 6  
          },
      }
  },
  minimizer:isDev()?[]: [
    new UglifyJSPlugin({
      parallel: true,
      uglifyOptions: {
        compress: {
          drop_debugger: true,
          drop_console: true
        }
      },
    }),
  ],
}
// const ProgressBarPlugin = require('progress-bar-webpack-plugin');
// const chalk = require('chalk');
const HappyPack = require('happypack'),
  os = require('os'),
  happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
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
  projectType,
  isTslint
}: EConfig) {
  const __DEV__ = isDev();

  publicPath += name + '/';
  const {
    disableReactHotLoader,
    commonsChunkPlugin,
    cssModules,
    plugins
  } = webpackConfig;
  const NewOptimization = merge(Optimization,webpackConfig.optimization)
  const DisableReactHotLoader = disableReactHotLoader || false; //默认启用热加载
  let CommonsChunkPlugin = { name: 'common', value: ['invariant'] };
  if (
    commonsChunkPlugin &&
    commonsChunkPlugin instanceof Array &&
    commonsChunkPlugin.length > 0
  ) {
    CommonsChunkPlugin.value = [
      ...new Set(commonsChunkPlugin.concat(['common']))
    ];
  }
  const { noInfo, proxy } = devServer;
  const webpackDevEntries = [
    /* 'react-hot-loader/patch',  */
   /*  `webpack-dev-server/client?http://localhost:${defaultPort}`,
    `webpack/hot/only-dev-server` */
    /* 'webpack/hot/dev-server' */
  ];
  function getEntries(): any[] {
    let entity = entries().reduce(
      (prev, app) => {
        // prev={
        //     'common/core':__DEV__?['react']:[
        //         'react','mobx-react','mobx','babel-polyfill','superagent',
        //         'react-router-dom','classnames','isomorphic-fetch',
        //         'react-dom','history','invariant','warning','hoist-non-react-statics'
        //     ]
        // }
        
        prev[app]=`./src/${app}/index`
        // prev[app] = [
        //     'babel-polyfill',
        //     `./src/${app}/index`
        // ];

        return prev;
      },
      {} as any
    );
    let chunk = {};
    /* chunk[CommonsChunkPlugin.name] = CommonsChunkPlugin.value; */
    entity = Object.assign(entity, chunk);
    return entity;
  }
  function getCssLoaders() {
    const CSS_MODULE_QUERY = `?modules&importLoaders=1&localIdentName=[local]-[hash:base64:6]`;
    const CSS_MODULE_OPTION = {
      modules: true,
      importLoaders: 1,
      localIdentName: `[local]-[hash:base64:6]`
    };
    let browsers = EConfig.getInstance().postcss.autoprefixer.browsers;
    let px2rem = EConfig.getInstance().postcss.px2rem;
    const postcss_loader = {
      loader: 'postcss-loader',
      options: {
        ident: 'postcss',
        plugins: [require('autoprefixer')({ browsers: browsers })]
      }
    };
    if (px2rem) {
      postcss_loader.options.plugins.push(require('px2rem')(px2rem));
    }
    function generateLoaders(cssModule?, loader?: string, loaderOptions?) {
      let style: any = [{ loader: 'css-loader' ,options: { importLoaders: 1 } }];
      if (cssModule && cssModules.enable) {
        style[0] = Object.assign(style[0],{ options: cssModule });
      }
      if (loader) {
          style.push(loader);
      }
      if (loaderOptions) {
        style.push(loaderOptions);
      }
      let styles = [{
              loader: MiniCssExtractPlugin.loader,options: {
              hmr:__DEV__?true:false,
          }}, ...style];
      return styles;
    }
    config.plugins.push(
      new MiniCssExtractPlugin({	
        filename:__DEV__? '[name]/styles/[name].bundle.css':'[name]/styles/[name].[contenthash:8].bundle.css'    // [name] 占位符，为 entry 入口属性，默认 main
      })
    );
    if (!__DEV__) {
      // ExtractTextPlugin.extract = f => `style-loader!` + f;
      config.plugins.push(
        new OptimizeCssAssetsPlugin({
          assetNameRegExp: /\.optimize\.css$/g,
          cssProcessor: require('cssnano'),
          cssProcessorOptions: { discardComments: { removeAll: true } },
          canPrint: true
        })
      );
    }
    return [
      {
        test: /\.css$/,
        use: generateLoaders(),
        include: [nodeModulesPath]
      },
      {
        test: /\.less/,
        use: generateLoaders(CSS_MODULE_OPTION, 'less-loader', postcss_loader),
        include: [path.resolve(nodeModulesPath, 'basics-widget')]
      },
      {
        test: /\.less/,
        use: generateLoaders(null, 'less-loader'),
        include: [path.resolve(nodeModulesPath, 'antd'),nodeModulesPath]
      },
      {
        test: new RegExp(`^(?!.*\\.modules).*\\.css`),
        use: generateLoaders(null, null, postcss_loader),
        exclude: [nodeModulesPath]
      },
      {
      /* test: /\.css$/, */
        test: new RegExp(`^(.*\\.modules).*\\.css`),
        use: generateLoaders(CSS_MODULE_OPTION, null, postcss_loader),
        exclude: [nodeModulesPath]
      },
      {
        test: new RegExp(`^(?!.*\\.modules).*\\.less`),
        use: generateLoaders(null, 'less-loader', postcss_loader),
        exclude: [nodeModulesPath]
      },
      {
      /* test: /\.less/, */
        test: new RegExp(`^(.*\\.modules).*\\.less`),
        use: generateLoaders(CSS_MODULE_OPTION, 'less-loader', postcss_loader),
        exclude: [nodeModulesPath]
      },
    ];
  }
  function getJsonLoaders() {
    return [
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ];
  }
  function getImageLoaders() {
    if (__DEV__) {
      return [
        {
          test: /\.(png|jpe?g|gif)$/,
          loaders: [`file-loader`]
        }
      ];
    }
    return [
      {
        test: /\.(png|jpe?g|gif)$/,
        //loader: `url-loader?limit=${8192}&name=${path.posix.join('common', 'images/[hash:8].[name].[ext]')}`,
        loaders: [
          `file-loader?limit=${imageInLineSize}&name=common/images/[hash:8].[name].[ext]`
          //optimizationLevel似乎没什么用
          //`image-webpack?{optipng:{optimizationLevel:7}, pngquant:{quality: "65-90", speed: 4}, mozjpeg: {quality: 65}}`
        ]
      }
    ];
  }

  function getFontLoaders() {
    return [
      {
        test: /\.(woff|woff2|svg|eot|ttf)$/,
        loader: `url-loader?limit=${imageInLineSize}&name=fonts/[hash:8].[name].[ext]`
      }
    ];
  }

  function getJSXLoaders() {
    const loaders = [];
    if (__DEV__) {
      if (!DisableReactHotLoader) {
        loaders.push({
          test: /\.(jsx|js)?$/,
          // loader: 'react-hot',
          loader: 'babel-loader',
          include: [path.join(process.cwd(), './src')],
          exclude: [nodeModulesPath], //优化构建效率
          options: {
            // This is a feature of `babel-loader` for webpack (not Babel itself).
            // It enables caching results in ./node_modules/.cache/babel-loader/
            // directory for faster rebuilds.
            cacheDirectory: true,
            plugins: ['react-hot-loader/babel'],
          },
        });
      } else {
        babel.query.plugins.push('babel-plugin-legion-hmr');
      }
    }
    loaders.push({
        test: /\.(jsx|js)?$/,
            /* loader: `babel-loader`,
            query: babel.query, */
        include: [
            path.join(process.cwd(), 'node_modules/basics-widget'),
            path.join(process.cwd(), './src')
        ],
        loader: 'happypack/loader?id=js',
        exclude: [nodeModulesPath]
    });
    if (projectType === 'ts') {
      loaders.push({
        test: /\.(ts|tsx)$/,
        include: [path.join(process.cwd(), './src')],
        /* use: [
          {
            loader: 'babel-loader',
            query: babel.query
          },
          {
            loader: require.resolve('ts-loader'),
            options: {
              // disable type checker - we will use it in fork plugin
                transpileOnly: true,
                happyPackMode: true
            }
          }
        ], */
        loader: 'happypack/loader?id=ts',
        exclude: [nodeModulesPath]
      });
    }
    return loaders;
  }

  function getFileResourcesLoaders() {
    return [
      {
        test: /\.(mp4|ogg)$/,
        loader: 'file-loader?&name=others/[name].[ext]'
      }
    ];
  }
  function getTemplateJspLoaders() {
    return [
      {
        test: /\.jsp$/,
        use: 'raw-loader',
        exclude: [nodeModulesPath]
      }
    ];
  }
  function getTslintLoaders() {
    if (isTslint) {
      return [
        {
          test: /\.ts|tsx$/,
          exclude: /node_modules/,
          enforce: 'pre',
          /* loader: 'happypack/loader?id=tslint', */
          loader: 'tslint-loader'
        }
      ];
    }
    return [];
  }
  function getHtmlWebpackPlugins() {
    if (__DEV__) {
      return htmlWebpackPlugins(null, entries);
    } else {
      // invariant(apps.length === 1, `在部署环境下仅支持单入口`);
      return htmlWebpackPlugins(null, entries);
    }
  }
  const templateFunction = function(data) {
    const shared = '.w-icon { background-image: url(I); }'.replace(
      'I',
      data.sprites.length ? data.sprites[0].image : ''
    );
    // 注意：此处默认图标使用的是二倍图
    const perSprite = data.sprites
      .map(function(sprite: any) {
        // background-size: SWpx SHpx;
        return '.w-icon-N { width: SWpx; height: SHpx; }\n.w-icon-N .w-icon, .w-icon-N.w-icon { width: Wpx; height: Hpx; background-position: Xpx Ypx; margin-top: -SHpx; margin-left: -SWpx; } '
          .replace(/N/g, sprite.name)
          .replace(/SW/g, sprite.width / 2)
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
    // 雪碧图设置
    return new SpritesmithPlugin({
      src: {
        cwd: path.resolve(process.cwd(), `./src/${item}/assets/images/icons/`), // 图标根路径
        glob: '**/*.png' // 匹配任意 png 图标
      },
      target: {
        image: path.resolve(process.cwd(), `./src/${item}/assets/css/sprites-generated.png`
        ), // 生成雪碧图目标路径与名称
        // 设置生成CSS背景及其定位的文件或方式
        css: [
          [
            path.resolve(process.cwd(),`./src/${item}/assets/css/sprites-generated.css`),
            {
              format: 'function_based_template'
            }
          ]
        ]
        // css: path.resolve(__dirname, '../src/assets/spritesmith-generated/sprite.less')
      },
      customTemplates: {
        function_based_template: templateFunction
      },
      apiOptions: {
        cssImageRef: './sprites-generated.png' // css文件中引用雪碧图的相对位置路径配置
      },
      spritesmithOptions: {
        padding: 4
      }
    });
  });
  const config: any = {
    entry: getEntries(),
    //port: defaultPort,
    //additionalPaths: [],
    output: {
      /**遇到问题： 对于同一个页面功能由不同的同事开发， 都用到了 webpack 以及 CommonsChunkPlugin，最后把打包出来的代码，整合到一起的时候，冲突了。
       * 问题表现：各自用 webpack 打包代码没有问题，但是加载到页面上时，代码报错且错误难以定位。
       * 解决方法：在 webpack 的配置选项里使用 output.jsonpFunction。
       * output.jsonpFunction string 仅用在输出目标为 web，且使用 jsonp 的方式按需加载代码块时。
一个命名的 JSONP 函数用于异步加载代码块或者把多个初始化代码块合并到一起时使用（如 CommonsChunkPlugin, AggressiveSplittingPlugin）。
当同一个页面上有多个 webpack 实例（源于不同的编译），需要修改这个函数名。
如果使用了 output.library 选项，那么这个 library 的命名会自动附加上。
事实上 webpack 并不在全局命名空间下运行，但是 CommonsChunkPlugin 这样的插件会使用异步 JSONP 的方法按需加载代码块。插件会注册一个全局的函数叫 window.webpackJsonp，所以同一个页面上运行多个源自不同 webpack 打包出来的代码时，可能会引起冲突。
       */
      jsonpFunction: process.env.webpackJsonp || `webpackJsonpName`,
      path: path.join(process.cwd(), `${DIST}`),
      filename:__DEV__?`[name]/js/[name].js`: `[name]/js/[name].[chunkhash:5].bundle.js`,
      chunkFilename: 'common/js/[name].[chunkhash:5].bundle.js',
      //chunkFilename:path.posix.join('common', 'js/[name]-[id].[chunkhash:5].bundle.js'),
      publicPath: __DEV__ ? publicPath : process.env.cdnRelease||'../'
    },
    devtool: __DEV__ && 'cheap-module-source-map',
    resolve: {
      alias: {},
      extensions: ['.web.js', '.js', '.json', '.ts', '.tsx', '.jsx'], //自动扩展文件后缀
      //modulesDirectories: ['src', 'node_modules', path.join(__dirname, '../node_modules')],
      modules: ['src', 'node_modules', path.join(process.cwd(), `src`),path.join(process.cwd(), `node_modules`)]
    },
    module: {
      loaders: []
    },
    mode : __DEV__? 'development' : 'production',
    optimization:NewOptimization,
    plugins: [
      ...getHtmlWebpackPlugins(),
      // 雪碧图设置
      ...SpritesmithPlugins,
      ...plugins,
      new HappyPack({
        id: 'js',
        threads:os.cpus().length-1,
        /* threadPool: happyThreadPool, */
        use: [
            {
                loader: `babel-loader`,
                query: babel.query,
            }
        ]
      }),
      new HappyPack({
            id: 'ts',
            threads:os.cpus().length-1,
            /* threadPool: happyThreadPool, */
            use: [
                {
                loader: 'babel-loader',
                query: babel.query
                },
                {
                loader: require.resolve('ts-loader'),
                options: {
                    // disable type checker - we will use it in fork plugin
                    transpileOnly: true,
                    happyPackMode: true
                }
                }
            ],
       }),
      /* new HtmlWebpackHarddiskPlugin(), */
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || DEV),
        'process.env.environment': '"' + process.env.environment + '"',
        'process.env.apps': '"' + process.env.apps + '"',
        'process.env.webpackJsonp': '"' + process.env.webpackJsonp + '"',
        'process.env.cdnRelease': '"' + process.env.cdnRelease + '"'
      })
    ]
  };
  if (__DEV__) {
    config.devServer = {
      stats: 'errors-only',
      contentBase: [`./${WORKING_DIRECTORY}/`],
      historyApiFallback: {
        rewrites: apps.map((app: string) => ({
          from: HISTORY_REWRITE_FALL_BACK_REGEX_FUNC(app),
          to: `${publicPath}/${app}/index.html`
        }))
      },
      hot: true,
      port: defaultPort,
      publicPath: publicPath,
      noInfo: noInfo,
      proxy: proxy,
      before: function(app) {
        app.use(path.posix.join(`/static`), express.static('./static')); // 代理静态资源
      }
      //progress: true,
    };
   /*  config.plugins.push(new webpack.HotModuleReplacementPlugin()) */
  } else {
    /* config.plugins.push(new webpack.NamedModulesPlugin())
    config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin()) */
    config.plugins.push(
      
     /*  new webpack.optimize.UglifyJsPlugin({
        // mangle: false,
        // 最紧凑的输出
        //beautify: false,
        compress: {
          warnings: false,
          drop_debugger: true, // 删除所有的 `console` 语句// 还可以兼容ie浏览器
          drop_console: true
        },
        comments: false // 删除所有的注释
      }) */
    );
    
    if (process.env.environment === 'report') {
      config.plugins.push(
        new BundleAnalyzerPlugin()
        // new webpack.optimize.DedupePlugin()//webpack1用于优化重复模块
      );
    }
      config.plugins.push(new LegionExtractStaticFilePlugin());
      config.plugins.push(
        new CopyWebpackPlugin([
            {
                from: path.join(process.cwd(), `static`),
                to: 'common',
                ignore: ['.*']
            }
        ])
      );     
  }
  config.module = {
    rules: [
      ...getJSXLoaders(),
      ...getCssLoaders(),
      ...getImageLoaders(),
      ...getJsonLoaders(),
      ...getFontLoaders(),
      ...getFileResourcesLoaders(),
      ...getTslintLoaders(),
      ...getTemplateJspLoaders()
    ]
    //noParse: []
  };
  return config;
}
