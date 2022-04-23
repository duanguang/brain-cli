import * as path from 'path';
import {PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE} from '../constants/constants';
import * as invariant from 'invariant';
import { requireBabelify } from '../utils/requireBabelify';
//@ts-ignore
import { OptimizationOptions,ResolveOptions} from 'webpack/declarations/WebpackOptions'
const deepAssign = require('deep-assign');
const defaultEConfig = require(path.resolve(__dirname, `../../${PROJECT_USER_CONFIG_FILE}`));

/**
 * 可选配置列表, 优先级从低到高由左到右
 */
export const configFileList = [PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE];
 
export interface IDllConfigType{
    externalUrl?: string;
    value: string[];
    options?: IDllCompileOptions;
}
export interface ICustomDllType extends IDllConfigType{
    key: string;
}
export interface IDllCompileOptions{
    output?: {
        libraryTarget?: 'umd' | 'var' | 'commonjs2' | 'commonjs' | 'amd' | 'window' | 'global' | 'this',
        //当使用了 libraryTarget: "umd"，设置：true 会对 UMD 的构建过程中的 AMD 模块进行命名。否则就使用匿名的 define。
        umdNamedDefine?: boolean;
        // globalObject为改变全局指向
        globalObject?:'this'
    },
    plugins?: [];
    externalUrl?: string;
}
interface IDllConfig{
    /** 默认dll 文件 */
    vendors: string[] | IDllConfigType
    /** 自定义dll */
    customDll?: ICustomDllType[]
    compileOptions: IDllCompileOptions
}
interface extendConfig{
    isDev: boolean,
    loaderType: 'hotLoader' | 'jsLoader' | 'tsLoader' | 'styleLoader',
    transform?: {
        /** 内部css modules 默认值 */
        readonly cssModule: Object,
        /** 内部默认postcss_loader加载器参数 */
        readonly postcss_loader: Object,
       /** 内部通用生成loader use 值函数 */
       execution:(cssModule,loader,postcss_loader)=>any
    }
}
interface IHappyPack{
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
interface IWebpack{
    dllConfig: IDllConfig;

    /**
     * 是否开启热加载
     *
     * @type {boolean}
     * @memberof IWebpack
     */
    disableReactHotLoader: boolean;

    commonsChunkPlugin?:string[],

    /** 多线程配置参数 */
    happyPack?: {
        open: boolean;
        /** js 线程配置 */
        procJs?: IHappyPack;
        /** ts 线程配置 */
        procTs?: IHappyPack;
        procStyle?: IHappyPack;
    }
    /**
     * 插件信息
     *
     * @type {[]}
     * @memberof IWebpack
     */
    plugins?: [];
    output?: {
        library?: (name:string)=>string|string; 
        libraryTarget?:'var' | 'window' | 'this' | 'umd';
    };
    resolve?: ResolveOptions;

    /**
     * webpack 4 代码模块优化配置
     *
     * @type {OptimizationOptions}
     * @memberof IWebpack
     */
    optimization?: OptimizationOptions;
    /**
         * ts 处理插件
        */
    tsCompilePlugin: {
        loader: 'ts-loader',
        option?:any
    },
        /**
         *
         * 扩展loader加载器
         */
    extend?: (loaders: any[],config: extendConfig) => void;

    css?: {
        /** css modules  loader include */
        css_modules_include: string[];
        /** not css modules  loader include */
        un_css_modules_include: string[];
    };
    /** ts loader 加载器include配置  */
    tsInclude?: string[];
    /** js loader 加载器include配置 */
    jsInclude?:string[]
}
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
export default class EConfig {
    public name: string;
    public open: boolean;
    public defaultPort: number;
    public server: string;
    public imageInLineSize: number;
    public publicPath: string;
    public isTslint:boolean = true
    public devServer: {
        noInfo: boolean,
        proxy: Object,
        https?: boolean
    } & {
        [k: string]: any
    };
    public postcss: {
        autoprefixer: {
            browsers: string[]
        },
        px2rem:{}
    };

    public webpack: IWebpack = {
        dllConfig: {
            vendors: ['react','react-dom','invariant'],
            customDll:[],
            compileOptions:{},
        },
        disableReactHotLoader: false,
        commonsChunkPlugin:['common'],
        happyPack: {
            open:false,
        },
         /** 
         *  ts 处理插件 主要有'ts-loader'|'awesome-typescript-loader' 
         * 默认 'ts-loader'
        */
        tsCompilePlugin: {
            loader:'ts-loader'
        },
        plugins: [],
        resolve:{},
    };

    public babel: {
        query: {
            presets: string[],
            cacheDirectory: boolean,
            plugins: any[]
        }
    };

    public htmlWebpackPlugin: {
        title: string
    };

    public noParses: string[];

    public apps: string[];

    private static instance: EConfig;

    public static getInstance(): EConfig {
        if (!EConfig.instance) {
            EConfig.instance = new EConfig();
        }
        return EConfig.instance;
    }

    private constructor() {
        this.init();
    }

    private init() {
        let finalConfig = this.getFinalConfig();
        EConfig.validateConfig(finalConfig);
        if (finalConfig.webpack.dllConfig && finalConfig.webpack.dllConfig.vendors && !Array.isArray(finalConfig.webpack.dllConfig.vendors)) {
            delete this.webpack.dllConfig.vendors
        }
        deepAssign(this, finalConfig);
    }

    private getFinalConfig(): EConfig {
        const workingDir = process.cwd();
        return configFileList.reduce((config, current) => {
            const configPath = path.resolve(workingDir, current);
            return this.getConfig(configPath, config);
        }, defaultEConfig);
    }

    private getConfig(filePath: string, eConfig: EConfig): EConfig {
        let config = eConfig;
        try {
            const tempConfig = requireBabelify(filePath);
            config = typeof tempConfig === `function` ? tempConfig(eConfig) : tempConfig;
        } catch (e) {
            if (e.code === `MODULE_NOT_FOUND`) {
                /**
                 * nullable, skip error
                 */
            }
            else {
                throw e;
            }
        }
        return config as EConfig;
    }

    private static validateConfig(config: EConfig) {
        invariant(config.name, `请在配置文件中输入项目名称, e.g. config.name = 'test'`);
        invariant(config.apps.length, `请在至少配置一个app name作为项目入口点, e.g. config.apps = ['user']`);
    }
}

