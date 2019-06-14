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
export default class DragCopy extends cc.Component {

    @property(cc.Prefab)
    prefab:cc.Prefab = null;

    _node:cc.Node;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onEnable(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.onDragStart,this);
    }

    onDragStart(event:cc.Event.EventTouch){

      let node =  cc.instantiate(this.prefab);
      this._node = node;
      this.node.getParent().addChild(node);
      node.x =  this.node.x;
      node.y =  this.node.y;
   
    }



    // update (dt) {}
}
