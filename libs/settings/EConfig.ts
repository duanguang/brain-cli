import * as path from 'path';
import {PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE} from '../constants/constants';
import * as invariant from 'invariant';
import {requireBabelify} from '../utils/requireBabelify';

const deepAssign = require('deep-assign');
const defaultEConfig = require(path.resolve(__dirname, `../../${PROJECT_USER_CONFIG_FILE}`));

/**
 * 可选配置列表, 优先级从低到高由左到右
 */
export const configFileList = [PROJECT_USER_CONFIG_FILE, PROJECT_USER_CONFIG_IGNORE_FILE];
 interface ICommonsChunkPlugin{
     name:string,
     value:Array<string>
 }
 
 interface ICssModules{
    enable:boolean
 }
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

    public webpack: {
        dllConfig: {
            vendors: string[]
        },
        disableReactHotLoader: boolean,
        commonsChunkPlugin?:ICommonsChunkPlugin,
        disableHappyPack:boolean,//是否禁用多线程,
        cssModules:ICssModules,
        plugins?:[] //插件
    } = {
        dllConfig: {
            vendors: ['react',
            'react-dom','invariant'],
        },
        disableReactHotLoader: false,
        disableHappyPack:false,
        cssModules: {
            enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
            // config: {
            //   namingPattern: 'module', // 转换模式，取值为 global/module，下文详细说明
            //   generateScopedName: '[name]__[local]___[hash:base64:5]'
            // }
        },
        plugins:[]
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

