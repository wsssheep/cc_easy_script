/*
 * @Author: wss 
 * @Date: 2019-07-06 18:15:06 
 * @Last Modified by: wss
 * @Last Modified time: 2019-07-06 19:05:49
 */


const {ccclass, property,menu,disallowMultiple} = cc._decorator;



/**
 * 旋转到 [v1.0.0]
 * 旋转行为会使节点自动旋转到某个特定位置
 */
@ccclass
@menu("添加特殊行为/Movement/RotateTo (旋转到指定角度)")
@disallowMultiple
export default class BhvRotateTo extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

 
    targetAngle:number = 0;

    @property
    lerpValue:number = 0.01;

    @property({
        tooltip:'角度精细度的范围差',
        range:[0,1]
    })
    precisionAngle:number = 0.1;
    
    _lerpValue:number = 0.01;

    /**lerp 减速  */
    lerpDecel:number = 0.01;

    @property( { type: [cc.Component.EventHandler] } )
    finishEvents:cc.Component.EventHandler[] = []

    private isRun:boolean = false;


    // @property({
    //     tooltip:'低速滚动模式(一般是转盘这种需要区分阶段)'
    // })
    // delayStopMode:boolean = false;

    onLoad(){
        this._lerpValue = this.lerpValue;
    }


    /**
     * wrap 角度的旋转角度，比如720 度，可以被设置为 0度,360
     * @param loop 
     */
    wrapAngleCircle(loop:number = 0){
        this.node.rotation = this.node.rotation%360 + loop*360;
    }


    /**
     * 旋转到指定角度(逆向请传入负值角度
     * @param angle 角度
     * @param lerp lerp
     */
    rotateTo(angle:number,lerp?:number,precisionAngle:number =0.1){
        if(lerp!== null && lerp !== undefined){
            this._lerpValue = this.lerpValue = lerp;
        }
        if(precisionAngle){
            this.precisionAngle = precisionAngle;
        }
       
        this.targetAngle = angle;
        this.isRun = true;
    }

    rotateAdd(angle:number,lerp:number){
        if(lerp!== null && lerp !== undefined){
            this._lerpValue = this.lerpValue = lerp;
        }
       
        this.targetAngle = this.node.rotation + angle;
        this.isRun = true;
    }


    /**停止旋转节点 */
    stop (){
        this.isRun = false;
    }

    update (dt:number) {
        if(!this.isRun)return;
        let  lerp = dt * this._lerpValue * 60;
    
        this.node.rotation = cc.misc.lerp(this.node.rotation,this.targetAngle,lerp);
        if(Math.abs(this.node.rotation-this.targetAngle)<=this.precisionAngle){
            this.isRun = false;
            this.node.rotation = this.targetAngle;
            this.finishEvents.forEach(comp=>{
                comp.emit([comp.customEventData]);
            })
        }

    }


}
