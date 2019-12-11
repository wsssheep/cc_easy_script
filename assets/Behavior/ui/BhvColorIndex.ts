/*
 * @Author: wss
 * @Date: 2019-06-22 15:27:55
 * @LastEditTime: 2019-12-09 15:08:01
 * @LastEditors: wss
 */

const {ccclass, property,executeInEditMode,menu} = cc._decorator;

/**
 *  颜色序号 [v1.0.0] 
 * 通过改变序号来改变节点的颜色状态
 *  todo 增加切换颜色时的动画过渡效果
 */
@ccclass
@executeInEditMode
@menu("添加特殊行为/UI/Color Index (颜色序号)")
export default class BhvColorIndex extends cc.Component {

    @property([cc.Color])
    colors:cc.Color[] = [cc.color(255,255,255)]


    @property
    transitionColor:boolean = false;

    @property({
        visible:function(){return this.transitionColor === true}
    })
    transitionTime:number = 0.3;


    get index(){
        return this._index;
    }
    @property({
        tooltip:'当前显示的颜色',
        type:cc.Integer
    })
    set index(value:number){
        if (value < 0) return;
        this._index = value % this.colors.length;
        //设置 Sprite 组件的spriteFrame属性，变换图片               
        this.changeColor(this._index);
    }
    @property
    private  _index:number = 0;

    changeColor(index){
        let color = this.colors[index];
        if(!color)return;
        if(this.transitionColor){
             this.node.runAction(cc.tintTo(this.transitionTime,color.getR(),color.getG(),color.getB()));
        }else{
            this.node.color = color;
        }

    }

    // update (dt) {}
}
