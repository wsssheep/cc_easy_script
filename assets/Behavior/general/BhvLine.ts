/*
 * @Author: wss 
 * @Date: 2019-04-10 00:31:44 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-10 00:42:26
 */

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**
 * 连线 [v.1.0.0]
 * 将该对象 放置到 两个节点之间，形成连线, 可以无视节点关系
 */
@ccclass
@menu("添加特殊行为/General/Line (连线)")
@disallowMultiple
export default class BhvLine extends cc.Component {

    @property(cc.Node)
    startNode: cc.Node = null;

    @property(cc.Node)
    endNode: cc.Node = null;


    // LIFE-CYCLE CALLBACKS:
    start() {
        if (this.startNode && this.endNode) {
            this.setLine(this.startNode, this.endNode);
        }

    }

    /**设置这条线 与 两个节点 动态连接起来 */
    setLine(nodeStart: cc.Node, nodeEnd: cc.Node) {
        if (!this.startNode || !this.endNode) return;
        this.node.anchorX = 0;
        this.node.anchorY = 0.5;
        this.startNode = nodeStart;
        this.endNode = nodeEnd;

    }

    update() {
        if (!this.startNode || !this.endNode) return;
        var startPos: cc.Vec2 = this.startNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var endPos: cc.Vec2 = this.endNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var distance: number = startPos.sub(endPos).mag();
        var angle: number = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        this.node.position = this.node.getParent().convertToNodeSpaceAR(startPos);

        this.node.width = distance;
        this.node.rotation = cc.misc.radiansToDegrees(angle) * -1;


    }
}
