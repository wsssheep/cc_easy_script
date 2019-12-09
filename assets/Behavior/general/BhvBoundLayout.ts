/*
 * @Author: wss 
 * @Date: 2019-05-22 18:23:24 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-22 18:30:02
 */


const {ccclass, property,menu} = cc._decorator;

/**
 * 限制该节点的所有子节点在图层的内的边界尺寸内移动
 * 你可以决定是否 wrap 或者 bound 或者 接触边界自动销毁对象
 * 该组件不应该有静止不动的节点，如果只是针对少量节点的复杂情况请使用 BhvBoundary 行为
 */
@ccclass
@menu("添加特殊行为/UI/Bound Layout(边界限制)")
export default class BhvBoundLayout extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    @property({
        tooltip:'使用包装模式，可以让节点从一边穿越到另外一边'
    })
    wrap:boolean = false;

    @property({
        tooltip:'接触到边界就进行自动销毁'
    })
    outBoundDestroy:boolean = false;

    update (dt) {
        this.node.children.forEach(this.updateCheckRect,this)
    }

    updateCheckRect(node:cc.Node){
        let parent = this.node;
        if(node.isValid||node.active === false)return;

        //相当于将需要绑定的目标 放入对象的 parent 里进行比较
        let pos = node.position;

        let left =(parent.width* (1-parent.anchorX));
        let right = (parent.width* (-parent.anchorX));
        let up = parent.height * (1-parent.anchorY);
        let down =  parent.height * (-parent.anchorY);
  
        //left
        if((pos.x) > left){
            node.x = this.wrap?right:left;
            if(this.outBoundDestroy)node.destroy();
        }
        //right
        else if(( pos.x) < right){
            node.x = this.wrap?left:right;
            if(this.outBoundDestroy)node.destroy();
        }

        //up
        if((pos.y) > up){
            node.y = this.wrap?down:up;
            if(this.outBoundDestroy)node.destroy();
        }
        //down
        else if( (pos.y) <down ){
            node.y = this.wrap?up:down;
            if(this.outBoundDestroy)node.destroy();
        }

    }



}
