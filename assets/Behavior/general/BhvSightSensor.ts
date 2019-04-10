/*
 * @Author: wss 
 * @Date: 2019-04-10 00:31:53 
 * @Last Modified by:   wss 
 * @Last Modified time: 2019-04-10 00:31:53 
 */

const {ccclass, property, menu} = cc._decorator;

let SIGNAL = {
    ENTER_NODE:"BhvSightSensor:Enter",
    EXIT_NODE:"BhvSightSensor:Exit"
}

/**
 * 视线传感器行为。
 * 视线传感器会检查,是否有节点进入了自己的视线范围,发送对应的信号
 * 你可以绑定需要监听的节点。
 */
@ccclass
@menu("添加特殊行为/General/Sight Sensor (视线传感器)")
export default class BhvSightSensor extends cc.Component {

    @property({
        tooltip:'测试视线所在区域'
    })
    debug:boolean = false;

    @property({
        tooltip:'移动相机节点, 进行可视区域判断',
        type:cc.Node
    })
    camera:cc.Node = null;

    @property({
        type:[cc.Node],
        tooltip:'需要检查的视线目标对象'
    })
    initialNodes:Array<cc.Node> =  [];

    @property({
        tooltip:'检测时间,每隔 x 秒，检查一次, 越频繁性能消耗越大'
    })
    checkTime:number = 0.5;

    @property({
        tooltip:'传感器半径范围'
    })
    rangeRadius:number = 256;

    @property({
        tooltip:'视野扇形范围'
    })
    coneOfView:number = 180;

    @property({
        tooltip:'是否视线角度跟随节点角度'
    })
    isAngleFollow:boolean = false;

    @property({
        tooltip:'视野所在角度',
        visible:function(){
            return this.isAngleFollow ==false
        }
    })
    angleOfView:number = 0;

    static EVENT = SIGNAL;

    /**需要搜索的节点 */
    private searchNodes:Set<cc.Node> = new Set();
    /**看到的节点 */
    private watchNodes:Set<cc.Node> = new Set();
    private debugFX:cc.Graphics;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}



    start () {
        
        if(this.debug){

            let node = new cc.Node('fx');
            node.addComponent(cc.Graphics);
            this.node.addChild(node);
            this.debugFX = node.getComponent(cc.Graphics);
            this.debugFX.clear();

        }


        //首先根据配置的默认节点，加入到目标
        for (let i = 0; i < this.initialNodes.length; i++) {
            const element = this.initialNodes[i];
            this.searchNodes.add(element);
        }


    }

    debugDraw(){
        if(!this.debug)return;
        let ctx:cc.Graphics = this.debugFX;
        let follow = this.isAngleFollow? 0:this.angleOfView;
        let startAngle = cc.misc.degreesToRadians(360 - follow + this.coneOfView/2);
        let endAngle = cc.misc.degreesToRadians(360-follow - this.coneOfView/2);
      
        ctx.clear();
        //画出范围矩形
        ctx.moveTo(0,0)
        ctx.lineTo(0,0);
        ctx.arc(0,0,this.rangeRadius,startAngle,endAngle,false);
        ctx.lineTo(0,0);
        ctx.close();
        //ctx.circle(0,0,this.rangeRadius);
        ctx.fillColor = cc.color(0,0,0,55);
        ctx.strokeColor = cc.color(255,0,0,155);
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        //锁定的对象(标记圆圈)


        let nodes:Set<cc.Node> = this.watchNodes;
        nodes.forEach(node => {
            let a = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            let vec2 = this.node.convertToNodeSpaceAR(a);
            ctx.circle(vec2.x,vec2.y,node.width/4);
            ctx.fill();
            ctx.fillColor = cc.color(255,0,0,55);
            ctx.strokeColor = cc.color(255,0,0,155);
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();

        });


    }

    private _timer:number = 0;

    update (dt) {

        this._timer -=dt;
        if(this._timer<=0){
            this._timer += this.checkTime;
        }else{
            return;
        }

        if(this.isAngleFollow){
            this.angleOfView = this.node.rotation;
        }

        this.checkNodes();
        if(this.debug)this.debugDraw();


    }

    addTarget(target:cc.Node){
        this.searchNodes.add(target);
    }

    removeTarget(target:cc.Node){
      return  this.searchNodes.delete(target);
    }

    hasTarget(target:cc.Node){
       return this.searchNodes.has(target);
    }

    getTargets(){
        return this.searchNodes;
    }

    /**检查是否在可视范围内，如果不在即关闭检查系统 */
    checkInCamera(){
        //todo  优化项
    }

    /**节点是否位于半径范围内 (世界坐标下) */
    checkInRange(node:cc.Node){
        let pos1:cc.Vec2 = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let pos2:cc.Vec2 = node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let right = cc.Vec2.RIGHT;
        let p = pos1.sub(pos2);

        let distance:number = p.mag();
     
        
        if(distance > this.rangeRadius)return false;
        
        if(this.coneOfView>= 360){
            return true;
        }else{
            let angleOffset:number = cc.misc.degreesToRadians(this.coneOfView/2);
            let angleTarget:number = cc.misc.degreesToRadians(this.angleOfView);
            let b = right.rotate(angleTarget);
            let angle1 = right.signAngle(p); //当前向量角度 (??)
            let angle2 = right.signAngle(b); //目标向量角度

            if(angle1>0)angle1 = Math.PI -  angle1;
            if(angle1<0)angle1 = angle1 -  Math.PI;

            //console.log(cc.misc.radiansToDegrees(angle1));
            console.log(p.mag());
        
            if(Math.abs(angle1-angle2)<=angleOffset){
                return true;
            }
           
        }
        

    }

    /**遍历节点组进行检查 */
    checkNodes(){
        let nodes:Set<cc.Node> = this.searchNodes;
        nodes.forEach(node => {
            //未激活
            let find = this.checkInRange(node);
            if(!node.active) find = false;
            if(find){
                if( !this.watchNodes.has(node) ){
                    this.watchNodes.add(node);
                    this.node.emit(SIGNAL.ENTER_NODE,node,node.name); //进入传感区域
                }
            }else{
                if( this.watchNodes.has(node) ){
                    this.watchNodes.delete(node);
                    this.node.emit(SIGNAL.EXIT_NODE,node,node.name); //离开传感区域
                }

            }


        });

    }



}
