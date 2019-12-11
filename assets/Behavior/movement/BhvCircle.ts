
const { ccclass, property,menu,disallowMultiple} = cc._decorator;

/**角度制,限制角度范围 */
let clamp_angle = function (a) {
    a %= 2 * 180;
    if (a < 0) a += 2 * 180;
    return a;
};

/**
 * 圆周运动行为 [v1.0.0]
 * 控制节点以 当前所处位置，进行绕圈的圆周运动
 * 该行为会劫持节点坐标移动，因此不能和其他行为同时启动。
 */
@ccclass
@menu("添加特殊行为/Movement/Circle (圆周运动)")
@disallowMultiple
export default class BhvCircle extends cc.Component {
    
    @property
    initialState:boolean = true;

    @property({tooltip:'圆运动速度'})
    speed:number = 360;

    @property({tooltip:'加速度'})
    accel:number = 0;

    @property({tooltip:'运动起始角度'})
    angle:number = 50;

    @property({tooltip:'圆周半径'})
    radius:cc.Vec2 = cc.v2(50,50);

    @property({tooltip:'是否以父节点而不是初始坐标为基准旋转, 初始坐标设为为(0，0)'})
    rotateFromParent:boolean = false;

  

    originPos:cc.Vec2 =  cc.v2(0,0);


    // LIFE-CYCLE CALLBACKS:

    start () {
        // set default
        let rad:number = cc.misc.degreesToRadians( this.angle);
		this.originPos.x = this.node.x;// - Math.cos(rad) * this.radius.x;
        this.originPos.y = this.node.y;// + Math.sin(rad) * this.radius.y;
        this.node.x =  this.originPos.x - Math.cos(rad) * this.radius.x;
        this.node.y =  this.originPos.x + Math.sin(rad) * this.radius.y;
        this.enabled = this.initialState;
    }

    update (dt:number) {
        if(!this.enabled)return;
        if (dt === 0) return;
            
        if (this.accel !== 0)
            this.speed += this.accel * dt;
            
        if (this.speed !== 0)
        {
            //转换弧度值运算
            this.angle =  clamp_angle( this.angle + this.speed * dt);
            let rad:number = cc.misc.degreesToRadians(this.angle);
            if(this.rotateFromParent){
                this.node.x = (Math.cos(rad) * (this.radius.x) );
                this.node.y = -(Math.sin(rad) * (this.radius.y) );
            }else{
                this.node.x = (Math.cos(rad) * (this.radius.x) ) + this.originPos.x;
                this.node.y = -(Math.sin(rad) * (this.radius.y) ) + this.originPos.y;
                
            }

        }

    

    }

    /**设置运动半径 */
    setRadius(vec2:cc.Vec2){
        this.radius = cc.v2(vec2);
    }
}
