/*
 * @Author: wss 
 * @Date: 2019-04-24 16:03:19 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-24 16:41:35
 */


const { ccclass, property, executeInEditMode, requireComponent, menu } = cc._decorator;

/**
 * 图集帧 [v0.5.0]
 * ver 0.5.0 新功能追加，可以使用 图集模式,通过设置对象的名字模板来获取帧
 */
@ccclass
@executeInEditMode
@requireComponent(cc.Sprite)
@menu("添加特殊行为/UI/Frame Name(帧图设置)")
export default class BhvAtlasFrame extends cc.Component {

    @property(cc.SpriteAtlas)
    public spriteAtlas: cc.SpriteAtlas = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: '默认的帧图名字，如果找不到对应的名字将使用这个帧代替'
    })
    public defaultFrame: cc.SpriteFrame = null;

    @property({
        tooltip: '索引模式,启用后可以使用模板名字符来设置index'
    })
    indexMode: boolean = false;

    @property({
        type: cc.Integer,
        tooltip: "帧图的最大取值范围 0 ~ indexMax",
        visible: function () { return this.indexMode === true; }
    })
    public indexMax: number = 9;

    /**模板 用*代替你要的索引值的位置, 例如 name_* > name_2， find_* > find_2, 索引通过 this.index 获取  */
    @property({
        tooltip: 'name_*_a 的方式可以动态的设置帧图名和index',
        visible: function () { return this.indexMode === true; }
    })
    atlasNameTemplate: string = "*";

    @property
    private _index: number = 0;
    public get index(): number {
        return this._index;
    }
    @property({
        type: cc.Integer,
        tooltip: 'name_{i}_a 的方式可以动态的设置帧图名和index',
        visible: function () { return this.indexMode === true; }
    })
    public set index(v: number) {
        if (v < 0) v = 0;
        if (v > this.indexMax) v = this.indexMax;
        this._index = v;
        this.frameName = this.getNameFromTemplate(v);
    }

    @property
    private _frameName: string = '';
    public get frameName(): string {
        return this._frameName;
    }
    @property({
        tooltip: '按名字，设置对应atlas图集 的 spriteFrame',
        visible: function () { return this.indexMode === false; }
    })
    public set frameName(v: string) {
        let frame = this.spriteAtlas.getSpriteFrame(v);
        // 默认动画帧 不会在运行时判断
        if (!CC_EDITOR && frame == null && this.defaultFrame) {
            frame = this.defaultFrame;
            v = frame.name;
        }
        this.getComponent(cc.Sprite).spriteFrame = frame;
        if (frame) {
            this.node.width = frame.getOriginalSize().width;
            this.node.height = frame.getOriginalSize().height;
        }
        this._frameName = v;

    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    private getNameFromTemplate(index: number) {
        return this.atlasNameTemplate.replace('*', index.toString());
    }

    start() {

    }

    // update (dt) {}
}
