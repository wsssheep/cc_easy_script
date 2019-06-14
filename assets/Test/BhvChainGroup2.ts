// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

/**
 * 
 *  TODO 可以将自己定义的节点构成 chain,而不是默认的组件绑定节点的 子节点
 */
@ccclass
export default class BhvChainGroup2 extends cc.Component {

    @property
    nodeArray:cc.Node[] = [];

    @property
    segLength = 64;

    @property(cc.Node)
    targetNode:cc.Node = null;

    private targetPos:cc.Vec2 = cc.v2(0,0);
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if(this.nodeArray.length<=0){
            this.nodeArray = this.nodeArray.concat(this.node.children);
        }
    }

    start () {
        let left = this.nodeArray[this.nodeArray.length-1];
        left.x = 120;
        left.y = 150;
    }

    update (dt) {
        //chain绑定
        if(this.targetNode){
            this.reachSegment(0, this.targetNode.x, this.targetNode.y); //头部牵引坐标节点
         
        }

        for (let i = 1; i < this.nodeArray.length; i++) {
          this.reachSegment(i, this.targetPos.x, this.targetPos.y);
        }

        for (let j = this.nodeArray.length - 1; j >= 1; j--) {
          this.positionSegment(j, j - 1);
        }

        for (let k = 0; k < this.nodeArray.length; k++) {
            let node = this.nodeArray[k];
            //node.scale = (k+1)/8+1
            //this.segment(node.x, node.y, node.rotation, (k + 1) * 2);
        }

    }

    positionSegment(_a,_b){
        let a =  this.nodeArray[_a];
        let b = this.nodeArray[_b];
        b.x = a.x + Math.cos(-1*cc.misc.degreesToRadians(a.rotation)) * this.segLength;
        b.y = a.y + Math.sin(-1*cc.misc.degreesToRadians(a.rotation)) * this.segLength;
    }

    reachSegment(i,xin,yin){
        let node = this.nodeArray[i];
        const dx = xin - node.x;
        const dy = yin - node.y;
        node.rotation = cc.misc.radiansToDegrees( -1 * Math.atan2(dy,dx));
        this.targetPos.x = xin - Math.cos(-1*cc.misc.degreesToRadians(node.rotation)) * this.segLength;
        this.targetPos.y = (yin - Math.sin(-1*cc.misc.degreesToRadians(node.rotation)) * this.segLength);
        
    }

      
}




