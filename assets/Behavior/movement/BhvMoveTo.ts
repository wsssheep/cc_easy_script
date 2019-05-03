/*
 * @Author: wss 
 * @Date: 2019-04-16 21:32:36 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-17 14:19:51
 */


const EVENT_NAMES = {
    ON_COMPLETED:"onMoveToFinished"
}

const {ccclass, property,menu,disallowMultiple} = cc._decorator;

/**
 * 8 Direction行为控制节点在上、下、左、右和对角线上移动，
 * 默认情况下由键盘方向键控制。
 */
@ccclass
@menu("添加特殊行为/Movement/MoveTo (移动到某处)")
@disallowMultiple
export default class BhvMoveTo extends cc.Component {

    @property({
        type:cc.Node
    })
    private targetNode:cc.Node = null;
    private _target:cc.Vec2 = cc.v2(0,0);
    private _isRunning:boolean = true;

    @property({visible:function(){return this.targetNode != null}})
    private activeAtStart:boolean = false;
    
    @property({tooltip:'起始速度'})
    public speed:number = 200;

    @property({tooltip:'最大速度'})
    public speedMax:number = 200;

    @property({tooltip:'加速度'})
    public acceleration:number = 0;

    @property({tooltip:'是否在moveto 时用角度朝向移动方向'})
    public rotateToTarget:boolean = true;

    //目标范围容差，越小靠近越精确
    @property({tooltip:'极限距离，当小于该距离时,判断移动结束（注意不能设为0值）'})
    public closeLimitRange:number = 0.001;

    /**反转移动方向，原本是moveto，反转后 将会反向运动 */
    public reverseMoving:boolean  = false;

    // LIFE-CYCLE CALLBACKS:

    static EVENTS = EVENT_NAMES;

    // onLoad () {}

    start () {
        if(this.activeAtStart){
            this._isRunning = true;
        }
    }

    onEnable(){

    }

    onDisable(){

    }

    setSpeed(speed:number = 200,speedMax:number =500,accel:number =500){
        this.speed = speed;
        this.speedMax = speedMax;
        this.acceleration = accel;
    }

    /**移动到指定目标节点 */
    moveToTarget(node:cc.Node){
        this.targetNode = node;
        this._isRunning = true;
    }

    /**移动到指定目标位置 */
    moveTo(pos:cc.Vec2) {
        this._target = pos;
        this._isRunning = true;
    }

    stop(){
        this._isRunning = false;
    }

    /**更新目标节点的坐标到对应的坐标上 */
    updateTarget(){
        if(!this.targetNode)return;
        this._target = this.targetNode.position;
    }

    update (dt) {
        if ((!this.enabled)||(!this._isRunning)) {
            return;
        }
  
        this.updateTarget();//检查有没有绑定目标
        let limitMin = this.closeLimitRange||0.0001;
        let node = this.node;
        let curX = node.x;
        let curY = node.y;
        let targetX = this._target.x;
        let targetY = this._target.y;

        //加速度影响
        this.speed += this.acceleration*dt;
        if(this.speed>=this.speedMax)this.speed = this.speedMax;
        if(this.speed<0)this.speed = 0;

        //抵达目标
        
        if (Math.abs(curX-targetX) < limitMin && Math.abs(curY -targetY) < limitMin) {
            this._isRunning = false;
            this.onComplete();
        }

        if ((this.speed === 0) || (dt === 0)) {
            return;
        }

        let movingDist = this.speed * dt;//移动距离
        let distToTarget = cc.v2(curX,curY).sub(cc.v2(targetX,targetY)).mag();//目标距离

        let newX, newY;
        if (movingDist < distToTarget) {
            var t = movingDist / distToTarget;
            newX = cc.misc.lerp(curX, targetX, t);
            newY = cc.misc.lerp(curY, targetY, t);
        } else {
            newX = targetX;
            newY = targetY;
        }

        this.node.x = newX;
        this.node.y = newY;

        if (this.rotateToTarget) {
            this.node.rotation = cc.misc.radiansToDegrees(Math.atan2(curY-newY, curX-newX));
        }

 

    }

    onComplete(){
        this.node.emit(EVENT_NAMES.ON_COMPLETED);
    }
}
