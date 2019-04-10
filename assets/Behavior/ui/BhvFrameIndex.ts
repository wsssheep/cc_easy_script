// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property, executeInEditMode, requireComponent, menu} = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.Sprite)
@menu("添加特殊行为/UI/Frame Index(帧图改变)")
export default class BhvFrameIndex extends cc.Component {

    @property({
        type:[cc.SpriteFrame],
        tooltip:'sprite将会用到帧图片'
    })
    spriteFrames:Array<cc.SpriteFrame> = [null];

    private  _index:number = 0;

    @property({
        tooltip:'当前显示的帧图',
        type:cc.Integer
    })
    get index(){
        return this._index;
    }
    set index(value:number){
        if (value < 0) return;
        this._index = value % this.spriteFrames.length;
        let sprite = this.node.getComponent(cc.Sprite);
        //设置 Sprite 组件的spriteFrame属性，变换图片               
        sprite.spriteFrame = this.spriteFrames[this._index];
    }
 
    // LIFE-CYCLE CALLBACKS:

    random(min:number,max:number){
        if(!this.spriteFrames)return;
        this.index = Math.floor( Math.random()* this.spriteFrames.length );
    }

    next(){
        this.index++;
    }

    previous(){
        this.index--;
    }

    // update (dt) {}
}
