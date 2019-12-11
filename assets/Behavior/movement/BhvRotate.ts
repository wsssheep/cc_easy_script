/*
 * @Author: wss
 * @Date: 2019-04-10 14:32:46
 * @LastEditTime: 2019-12-09 15:00:12
 * @LastEditors: wss
 */

const {ccclass, property,menu,disallowMultiple} = cc._decorator;

const DIRECTION = cc.Enum({
    clockwise:0,
    antiClockwise:1
});

/**
 * 旋转 [v1.0.0]
 * 旋转行为会使节点自动旋转
 */
@ccclass
@menu("添加特殊行为/Movement/Rotate (自动旋转)")
@disallowMultiple
export default class BhvRotate extends cc.Component {

    @property
    activeInStart:boolean = true;

    /**旋转方向 */
    @property({
        type:DIRECTION,
        tooltip:" 旋转方向",    
    })
    direction = DIRECTION.clockwise;

    /** 旋转速度,s/px */
    @property({
        tooltip:" 旋转速度,s/px"   
    })
    speed:number = 180;

    /** 旋转最大速度,s/px,-1为不限制最大速度  */
    @property({
        tooltip:" 旋转最大速度,s/px,-1为不限制最大速度"  
    })
    speedMax:number = -1;

    /**旋转加速度*/
    @property({
        tooltip:"旋转加速度"  
    })
    accel:number = 0;

    // LIFE-CYCLE CALLBACKS:

    start () {
        this.enabled = this.activeInStart;
    }

    /**
     * 重新让节点开始旋转
     * @param dir 旋转方向 - 顺时针:0,逆时针:1
     * @param speed 旋转的速度
     * @param max 最大运动速度
     */
    rotate (dir:number,speed:number,max:number){
        if(dir != null) this.direction = dir||0;
        if(speed != null)this.speed = speed||0;
        if(max != null) this.speedMax = max||0;
        this.enabled = true;
    }

    /**旋转到指定位置,停下 */
    rotateTo(){
        //todo
    }

    /**停止旋转节点 */
    stop (){
        this.enabled = false;
    }

    update (dt:number) {
        if(!this.enabled)return;
        this.speed += this.accel;
        if(this.speedMax !==-1){
            if(this.speed > this.speedMax)this.speed = this.speedMax;
        }
        if(this.direction){
            this.node.rotation -= this.speed*dt;
        }else{
            this.node.rotation += this.speed*dt;
        }

    }


}
