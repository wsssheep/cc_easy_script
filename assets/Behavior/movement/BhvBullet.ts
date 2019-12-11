

const {ccclass, property,menu,disallowMultiple} = cc._decorator;

/**判断两点之间的距离 */
let distanceTo = function(x1, y1, x2, y2)
{
	let dx = x1 - x2;
	let dy = y1 - y2;
	return Math.sqrt(dx * dx + dy * dy);

};

/**判断两点之间的角度 */
let angleTo = function(x1,y1,x2,y2){
	return cc.misc.radiansToDegrees( Math.atan2(y2 - y1, x2 - x1) );
};

/**
 * 子弹行为 [v1.0.0]
 * 子弹的行为只是控制节点以某个角度为方向持续的移动。
 * 它还提供了额外的选择，如重力和反弹(未实现)，允许它也像弹球一样使用。
 * 顾名思义，它非常适合像子弹这样的节点。
 */
@ccclass
@menu("添加特殊行为/Movement/Bullet (子弹)")
@disallowMultiple
export default class BhvBullet extends cc.Component {
    @property
    speed:number = 400;

    @property
    acceleration:number = 0;

    @property
    gravity:number = 0;

    // @property
    // bounceOffSolid:boolean = false;

    @property({
        tooltip: "锁定角度移动角度,如果锁定了，子弹将不会按照节点本身的角度判断移动方向",   
    })
    isLockAngle:boolean = false;

    @property
    moveAngle:number = 0;

    @property
    initialState:boolean = true;

    dx:number;
    dy:number;
    lastX:number;
    lastY:number;
    lastKnownAngle:number;
    travelled:number;


    // LIFE-CYCLE CALLBACKS:
    onLoad () {
		
        let speed:number = this.speed;
        if(!this.isLockAngle){
            this.dx = Math.cos(this.node.rotation /180 * Math.PI) * speed;
            this.dy = Math.sin(this.node.rotation /180 * Math.PI) * speed;
        }else{
            this.dx = Math.cos(this.moveAngle /180 * Math.PI) * speed;
            this.dy = Math.sin(this.moveAngle /180 * Math.PI) * speed;
		}
		
		this.lastX = this.node.x;
		this.lastY = this.node.y;		
		this.lastKnownAngle = this.node.rotation;
		this.travelled = 0;
		
		this.enabled = this.initialState;

	
        
	}

	/**
	 * [实验]随机改变子弹角度
	 */
	public randomAngle(){
		this.setMoveAngle(Math.PI*2 * Math.random());
	}
	
	/**
	 * [实验] 翻转角度方向
	 */
	public reverseAngle(){
		//TODO 可能有问题，需要验证一下
		//todo 再增加一个折射角度方法
		//todo 再增加随机反射角度方向
		let angle = -Math.PI + this.moveAngle;
		this.setMoveAngle(angle);
	}

    update (dt:number) {
        if (!this.enabled)return;
        if (dt === 0)return; 
		
		let s:number, a:number;
		//let bounceSolid, bounceAngle; //暂不考虑碰撞 和 反弹功能
		
		// Object had its angle changed: change angle of motion, providing 'Set angle' is enabled.
		if (this.node.rotation !== this.lastKnownAngle)
		{
			if (!this.isLockAngle)
			{   
				s = distanceTo(0, 0, this.dx, this.dy);
				this.dx = Math.cos(this.node.rotation /180* Math.PI) * s;
				this.dy = Math.sin(this.node.rotation /180* Math.PI) * s;
			}
			
            this.lastKnownAngle = this.node.rotation;
      
		}
		
		// 应用加速度
		if (this.acceleration !== 0)
		{
			s = distanceTo(0, 0, this.dx, this.dy);
			
			if (this.dx === 0 && this.dy === 0)
				a = this.node.rotation;
			else
				a = angleTo(0, 0, this.dx, this.dy)||this.moveAngle;
				
			s += this.acceleration * dt;
			
			// Don't decelerate to negative speeds
			if (s < 0) s = 0;
			
			this.dx = Math.cos(a /180* Math.PI) * s;
			this.dy = Math.sin(a /180* Math.PI) * s;
		}
		
		// 将重力应用到 Y 上
		if (this.gravity !== 0)this.dy -= this.gravity * dt;
			
		this.lastX = this.node.x;
        this.lastY = this.node.y;
        
		// Apply movement to the object
		if (this.dx !== 0 || this.dy !== 0)
		{
			this.node.x += this.dx * dt;
			this.node.y -= this.dy * dt;
			this.travelled += distanceTo(0, 0, this.dx * dt, this.dy * dt)
			
			if (!this.isLockAngle)
			{
				this.node.rotation = angleTo(0, 0, this.dx, this.dy);
				this.lastKnownAngle = this.node.rotation;
			}

        }
    }

    // 设置属性
    setSpeed(s:number)
	{
		//向量夹角的弧度值
		let a:number = cc.misc.degreesToRadians(this.moveAngle);

		this.dx = Math.cos(a) * s;
		this.dy = Math.sin(a) * s;
	}
	
    /**设置移动角度(弧度制) */
	setMoveAngle(rad:number)
	{
		this.moveAngle = cc.misc.radiansToDegrees(rad);
		let s:number = cc.v2(this.dx, this.dy).mag();
		this.dx = Math.cos(rad) * s;
		this.dy = Math.sin(rad) * s;
	}
	
	bounce(){
        //TODO 碰撞物理对象反弹
	}
	
}
