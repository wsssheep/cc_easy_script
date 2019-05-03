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
 * bound 行为，将对象限制在一个盒子里
 * 可以做摇杆，或者限制角色/节点的移动范围
 * 
 * 也可以将对象限制在某个矩形 或者 圆形的范围内
 * todo 
 * 添加节点事件： 碰到bound边界，发生wrap
 * 与 AutoDestroy 联动，超出编辑触发 autoDestroy
 */
@ccclass
export default class BhvBound extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    boundNode(){

    }

    boundCircle(){

    }

    update (dt) {
        // if(this.node.x>1000)this.node.x = 1000;
        // if(this.node.x<-1000)this.node.x = -1000;
        // if(this.node.y>1000)this.node.y = 1000;
        // if(this.node.y<-1000)this.node.y = -1000;
    }
}
