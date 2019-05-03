
const {ccclass, property,menu,disallowMultiple,executeInEditMode} = cc._decorator;

enum PIN_TYPE {
    positionAngle,
    position,
    angle,
    rope,
    bar,
}

//todo 未完成...

/**
 * 无视节点层级，绑定该节点 和 另外一个节点的位置关系，
 * todo.. 增加绑定边界框的功能
 * todo.. 增加绑定 非 中心锚点的情况
 * 
 */
@ccclass
@menu("添加特殊行为/UI/Pin (图钉)")
@disallowMultiple
//@executeInEditMode
export default class BhvPin extends cc.Component {

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

    
    start () {
		this.pinAngle = 0;
		this.pinDist = 0;
		this.myStartRotation = 0;  
		this.theirStartRotation = 0;
        this.lastKnownAngle = 0;
        if(this.pinObject)this.pin(this.pinObject);

    }

    update (){
        let newX:number = 0;
        let newY:number = 0;
        let pos:cc.Vec2 = this.node.position;
        let pos2:cc.Vec2 = this.pinObject.position;

        //这里转换有点问题...
        if (this.mode === 3 || this.mode === 4)		// rope mode or bar mode
		{
			let dist:number = this.distanceTo(pos.x, pos.y,pos2.x, pos2.y);
			
			if ((dist > this.pinDist) || (this.mode === 4 && dist < this.pinDist))
			{
                let a:number = this.angleTo(pos2.x, pos2.y,pos.x,pos.y);
                let d:number = cc.misc.degreesToRadians(a);
				newX = pos2.x + Math.cos(d) * this.pinDist;
				newY = pos2.y - Math.sin(d) * this.pinDist;
			}
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
        
        
		if ((this.mode === 0 || this.mode === 2) && (this.node.rotation !== newAngle))
		{
			this.node.rotation = newAngle;
        }
        
       
    }

    pin(node:cc.Node,mode?){
        this.pinObject = node;
		this.pinAngle = this.angleTo(node.x, node.y, this.node.x, this.node.y) - node.rotation;
		this.pinDist = this.distanceTo(node.x, node.y, this.node.x, this.node.y);
		this.myStartRotation = this.node.rotation;
		this.lastKnownAngle = this.node.rotation;
		this.theirStartRotation = node.rotation;
        this.mode = mode||0;
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
        return Math.atan2(y2 - y1, x2 - x1);
    }

    onDestroy(){
        this.pinObject = null;
    }


  
}



