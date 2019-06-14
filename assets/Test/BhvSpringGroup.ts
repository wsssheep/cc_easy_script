
/*
 * @Author: wss 
 * @Date: 2019-04-12 21:08:56 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-03 22:17:25
 */

const {ccclass, property, menu} = cc._decorator;

/**
 * [开发中]链式行为 ver 0.0.1
 * 可以将几个子节点绑定成关节模式
 * 链式结构，可以将容器内的对象链接起来
 * TODO 可以将自己定义的节点构成 chain
 * 后续开发请参考url: http://p5js.org/zh-Hans/examples/interaction-follow-1.html
 * 后续开发请参考url: http://p5js.org/zh-Hans/examples/interaction-follow-2.html
 * 后续开发请参考url: http://p5js.org/zh-Hans/examples/interaction-follow-3.html
 */
@ccclass
@menu("添加特殊行为/Movement/SpringGroup (一组弹簧)")
export default class BhvChainsGroup extends cc.Component {

    @property([cc.Node])
    chainNodes :cc.Node[] = [];

    spring2dNodes:Spring2D[] = [];

    lineNodes:cc.Node[] = []; //保存线节点的

    @property
    lineHeight:number = 16;

    @property(cc.SpriteFrame)
    lineTexture:cc.SpriteFrame = null;

    // LIFE-CYCLE CALLBACKS:

    @property
    gravity:number = 0;

    @property
    mass:number = 5;

    onLoad () {
        if(this.chainNodes.length <1){
            this.chainNodes = this.chainNodes.concat(this.node.children);
        }

        for (let i = 0; i < this.chainNodes.length; i++) {
            let node =  this.chainNodes[i];
            this.spring2dNodes.push(new Spring2D(node.x,node.y,this.mass,this.gravity));
            this.lineNodes.push(this.createLineNode());
        }

    }

    start () {
        
    }

    createLineNode(){
        let node = new cc.Node();
        let sprite =  node.addComponent(cc.Sprite);
        sprite.type = cc.Sprite.Type.SLICED;
        sprite.spriteFrame = this.lineTexture;
        node.anchorX = 0;
        node.height = this.lineHeight;
        this.node.addChild(node);
        return node;
    }

    update(dt) {
        for (let i = 0; i < this.chainNodes.length; i++) {
            const node = this.chainNodes[i];
            const spring = this.spring2dNodes[i];
            const line = this.lineNodes[i];
            const preNode = i>0?this.chainNodes[i-1]:null;
            if(preNode){
                spring.update(node,preNode.x,preNode.y);
                spring.setLine(line,preNode.x,preNode.y);
            }
            
        }
        

    }

    // update (dt) {}
}

// 2d 弹簧效果
class Spring2D {
    x = 0;// The x- and y-coordinates
    y = 0;
    vx = 0; // The x- and y-axis velocities
    vy = 0;
    mass = 0;
    gravity = 9.8;
    stiffness = 0.2;
    damping = 0.7;

    constructor(xpos, ypos, m, g){
        this.x = xpos;// The x- and y-coordinates
       this.y = ypos;
       this.mass = m;
       this.gravity = g;
    }

    update(node,targetX, targetY) {
        let forceX = (targetX - this.x) * this.stiffness;
        let ax = forceX / this.mass;
        this.vx = this.damping * (this.vx + ax);
        this.x += this.vx;
        let forceY = (targetY - this.y) * this.stiffness;
        forceY += this.gravity;
        let ay = forceY / this.mass;
        this.vy = this.damping * (this.vy + ay);
        this.y += this.vy;
        
        node.x = this.x;
        node.y = this.y;
   
    }

    setLine(lineNode,nx,ny){ 
        var startPos: cc.Vec2 = cc.v2(this.x,this.y);
        var endPos: cc.Vec2 = cc.v2(nx,ny);
        var distance: number = startPos.sub(endPos).mag();
        var angle: number = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
        lineNode.x = this.x;
        lineNode.y = this.y;
        lineNode.width = distance;
        lineNode.rotation = cc.misc.radiansToDegrees(angle) * -1;

    }

 
}
