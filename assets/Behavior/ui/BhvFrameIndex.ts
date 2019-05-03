/*
 * @Author: wss 
 * @Date: 2019-04-24 15:44:01 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-24 15:59:43
 */


const {ccclass, property, executeInEditMode, requireComponent, menu} = cc._decorator;

/**
 * [FrameIndex]帧图改变
 * ver 0.5.0 新功能追加，可以使用 图集模式,通过设置对象的名字模板来获取帧
 */
@ccclass
@executeInEditMode
@requireComponent(cc.Sprite)
@menu("添加特殊行为/UI/Frame Index(帧图改变)")
export default class BhvFrameIndex extends cc.Component {

    @property({
        type:[cc.SpriteFrame],
        tooltip:'sprite将会用到帧图片',
    })
    spriteFrames:Array<cc.SpriteFrame> = [null];

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
    @property
    private  _index:number = 0;
    
 
    // LIFE-CYCLE CALLBACKS:

    /**通过设置帧名字来设置对象 */
    public setName(name:string){
       let index = this.spriteFrames.findIndex(v=>{return v.name == name});
       if(index<0){cc.error('frameIndex 设置了不存在的name:',name)}
       this.index = index||0;

    }

    /**随机范围设置帧图片 */
    public random(min?:number,max?:number){
        if(!this.spriteFrames)return;
        let frameMax = this.spriteFrames.length;
        if(min ==null || min<0)min = 0;
        if(max == null || max >frameMax)max = frameMax;
      
      
        this.index = Math.floor( Math.random()* (max - min) + min );
    }

    public next(){
        this.index++;
    }

    public previous(){
        this.index--;
    }

    // update (dt) {}
}
