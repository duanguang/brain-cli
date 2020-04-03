import React from 'react';
import '../assets/css/test.less'
import { hot } from 'react-hot-loader/root';
import styles from './index.modules.less'
import * as rawObjectHash from 'object-hash';

 function shortHash(val) {
    return rawObjectHash(val, {encoding: 'base64'});
}
// import 'index.css'
class Test extends React.Component{
    constructor(props) {
        super(props);
        this.getInitialState();
        console.log(process.env.webpackJsonp)
    }
    getInitialState(){//注释信息
        this.state={
            count:0
        }
    }
    handleClick(){
        // this.setState({liked: !this.state.liked});
         this.setState({count:this.state.count+1});
     }
     render(){
        return(
            <div className="bg">
                <p className={styles['test-color']}>513:::::{shortHash('513')}</p>
                <p className='test' onClick={this.handleClick.bind(this)}>
                    You  this. Click to toggle.state:{this.state.count}
                </p>
            </div>
        )
    }
}
export default hot(Test);