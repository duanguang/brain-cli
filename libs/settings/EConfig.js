"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const constants_1 = require("../constants/constants");
const invariant = require("invariant");
const requireBabelify_1 = require("../utils/requireBabelify");
const deepAssign = require('deep-assign');
const defaultEConfig = require(path.resolve(__dirname, `../../${constants_1.PROJECT_USER_CONFIG_FILE}`));
/**
 * 可选配置列表, 优先级从低到高由左到右
 */
exports.configFileList = [constants_1.PROJECT_USER_CONFIG_FILE, constants_1.PROJECT_USER_CONFIG_IGNORE_FILE];
class EConfig {
    constructor() {
        this.projectType = 'js';
        this.init();
    }
    static getInstance() {
        if (!EConfig.instance) {
            EConfig.instance = new EConfig();
        }
        return EConfig.instance;
    }
    init() {
        let finalConfig = this.getFinalConfig();
        EConfig.validateConfig(finalConfig);
        deepAssign(this, finalConfig);
    }
    getFinalConfig() {
        const workingDir = process.cwd();
        return exports.configFileList.reduce((config, current) => {
            const configPath = path.resolve(workingDir, current);
            return this.getConfig(configPath, config);
        }, defaultEConfig);
    }
    getConfig(filePath, eConfig) {
        let config = eConfig;
        try {
            const tempConfig = requireBabelify_1.requireBabelify(filePath);
            config = typeof tempConfig === `function` ? tempConfig(eConfig) : tempConfig;
        }
        catch (e) {
            if (e.code === `MODULE_NOT_FOUND`) {
                /**
                 * nullable, skip error
                 */
            }
            else {
                throw e;
            }
        }
        return config;
    }
    static validateConfig(config) {
        invariant(config.name, `请在配置文件中输入项目名称, e.g. config.name = 'test'`);
        invariant(config.apps.length, `请在至少配置一个app name作为项目入口点, e.g. config.apps = ['user']`);
    }
}
exports.default = EConfig;
