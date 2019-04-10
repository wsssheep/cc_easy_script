// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property,menu,disallowMultiple} = cc._decorator;

const DIRECTION = cc.Enum({
    clockwise:0,
    antiClockwise:1
});

/**
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
