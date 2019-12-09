// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property,menu} = cc._decorator;

/**
 * 发射器，暂时实现的基本功能
 * todo 0.1 - 控制节点生成的朝向/初始化事件
 * todo 0.2 - 控制随机生成的方式
 * todo 0.3 - 和间隔发射器组合使用，源源不断产生怪物
 * todo 0.4 - 使用对象池优化（提供）
 */
@ccclass
@menu("添加特殊行为/Logic/Emitter(发射器)")
export default class BhvEmitter extends cc.Component {

    @property(cc.Prefab)
    prefab: cc.Prefab = null;

    @property({
        type:cc.Node,
        tooltip:'在哪里生成该prefab'
    })
    generatorParent:cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    /**触发条件的 emit */
    onEventEmit(e){
        this.createNode();
    }

    // onEventEmitNodePos(e:cc.Event.EventTouch){
    //     let node = this.createNode();
    //     let x  = e.target.x;
    //     let y = e.target.y;
    //     node.x  = x;
    //     node.y  = y;
    // }

    // onEventEmitPos(e:cc.Event.EventTouch){
    //     let node = this.createNode();
    //     let x  = e.getLocationX();
    //     let y = e.getLocationY();
    //     node.x  = x;
    //     node.y  = y;
    // }

    emit(pos:cc.Vec2,rotation:number = 0){
        let node = this.createNode();
        node.x = pos.x;
        node.y = pos.y;
        node.rotation = rotation;
    }

    createNode():cc.Node{
        let node = cc.instantiate(this.prefab);
        let parent = this.generatorParent||this.node;
        parent.addChild(node);
        return node;
    }



    // update (dt) {}
}
