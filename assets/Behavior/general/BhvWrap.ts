// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property, menu, disallowMultiple} = cc._decorator;

enum WRAP_MODE {
    parent, //以父节点为基准
    canvas, //以全局 Canvas 为基准,
    custom
}


/**
 *!（请使用新的 BhvBoundary 行为代替，该行为已经弃用）
 * Wrap 包装，会将对象限定在包装范围内,可以循环也可以限制移动的边界范围
 */
@ccclass
@menu("添加特殊行为/General/Wrap (包装)")
@disallowMultiple
export default class BhvWrap extends cc.Component {

    @property({
        type:cc.Enum(WRAP_MODE),
        tooltip: "wrap 模式",   
    })
    wrapMode = WRAP_MODE.parent;

    @property(cc.Node)
    customNode:cc.Node = null

    // LIFE-CYCLE CALLBACKS:

    start () {
        var node = this.node;
        var bBound =  node.getBoundingBox();
        var offset = node.getAnchorPoint();

        /**debug */
        var child = new cc.Node('test');
        child.setParent(this.node);
        child.setPosition(0,0);

        /**@type cc.Graphics */
        var graphic = child.addComponent(cc.Graphics);
        graphic.rect(-bBound.width * offset.x,-bBound.height *offset.y,bBound.width,bBound.height);
        graphic.fillColor = cc.color(0,255,155,155);
        graphic.fill();
    
    }

    getBBOX (node:cc.Node):{left?:number,right?:number,top?:number,bottom?:number}{
        if(!node)return{};
        var bBound = node.getBoundingBox();
        var offset = node.getAnchorPoint();
        var bbox = {
            left:bBound.x - bBound.width * offset.x,
            right:bBound.x + bBound.width * offset.x,
            top:bBound.y - bBound.height * offset.y,
            bottom:bBound.y + bBound.height * offset.y,
        }
        return bbox;
    }

    update (dt) {

        var bbox = this.getBBOX(this.node);

        var canvas:cc.Node = cc.find('Canvas');
        var canvasSize:cc.Size = canvas.getContentSize();
        var parent:cc.Node = this.node.getParent(); //获取该节点的父节点	
        var bbox2 ;

        var lBound:number = 0, rBound:number = 0, tBound:number = 0, bBound:number = 0;
      	
		// wrap to layout
		if (this.wrapMode === WRAP_MODE.canvas)
		{
            
			rBound = canvasSize.width;
            bBound = canvasSize.height;
       
		}
		// wrap to viewport
		else if(this.wrapMode === WRAP_MODE.parent &&parent)
		{
            bbox2 = this.getBBOX(parent);
			lBound = bbox2.left;
			rBound = bbox2.right;
			tBound = bbox2.top;
            bBound = bbox2.bottom;
         
        }

        else if(this.wrapMode === WRAP_MODE.custom &&this.customNode)
		{
            bbox2 = this.getBBOX(this.customNode);
			lBound = bbox2.left;
			rBound = bbox2.right;
			tBound = bbox2.top;
            bBound = bbox2.bottom;
         
        }
 

		if (bbox.right < lBound)
		{
			this.node.x = (rBound - 1) + (this.node.x - bbox.left);
		}
		else if (bbox.left > rBound)
		{
			this.node.x = (lBound + 1) - (bbox.right - this.node.x);
		}
		else if (bbox.bottom < tBound)
		{
			this.node.y = (bBound - 1) + (this.node.y - bbox.top);
		}
		else if (bbox.top > bBound)
		{
			this.node.y = (tBound + 1) - (bbox.bottom - this.node.y);
        }
        
    }
}
