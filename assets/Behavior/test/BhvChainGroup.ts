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

@ccclass
export default class BhvChains extends cc.Component {

    @property
    nodeArray:cc.Node[] = [];

    @property
    segLength = 18;
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if(this.nodeArray.length<=0){
            this.nodeArray = this.nodeArray.concat(this.node.children);
        }
    }

    start () {

    }

    update (dt) {
        //chain绑定
        if(this.nodeArray.length<=1)return;
        for (let i = 0; i < this.nodeArray.length - 1; i++) {
          this.dragSegment(i + 1, this.nodeArray[i].x, this.nodeArray[i].y);
        }
    }

    dragSegment(i, xin, yin) {
        let node = this.nodeArray[i];
        const dx =  xin - node.x;
        const dy =  yin - node.y;
        const angle = Math.atan2(dy, dx);
        node.x = xin - Math.cos(angle) * this.segLength;
        node.y = yin - Math.sin(angle) * this.segLength;
        node.rotation = cc.misc.radiansToDegrees(-1*angle);
        //this.segment(node.x,  node.y, angle);
      }
      

      
}




