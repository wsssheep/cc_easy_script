import BhvDragDrop from "../../Behavior/input/BhvDragDrop";
import BhvFrameIndex from "../../Behavior/ui/BhvFrameIndex";

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
 * 业务逻辑孔
 */
@ccclass
export default class CellItemSlot extends cc.Component {

    @property(cc.Node)
    dragItem:cc.Node = null;

    @property({
        type:cc.Integer
    })
    itemId:number = 0;

    // LIFE-CYCLE CALLBACKS:

    start () {
        this.setItemId(this.itemId);
    }

    setItemId(id){
        if(this.dragItem){
            this.dragItem.getComponent(BhvFrameIndex).index = id;
            this.itemId = id;
        }
    }

    onLoad () {
        let comp = this.dragItem.getComponent(BhvDragDrop);
        if(comp == null){
          comp = this.dragItem.addComponent(BhvDragDrop);
          comp.parent = this.node.getParent();
        }
        comp.emitTarget = this.node; //将节点信号发送给本脚本
    }

    onEnable(){
        this.node.on('onMoveEnterOutRage',this.onMoveEnterOutRage,this);
        this.node.on('onMoveLeaveOutRage',this.onMoveLeaveOutRage,this);
        this.node.on('onDropOutRage',this.onDropOutRage,this);

        this.node.on('onDragMoveEnter',this.onDragMoveEnter,this);
        this.node.on('onDragMoveLeave',this.onDragMoveLeave,this);
        this.node.on('onDropInArea',this.onDropInArea,this);

    }

    onMoveEnterOutRage(dragNode:cc.Node){
        //console.log('移出到了外面-',dragNode.name);
    }
    
    onMoveLeaveOutRage(dragNode:cc.Node){
        //console.log('移回来了里面-',dragNode.name);
    }

    onDropOutRage(dragNode:cc.Node){
        console.log('丢掉了道具-',dragNode.name);
        this.setItemId(0);
        
    }

    onDragMoveEnter(dragNode:cc.Node,dropNode:cc.Node){
        console.log('移入某节点-',dragNode.name);
    }

    onDragMoveLeave(dragNode:cc.Node,dropNode:cc.Node){
        console.log('移出某节点-',dragNode.name);
    }
    
    onDropInArea(dragNode:cc.Node,dropNode:cc.Node){
        console.log('丢入区域内-',dragNode.name);
        let index =   dragNode.getComponent(BhvFrameIndex).index;
        dragNode.getComponent(BhvFrameIndex).index = this.dragItem.getComponent(BhvFrameIndex).index;
        this.setItemId(index);

        let action = cc.sequence([
            cc.scaleTo(0.05,1.2).easing(cc.easeBackIn()),
            cc.scaleTo(0.2,1).easing(cc.easeBackOut())
        ])

        this.dragItem.runAction(action);

    }



    // update (dt) {}
}
