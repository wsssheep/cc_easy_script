// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class BhvChess extends cc.Component {


  
    private _uid;//禁止修改  
    public get uid() : number {
        return this._uid;
    }
    
    board = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    /**设置棋子所属的棋盘 */
    setBoard(boardComp){

    }

    //棋子被放在棋盘
    onAddToBoard(){

    }

    //棋子被移出棋盘
    onRemoveFromBoard(){

    }


    onDestroy(){
        //todo 需要手动从 ChessBank 中移出
    }

    // update (dt) {}
}
