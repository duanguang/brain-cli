const path = require('path');

const program = require('commander');
const chalk = require('chalk'); 
import programInit from './index';
import {PRODUCTION, DEV,DIST, TEST,REPORT} from '../constants/constants';
import { log } from '../utils/logs';
export class Command{
    program:any;
    commands = ['build','start','dev'];
    env={'dev':'开发环境','dist':'预发布环境','prod':'生产环境','test':'测试环境'}
    constructor(){
        this.program=program;
        
    }
    setProcessEnv(env:string){
        if(env==='dev'){
            process.env.environment=DEV;
            process.env.NODE_ENV=DEV;
        }
        else if(env==='dist'){
            process.env.environment=DIST;
            process.env.NODE_ENV=PRODUCTION;
        }
        else if(env==='prod'){
            process.env.environment=PRODUCTION;
            process.env.NODE_ENV=PRODUCTION;
        }
        else if(env==='test'){
            process.env.environment=TEST;
            process.env.NODE_ENV=PRODUCTION;
        }
        else if(env==='report'){
            process.env.environment=REPORT;
            process.env.NODE_ENV=PRODUCTION;
        }
    }
    version() {
        const pkg = require(path.resolve(__dirname, '../../package.json'));      
        this.program.version(pkg.version);
    }
    option(){
        this.program
        .option('-V,--version','output the version number')
    }
    dev() {
        this.program
          .command('dev')
          .description('start webpack dev server for develoment mode')
          .action((options) => {
            let env='dev';
            this.setProcessEnv(env);
            log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
            programInit(env);
          });
    }
    start() {
        this.program
          .command('start')
          .description('start webpack dev server for develoment mode')
          .action(options => {
            let env='dev';
            this.setProcessEnv(env);
            log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
            programInit(env);
          });
    }
    build() {
        this.program
          .command('build [env]')
          .option('-s', 'webpack build size analyzer tool, support size: default analyzer')
          .description('webpack building')
          .action((env = 'prod', options) => {
             if(options.S){
                this.setProcessEnv('report');
             }else{
                this.setProcessEnv(env);
             }
             log(`当前编译环境为: ${process.env.NODE_ENV} [${this.env[env]}]`);
             programInit(env);
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