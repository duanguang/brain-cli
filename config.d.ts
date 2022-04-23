import WebpackDevServer from "webpack-dev-server";
import { OptimizationOptions,ResolveOptions } from "webpack/declarations/WebpackOptions"
export interface IDllConfigType {

}
export namespace eWebpackConfig {
    interface dllConfigType {
        /** 当设置了此值，则 index.html dll 文件 url 变成外部链接 */
        externalUrl?: string;
        /** 需要打包到 dll 文件的库 */
        value: string[];
        options?: dllCompileOptions;
    }
    interface customDllType extends dllConfigType {
        /** dll 文件名称 */
        key: string;
    }
    interface dllCompileOptions {
        output?: {
            libraryTarget?: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this',
            //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
            umdNamedDefine?: boolean;
            // globalObject为改变全局指向
            globalObject?: 'this'
        },
        plugins?: [];
        /** 当设置了此值，则 index.html dll 文件 url 变成外部链接 */
        externalUrl?: string;
    }
    interface dllConfig {
        /** 默认dll 文件，需要打到dll 文件的JS库 */
        vendors: string[] | dllConfigType
        /** 自定义dll */
        customDll?: customDllType[]
        /** 全局生效配置
         * 
         * 当在 dllConfig,配置了该参数，即可生效到所有 dll 文件，等同于配置了 options 参数，当 dll 文件指定了自身局部配置数据，则生效局部数据
         */
        compileOptions: dllCompileOptions
    }
    interface extendConfig {
        isDev: boolean,
        /** 加载器类型 */
        type: 'hot_loader' | 'js_loader' | 'ts_loader' | 'style_loader'|'module_rule',
        transform?: {
            /** 内部css modules 默认值 */
            readonly cssModule: Object,
            /** 内部默认postcss_loader加载器参数 */
            readonly postcss_loader: Object,
            /** 内部通用生成loader use 值函数 */
            execution: (cssModule,loader,postcss_loader) => any
        }
    }
    interface happyPack {
        /** 代表开启几个子进程去处理这一类型的文件，默认是3个，类型必须是整数。 */
        threads?: Number;
        /** 是否允许 HappyPack 输出日志，默认是 true。 */
        verbose?: Boolean;
        /** 代表共享进程池，即多个 HappyPack 实例都使用同一个共享进程池中的子进程去处理任务，以防止资源占用过多。 */
        threadPool?: any;
        /** 开启webpack --profile ,仍然希望HappyPack产生输出。 */
        verboseWhenProfiling?: boolean;
        /** 启用debug 用于故障排查。默认 false。 */
        debug?: boolean;
    }
    export interface config {
        dllConfig: dllConfig
        /*** 是否禁用热加载 */
        disableReactHotLoader: boolean;
        /** 默认值common 正常情况下，无需关注，主要会把node_modules下文件打到此模块 */
        commonsChunkPlugin?: string[];

        /** 多线程配置参数 */
        happyPack?: {
            open: boolean;
            /** js 线程配置 */
            procJs?: happyPack;
            /** ts 线程配置 */
            procTs?: happyPack;
            procStyle?: happyPack;
        }
        /** * 插件信息 */
        plugins?: ResolveOptions['plugins'];
        output?: {
            library?: (name: string) => string | string;
            libraryTarget?: 'var' | 'window' | 'this' | 'umd';
        };
        resolve?: ResolveOptions;
        /**
         * webpack 4 代码模块优化配置
         */
        optimization?: OptimizationOptions;
        /**
        * ts 处理插件
       */
        tsCompilePlugin: {
            loader: 'ts-loader',
            /** https://github.com/TypeStrong/ts-loader#loader-options */
            option?: any
        },
        /**
         *
         * 扩展loader加载器
         * 
         * 如果config.type ==='module_rule' 则loader 参数值指向module.rule 数组加载器
         */
        extend?: (loaders: any[],config: extendConfig) => void;
        css?: {
            /**  loader include */
            loader_include: string[];
        };
    }
}
export declare class config {
    /** 应用名称，通常使用package.json.name */
    name: string;
    /** 浏览器中自动打开启动服务页面,默认true */
    open: boolean;
    /** 服务启动默认端口号，默认8001 */
    defaultPort: number;
    /** 服务地址,在需要填入域名或者提供外部访问时填写，默认0.0.0.0 */
    server: string;
    /** 图片文件限制大小，小于此值时图片会被处理成base64,默认8192 */
    imageInLineSize: number;
    /** 是否启用tslint，默认true */
    isTslint: boolean;
    /** devServer.publicPath,默认 /public/*/
    publicPath: string;
    /** 开发服务拓展配置 */
    devServer: WebpackDevServer.Configuration;

    postcss?: {
        /** 参考postcss-loade 插件配置 */
        autoprefixer: any;
        /** postcss-plugin-px2rem 插件配置 */
        px2rem: any;
    }
    webpack: eWebpackConfig.config;
    htmlWebpackPlugin: {
        /** 页面标题 */
        title: string
    };
    /** babel 插件配置，直接谷歌查询babel.query 文档 */
    babel: {
        /** 直接谷歌查询babel.query 文档 */
        query: any;
        /** js ts loader 加载器 include会注入到ts loader 及js loader */
        loader_include:string[]
    };
    /** 在编译运行时指定需要的模块入口 */
    apps: string[]
}
export declare function eConfig(params: config): config
export { };