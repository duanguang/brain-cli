const path = require('path');

const program = require('commander');
const chalk = require('chalk');
import programInit from './index';
import { PRODUCTION, DEV, DIST, TEST, REPORT } from '../constants/constants';
import { log } from '../utils/logs';
import webpackDllCompiler from '../webpack/webpackDllCompiler';
export class Command {
  program: any;
  commands = ['build', 'start', 'dev', 'dll'];
  env = {
    dev: '开发环境',
    dist: '预发布环境',
    prod: '生产环境',
    test: '测试环境'
  };
  constructor() {
    this.program = program;
  }
  setProcessEnv(env: string) {
    if (env === 'dev') {
      process.env.environment = DEV;
      process.env.NODE_ENV = DEV;
    } else if (env === 'dist') {
      process.env.environment = DIST;
      process.env.NODE_ENV = PRODUCTION;
    } else if (env === 'prod') {
      process.env.environment = PRODUCTION;
      process.env.NODE_ENV = PRODUCTION;
    } else if (env === 'test') {
      process.env.environment = TEST;
      process.env.NODE_ENV = PRODUCTION;
    } else if (env === 'report') {
      process.env.environment = REPORT;
      process.env.NODE_ENV = PRODUCTION;
    } else {
      process.env.environment = env;
      process.env.NODE_ENV = PRODUCTION;
    }
  }
  version() {
    const pkg = require(path.resolve(__dirname, '../../package.json'));
    this.program.version(pkg.version);
  }
  option() {
    this.program
      .option('-V,--version', 'output the version number')
      .description(`${chalk.green('webpack building tool')}`);
  }
  setApps(options) {
    process.env.apps = '';
    if (options && options['apps']) {
      if (typeof options['apps'] !== 'boolean') {
        // warning(`打包范围为[全部app]...`);
        process.env.apps = options['apps'];
      }
    }
  }
  dev() {
    this.program
      .command('dev')
      .option('--apps [value]','webpack Build a specified app name')
      .option(
        '--smp [value]',
        'Whether to enable  Compile time statistics module'
      )
      .description('start webpack dev server for develoment mode')
      .action(options => {
        let env = 'dev';
        this.setProcessEnv(env);
        this.setApps(options);
        log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
        programInit(env,{smp:options['smp']});
      });
  }
  start() {
    this.program
      .command('start')
      .option('--apps [value]', 'webpack Build a specified app name')
      .description('start webpack dev server for develoment mode')
      .action(options => {
        let env = 'dev';
        this.setProcessEnv(env);
        this.setApps(options);
        log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
        programInit(env);
      });
  }
  dll() {
    this.program
      .command('dll')
      .description('webpack dll build')
      .action(async env => {
        /**
         * 按需创建编译webpack dll manifest文件
         */
        await webpackDllCompiler();
      });
  }
  build() {
    this.program
      .command('build [env]')
      .option(
        '-s',
        'webpack build size analyzer tool, support size: default analyzer'
      )
      .option('--apps [value]', 'webpack Build a specified app name')
      .option('--apps [value]', 'webpack Build a specified app name')
      .option(
        '--webpackJsonp [value]',
        'webpack Generate a specified webpackJsonp name'
      )
      .option(
        '--cdn [value]',
        'The resource distribution server'
      )
      .option(
        '--smp [value]',
        'Whether to enable  Compile time statistics module'
      )
      .description('webpack building')
      .action((env = 'prod', options) => {
        this.setProcessEnv(options.S ? 'report' : env);
        this.setApps(options);
        process.env.webpackJsonp = options['webpackJsonp']
          ? options['webpackJsonp']
          : 'webpackJsonpName';
        
        process.env.cdnRelease = options['cdn']
        ? options['cdn']
          : '';
        log(
          `当前编译环境为: ${process.env.NODE_ENV} [${this.env[env] || env}]`
        );
        programInit(process.env.NODE_ENV,options);
      });
  }
  command() {
    this.commands.forEach(cmd => {
      if (this[cmd]) {
        this[cmd].apply(this);
      } else {
        console.log(chalk.red(`The command [${cmd}] is not implemented!`));
      }
    });
  }

  parse() {
    this.program.parse(process.argv);
  }
  run() {
    this.version();
    this.option();
    this.command();
    this.parse();
  }
}
