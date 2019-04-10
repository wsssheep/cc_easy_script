import PlugTableView from "./PlugTableView";


const {ccclass, property} = cc._decorator;

/**
 * 配合 PlugTableView 使用,作为 PlugTableView 的细胞,
 * 请注意, 只能在继承后使用 
 * 通过重载 longClicked \ clicked \ init 函数 调用
 */
@ccclass
export default class PlugTableViewCell extends cc.Component {

   @property({
        visible: false
    })
    tableView:PlugTableView = null;

    @property
    private _isCellInit_:boolean =  false;

    @property
    private _longClicked_:boolean =  false;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    /** 不可以重写 */
    private _cellAddMethodToNode_ () {
        this.node['clicked'] = this.clicked.bind(this);
    }

    private _cellAddTouch_ () {
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            if (this.node.active === true && this.node.opacity !== 0) {
                if (!this._longClicked_) {
                    this._longClicked_ = true;
                    this.scheduleOnce(this._longClicked, 1.5);
                }
            }
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function () {
            if (this._longClicked_) {
                this._longClicked_ = false;
                this.unschedule(this._longClicked);
            }
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            this.clicked();
            if (this._longClicked_) {
                this._longClicked_ = false;
                this.unschedule(this._longClicked);
            }
        }, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function () {
            if (this._longClicked_) {
                this._longClicked_ = false;
                this.unschedule(this._longClicked);
            }
        }, this);
    }

    private _cellInit_(tableView) {
        this.tableView = tableView;
        if (!this._isCellInit_) {
            this._cellAddMethodToNode_();
            this._cellAddTouch_();
            this._isCellInit_ = true;
        }
    }

    private _longClicked() {
        this._longClicked_ = false;
        this.node.emit(cc.Node.EventType.TOUCH_CANCEL);
        this.longClicked();
    }

    /** (可重载) 长按时对应的方法 */
    longClicked() {

    }

    /** (可重载) 被点击时相应的方法  */
    clicked() {

    }

    /**
     * (可重载) 加载需要初始化数据时调用 
     *  ( index, data, reload, group = [] )
     * @param index  cell的排序下标
     * @param data  自定义 初始化 tableView 时传入的data
     * @param reload  当前是否执行的是 tableView.reload() 操作
     * @param group  得到当前组
     */
    init(index:number, data:{array?:Array<any>,target?:any}, reload:boolean, group:[number,number]) {

    }

    // update (dt) {}
}

