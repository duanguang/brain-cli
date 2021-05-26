import React from 'react';
import ReactDOM from 'react-dom';
// import { Input,Row, Col } from 'antd';
import Test from './component/Test';
import NProgress from './component/nprogress';
console.log(NProgress);
/* const NProgress = require('./component/nprogress') */
/* import App from './component/app'; */
/*import HomeManage from './component/home';
import { Example } from './component/stateHooks'; */
import HomeManage from './component/home';
// webpack Hot Module Replacement API
ReactDOM.render(<HomeManage />, document.getElementById('app'));
// Hot Module Replacement API
/* if (module.hot&&process.env.NODE_ENV==='dev') {
  console.log(module.hot,process.env.NODE_ENV)
  module.hot.accept();
} */
