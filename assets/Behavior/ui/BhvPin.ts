
const {ccclass, property,menu,disallowMultiple,executeInEditMode} = cc._decorator;

enum PIN_TYPE {
    /**锁定坐标和角度 */
    positionAngle,
    /**只锁定坐标 */
    position,
    /**只锁定角度 */
    angle,
    // rope,
    // bar,
}

/**
 * 无视节点层级，绑定该节点 和 另外一个节点的位置关系，
 * todo.. 增加绑定 缩放比例的选项
 * todo.. 增加绑定到边界框的功能
 * todo.. 增加绑定缩放的情况
 * todo.. 增加自动销毁，当pinObject 销毁时，BhvPIn 的该对象也会被销毁，适合血条、Buff 等对象
 * 
 */
@ccclass
@menu("添加特殊行为/UI/Pin (图钉)")
@disallowMultiple
@executeInEditMode
export default class BhvPin extends cc.Component {

    @property
    private _preview : boolean = false;
    public get preview() : boolean {
        return this._preview;
    }
    @property
    public set preview(v : boolean) {
        this._preview = v;
        //重新绑定位置
        if(v===true){
            if(this.pinObject)this.pin(this.pinObject);
        }
    }
    

    @property({
        type:cc.Node,
        tooltip:"需要pin在的对象上,可以无视层级的绑定 两个节点的位置关系"
    })
    pinObject:cc.Node = null;

    @property({
        type:cc.Enum(PIN_TYPE)
    })
    mode = PIN_TYPE.positionAngle;

    // init
    pinAngle:number;
    pinDist:number;
    myStartRotation:number;
    theirStartRotation:number;
    lastKnownAngle:number;

    /**枚举属性,PIN的类型 */
    PIN_TYPE = PIN_TYPE;
    
    // LIFE-CYCLE CALLBACKS:

    
    onLoad () {
		this.pinAngle = 0;
		this.pinDist = 0;
		this.myStartRotation = 0;  
		this.theirStartRotation = 0;
        this.lastKnownAngle = 0;
        if(this.pinObject)this.pin(this.pinObject,this.mode);

    }

    update (){

        if(CC_EDITOR){
            if(!this.preview)return;
        }

        if(this.pinObject == null)return;

        let newX:number = 0;
        let newY:number = 0;
        let pos:cc.Vec2 = this.node.position;
        let pos2:cc.Vec2 = this.pinObject.position;

        //这里转换有点问题...
        if (this.mode === 3 || this.mode === 4)		// rope mode or bar mode
		{
			// let dist:number = this.distanceTo(pos.x, pos.y,pos2.x, pos2.y);
			
			// if ((dist > this.pinDist) || (this.mode === 4 && dist < this.pinDist))
			// {
            //     let a:number = -this.angleTo(pos2.x, pos2.y,pos.x,pos.y);
            //     let d:number = cc.misc.degreesToRadians(a);
			// 	newX = pos2.x + Math.cos(d) * this.pinDist;
			// 	newY = pos2.y - Math.sin(d) * this.pinDist;
            // }
            cc.error('rope mode or bar mode is developing!');
            this.preview = false;
		}
		else
		{
            let a:number = this.pinObject.rotation + this.pinAngle;
            let d:number = cc.misc.degreesToRadians(a);
			newX = pos2.x + Math.cos(d) * this.pinDist;
            newY = pos2.y - Math.sin(d) * this.pinDist;
      
        }

        
        let newAngle:number = this.myStartRotation + (this.pinObject.rotation - this.theirStartRotation);
		this.lastKnownAngle = newAngle;
		
		if ((this.mode === 0 || this.mode === 1 || this.mode === 3 || this.mode === 4)
			&& (this.node.x !== newX || this.node.y !== newY))
		{
			this.node.x = newX;
			this.node.y = newY;
		}
        
        
		if ((this.mode === PIN_TYPE.positionAngle || this.mode === PIN_TYPE.angle) && (this.node.rotation !== newAngle))
		{
			this.node.rotation = newAngle;
        }
        
       
    }

    pin(node:cc.Node,mode:PIN_TYPE = 0){
        this.pinObject = node;
		this.pinAngle =  - this.angleTo(node.x, node.y,this.node.x, this.node.y) - node.rotation;
		//this.pinAngle =  - this.angleTo(node.x, node.y,this.node.x, this.node.y) - node.rotation;
        this.pinDist = this.distanceTo(node.x, node.y, this.node.x, this.node.y);
		this.myStartRotation = this.node.rotation;
		this.lastKnownAngle = this.node.rotation;
		this.theirStartRotation = node.rotation;
        this.mode = mode;
    }

    unpin(){
        this.pinObject = null;
    }


    getNodePos(curNode:cc.Node|string,targetNode:cc.Node|string){
        //获取节点
        if(typeof curNode === 'string')curNode = cc.find(curNode);
        if(typeof targetNode === 'string')targetNode = cc.find(targetNode);

        //获取当前节点世界坐标系
        let worldPos = curNode.convertToWorldSpaceAR(cc.Vec2.ZERO);

        //转换成目标节点的坐标值
        let pos = targetNode.convertToNodeSpaceAR(worldPos);

        return pos;
    }

    private distanceTo(x1:number, y1:number, x2:number, y2:number)
    {

        let dx:number = x1 - x2;
        let dy:number = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);

    }

    private angleTo(x1,y1,x2,y2){
        return cc.misc.radiansToDegrees(Math.atan2(y2 - y1, x2 - x1));
    }

    onDestroy(){
        this.pinObject = null;
    }


  
}



