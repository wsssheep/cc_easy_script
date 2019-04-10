// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property, executeInEditMode, menu} = cc._decorator;

/**
 * 强制提升UI的 Z轴顺序
 */
@ccclass
@executeInEditMode
@menu("添加特殊行为/UI/Z INDEX (层级顺序)")
export default class BhvZIndex extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    @property({
        type:cc.Integer,
    })
    zIndex:number = 0;

    onLoad() {
        this.node.zIndex = this.zIndex;
    };

    update (dt) {
        if(CC_EDITOR)this.node.zIndex = this.zIndex;
    };
}

