/*
 * @Author: wss 
 * @Date: 2019-05-04 00:08:34 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-04 00:08:57
 */


const { ccclass, property } = cc._decorator;

/**
 * 弹簧，弹性动画效果
 */
@ccclass
export default class BhvSpring extends cc.Component {

    // Spring drawing constants for top bar
    minHeight = 100; //最下压缩高度
    maxHeight = 200; //极限膨胀高度

    // 弹性模拟参数
    @property
    mass = 0.8;  // Mass

    @property
    springConstant = 0.2;  // Spring constant

    @property
    damping = 0.92; // Damping

    @property
    restPos = 200;  // Rest position

    // Spring simulation variables（变量）
    _position = 200;   // Position
    _velocity = 0.0; // Velocity
    _acceleration = 0;   // Acceleration
    _force = 0;    // Force

    move:boolean = false;

    onLoad(){
        this._position =  100;
    }
    
    damp(speed:number = 1){
        this._velocity = speed;
    }

    onEventDamp(e,data:string = '0'){
        this._velocity = parseFloat(data);
    }

    //自动刷新弹簧状态
    update() {
        if(!this.move){
            this._force = -this.springConstant * (this._position - this.restPos); // f=-ky
            this._acceleration = this._force / this.mass;          // Set the acceleration, f=ma == a=f/m
            this._velocity = this.damping * (this._velocity + this._acceleration);  // Set the velocity
            this._position = this._position + this._velocity;        // Updated position
            this.node.width = this._position;
        }

        if (Math.abs(this._velocity) < 0.1) {
            this._velocity = 0.0;
        }

        if (this.move) {
            // this._position =  this.mouseY -  this.springHeight / 2;
            // if(this._position<this.minHeight)this._position = this.minHeight;
            // if(this._position>this.maxHeight)this._position = this.maxHeight;

          }

          this.drawSpring();


    }

     drawSpring() {
        // Draw base
     
        let baseWidth = 0.5 * this._position + -8;
        //rect(, , width / 2 + baseWidth, height);
        this.node.width =  baseWidth;
        this.node.height = this._position;
            
        //rect(left, ps, right, ps + springHeight);
      }


}
