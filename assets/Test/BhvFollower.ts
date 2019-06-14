/*
 * @Author: wss 
 * @Date: 2019-05-03 21:55:19 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-03 22:52:34
 */


//跟随模式
 
const {ccclass, property} = cc._decorator;

@ccclass
export default class BhvFollower extends cc.Component {

    segLength = 64; //关节长度

    @property(cc.Node)
    parent:cc.Node = null;

    onload() {

    }
    
    update(dt) {
        if(this.parent == null)return;
        this.dragSegment(this.parent.x, this.parent.y);
    }
    
    dragSegment(xin, yin) {
        const dx = xin - this.node.x;
        const dy = yin - this.node.y;
        const angle = Math.atan2(dy, dx);
        let x = xin - Math.cos(angle) * this.segLength;
        let y  = yin - Math.sin(angle) * this.segLength;
        this.node.x = x;
        this.node.y = y;
        this.node.rotation = cc.misc.radiansToDegrees(angle);
        //segment(x[i], y[i], angle);
    }
    

    // update (dt) {}
}




