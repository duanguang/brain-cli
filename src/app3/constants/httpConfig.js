"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_test_config_1 = require("./http.test.config");
const http_beta_config_1 = require("./http.beta.config");
const http_dev_config_1 = require("./http.dev.config");
const http_dist_config_1 = require("./http.dist.config");
const cookie_1 = require("../../common/utils/cookie");
function getConfig() {
    if (process.env.environment === 'dist') {
        return http_dist_config_1.HttpConfigPreBeta; // 预发布环境 执行指令yarn build:dist
    }
    else if (process.env.environment === 'production') {
        return http_beta_config_1.HttpConfigBeta; // 生产环境 执行指令yarn build:prod
    }
    else if (process.env.environment === 'test') {
        return http_test_config_1.HttpConfigTest; // 测试环境 执行指令yarn build:test
    }
    else {
        return http_dev_config_1.HttpConfigDev; // 开发环境 执行指令yarn dev
    }
}
exports.HttpConfig = getConfig();
exports.setHeaders = (url, option, cookie) => {
    let cookies = cookie ? cookie : 'uctoken=MzJhYWY1MzMtNjgxZC00MmJmLWE1NzgtMzA2Yzg1MTk3OTdl';
    if (process.env.environment !== 'dev') {
        /* cookie 存储UCTOKEN为大写  需置换为小写(3pl接口使用) */
        cookies = (cookie_1.getCookie() || '').replace('UCTOKEN=', 'uctoken=');
    }
    let options = {
        'api-target': url,
        'api-cookie': cookies,
    };
    return option ? Object.assign(Object.assign({}, options), option) : options;
};
exports.getLcmSystem = () => {
    return exports.HttpConfig.domainLcm;
};
exports.getTmsSystem = () => {
    return exports.HttpConfig.domainTms;
};
/**
 * 3pl接口域名
 * 3pl接口cookie需设置为uctoken=
 */
exports.get3plSystem = () => {
    return exports.HttpConfig.domain3pl;
};
