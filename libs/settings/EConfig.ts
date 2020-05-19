import * as path from 'path';
import {PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE} from '../constants/constants';
import * as invariant from 'invariant';
import {requireBabelify} from '../utils/requireBabelify';
import { OptimizationOptions} from 'webpack/declarations/WebpackOptions'
const deepAssign = require('deep-assign');
const defaultEConfig = require(path.resolve(__dirname, `../../${PROJECT_USER_CONFIG_FILE}`));

/**
 * 可选配置列表, 优先级从低到高由左到右
 */
export const configFileList = [PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE];
 
 interface ICssModules{
    enable:boolean
}
interface IDllConfig{
    vendors: string[] | { cdn?: string;FrameList:string[]}
}
interface extendConfig{
    isDev: boolean,
    loaderType: 'HotLoader' | 'JsLoader' | 'TsLoader' | 'StyleLoader',
    projectType: 'ts' | 'js',
    transform?: {
       readonly cssModule: Object,
       readonly LoaderOptions: Object,
       execution:(cssModule,loader,LoaderOptions)=>any
    }
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
    /**
     * 是否禁用多线程
     *
     * @type {boolean}
     * @memberof IWebpack
     */
    disableHappyPack: boolean;

    cssModules: ICssModules;

    /**
     * 插件信息
     *
     * @type {[]}
     * @memberof IWebpack
     */
    plugins?: [];
    output?: {
        libraryTarget?: 'var' | 'window' | 'this' | 'umd'
    };

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
    extend?: (loaders: any[],config: extendConfig) => void,
    
    cssLoaders: {

        /**
         * 
         * 样式处理包含文件夹
         * @type {string[]}
         */
        include: string[],

        /**
         * 排除文件夹信息
         *
         * @type {string[]}
         */
        exclude: string[],
        
    }
}
const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
export default class EConfig {
    public name: string;
    public open: boolean;
    public defaultPort: number;
    public server: string;
    public imageInLineSize: number;
    public publicPath: string;
    public projectType :string='js';
    public isTslint:boolean = true
    public devServer: {
        noInfo: boolean,
        proxy: Object
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
        },
        disableReactHotLoader: false,
        commonsChunkPlugin:['common'],
        disableHappyPack:false,
        cssModules: {
            enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
            // config: {
            //   namingPattern: 'module', // 转换模式，取值为 global/module，下文详细说明
            //   generateScopedName: '[name]__[local]___[hash:base64:5]'
            // }
        },
         /** 
         *  ts 处理插件 主要有'ts-loader'|'awesome-typescript-loader' 
         * 默认 'ts-loader'
        */
        tsCompilePlugin: {
            loader:'ts-loader'
        },
        plugins: [],
        cssLoaders: {
            exclude:[nodeModulesPath],
            include:[path.join(process.cwd(), './src')]
        },
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

