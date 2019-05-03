/*
 * @Author: wss 
 * @Date: 2019-04-10 23:39:26 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-12 20:58:13
 */

const {ccclass, property, menu, executeInEditMode} = cc._decorator;

/**
 * 圆形容器(自动布局)
 * 自动控制节点下的子对象 呈现圆形的布局
 */
@ccclass
@menu("添加特殊行为/UI/Layout Circle (圆布局)")
@executeInEditMode
export default class BhvLayoutCircle extends cc.Component {

    @property
    radius:cc.Vec2 = cc.v2(32,32);

    @property
    startAngle:number = 0;

    @property({
        tooltip:'是否当容器内数量发生变化时才更新坐标',
        displayName:"Update When Count Change "
    })
    isUpdateByCountChange:boolean = false;

    _preChildCount:number = 0;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    //更新容器
    updateContent(){
        let array = this.node.children;
        let startPos = this.node.position;
        let maxCount =  this.node.childrenCount;
        let startAngle = this.startAngle;
        let divAngle = 360/maxCount;
        
        for (let i = 0; i < array.length; i++) {
            const e = array[i];
            const a = startAngle + divAngle*i;
            let x =  this.radius.x * Math.cos(cc.misc.degreesToRadians(a));
            let y =  this.radius.y * Math.sin(cc.misc.degreesToRadians(a));
            e.x = x;
            e.y = y;
            
        }

    }

    update (dt) {
        if(this._preChildCount !== this.node.childrenCount || this.isUpdateByCountChange === true){
            this._preChildCount =  this.node.childrenCount;
            this.updateContent();
        }
    }
}
