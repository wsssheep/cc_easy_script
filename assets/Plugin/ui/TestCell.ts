import PlugTableViewCell from "./PlugTableViewCell";

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
export default class TestCell extends PlugTableViewCell {
     private _target;
     private _data;

     @property(cc.Label)
     private index = null;

     @property(cc.Label)
     private group = null;

    init (index, data, reload, group) {
        if (index >= data.array.length) {
            this.index.string = '越界';
            this.group.string = group.toString();
            return;
        }

        this._target = data.target;
        this._data = data.array[index];
        this.index.string = index;
        this.group.string = group.toString();
    }


    clicked () {
        this._target.show('下标:' + this.index.string + ',组:' + this.group.string);
    }
}
