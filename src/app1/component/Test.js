import React from 'react';
import '../assets/css/test.less'
// import 'index.css'
export default class Test extends React.Component{
    constructor(props) {
        super(props);
        this.getInitialState();
    }
    getInitialState(){//注释信息
        this.state={
            count:0
        }
    }
    handleClick(){
        // this.setState({liked: !this.state.liked});
         this.setState({count:this.state.count+1});
         console.log(this)
     }
     render(){
        return(
            <div className="bg">2111322
                <p className='test' onClick={this.handleClick.bind(this)}>
                    You  this. Click to toggle.state:{this.state.count}
                </p>
            </div>
        )
    }
}