import  PlugTableView  from "./PlugTableView";

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
export default class NewClass extends cc.Component {

    @property(PlugTableView)
    tableView: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
 
        // use this for initialization
        onLoad () {
        }

        show (text) {
            cc.log(text);
        }

        _getdata (num) {
            var array = [];
            for (var i = 0; i < num; ++i) {
                var obj:any = {};
                obj.name = 'a' + i;
                array.push(obj);
            }
            return array;
        }

        initView () {
            var data = this._getdata(50);
            this.tableView.getComponent(PlugTableView).initTableView(data.length, { array: data, target: this });
        }

        //下一页(pageview下有效)
        nextPage () {
            this.tableView.getComponent(PlugTableView).scrollToNextPage();
        }

        //上一页(pageview下有效)
        lastPage () {
            this.tableView.getComponent(PlugTableView).scrollToLastPage();
        }
 
    
}
