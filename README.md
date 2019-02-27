# brain-cli

## 介绍(Introduction)
在日常开发中，我们经常需要用到webpack作为打包工具，但每次新建一个项目，都需要去配置一次，虽然配置一次之后，后面都可以进行复制，
但这样还是很繁琐，首先每个人水平不一样，不可能要求所有人都非常熟悉webpack,然后在团队开发中，我们需要对配置统一。基于这些原因，
我们对webpack配置进行二次封装(js文件打包拆分，css单独打包，打包时间优化，反向代理，多入口处理等)，对外部暴露少量配置，用于满足一些特殊的要求。

## 使用
 npm install brain-cli -D 或者 yarn add brain-cli

## barin-cli 优势
- 基于最新的webpack2、react15.x.x、react-router4
- 支持多入口
- 不同入口页面css/js单独合并压缩
- 支持webpack dll
- 支持增量构建
- 静态文件加戳
- 支持反向代理
- 支持对指定入口文件进行编译，打包
- 支持多套环境配置文件切换
- 支持typescript
![alt tag](/gif/WX20170607-095219@2x.png)

## 常用命令介绍

##### 编译举例
- brain-cli build dev 运行开发模式
- brain-cli build prod 生产环境
- brain-cli build test 测试环境
- brain-cli build dist 预发布环境(一般很少用到,特殊情况可以使用)
- brain-cli build -s 构建大小分析
- brain-cli build dev --apps=app1,app2 (编译指定入口文件)
- brain-cli build prod --apps=app1,app2 (编译指定入口文件)
- brain-cli build test --apps=app1,app2 (编译指定入口文件)

#### webpack dll build
- brain-cli dll

## License
[MIT](LICENSE)





