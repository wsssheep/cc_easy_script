import PlugTableViewCell from "./PlugTableViewCell";

const { ccclass, property, help, menu } = cc._decorator;

enum ScrollModel { Horizontal, Vertical};
enum ScrollDirection { None, Up , Down , Left , Right  };
enum Direction { LEFT_TO_RIGHT__TOP_TO_BOTTOM , TOP_TO_BOTTOM__LEFT_TO_RIGHT  };
enum ViewType { Scroll, Flip };



/**
 * TableView 基于 a1076559139/creator_tableView 
 * 改进默认的ScrollView , 利用对象池进行高效回收的方式
 */
@ccclass
@menu("添加 UI 组件/tableView(自定义)")
@help('https://github.com/a1076559139/creator_tableView')
export default class PlugTableView extends cc.ScrollView {
    /**缓存的数据*/
    private _data:{array?:Array<any>,target?:any} = null;

    /**cell的最小下标*/
    private _minCellIndex = 0;

    /**cell的最大下标*/
    private _maxCellIndex = 0;
    private _paramCount = 0;

    /**一共有多少节点*/
    private _count = 0;

    /**scroll下有多少节点*/
    private _cellCount = 0;

    /**scroll一个屏幕能显示多少节点*/
    private _showCellCount = 0;

    /**
     * GRID模式下，对cell进行分组管理
     * 每组有几个节点
     */
    private _groupCellCount = null

    private _scrollDirection = null

    private _cellPool = null
    
    /**回避冲突, 和 继承对象的 _view 冲突了 */
    private __view = null

    /** 当前处于那一页  */
    private _page = 0;
    /** 总共有多少页 */
    private _pageTotal = 0;

    private _lastOffset:cc.Vec2 = cc.v2(0,0);

    private _cellSize:cc.Size = cc.size(64,64);

    private _touchMoved:boolean = false;

  
    @property({
        type: cc.Prefab,
    })
    cell: cc.Prefab = null;


    @property({
        type: cc.Enum(ScrollModel),
        tooltip: '横向纵向滑动, Horizontal - 水平, Vertical- 垂直 ',
    })
    get ScrollModel():ScrollModel{
        return this._ScrollModel;
    }
    set ScrollModel(type:ScrollModel){
            if (type === ScrollModel.Horizontal) {
                this.horizontal = true;
                this.vertical = false;
                this.verticalScrollBar = null;
            } else {
                this.vertical = true;
                this.horizontal = false;
                this.horizontalScrollBar = null;
            }
            this._ScrollModel = type;
    }
    @property()
    private _ScrollModel:ScrollModel = ScrollModel.Horizontal;


    @property({
        type: cc.Enum(ViewType),
        tooltip: '为Scroll时,不做解释\n为 Flipw 时，在Scroll的基础上增加翻页的行为',
    })
    get ViewType():ViewType{
        return this._ViewType;
    }
    set ViewType(type:ViewType){
        if (this._ViewType === ViewType.Flip) {
            this.inertia = false;
        } else {
            this.inertia = true;
        }
        this._ViewType = type;
    }
    @property()
    private _ViewType:ViewType = ViewType.Scroll;



    @property({
        tooltip: '当节点不能铺满一页时，选择 isFill 为 true 会填充节点铺满整个 view',
    })
    isFill: boolean = false;

    @property({
        type: cc.Enum(Direction),
        tooltip: '规定cell的排列方向',
    })
    Direction: Direction = Direction.LEFT_TO_RIGHT__TOP_TO_BOTTOM;

    @property({
        type: cc.Component.EventHandler,
        tooltip: '仅当ViewType为pageView时有效，初始化或翻页时触发回调，向回调传入两个参数，参数一为当前处于哪一页，参数二为一共多少页',
    })
    pageChangeEvents: Array<cc.Component.EventHandler> = [];


    /**对象池缓存 */
    static _cellPoolCache = {}

    onLoad() {
        let self = this;
        PlugTableView._tableView.push(this);

        //当销毁tableView的时候，回收cell
        let destroy = this.node.destroy;
        this.node.destroy = function () {
            self.clear();
            return destroy.call(self.node);
        }

        let _onPreDestroy = this.node['_onPreDestroy'];
        this.node['_onPreDestroy'] = function () {
            self.clear();
            _onPreDestroy.call(self.node);
        }


    }

    onDestroy() {
        for (let key in PlugTableView._tableView) {
            if (PlugTableView._tableView[key] === this) {
                PlugTableView._tableView.splice(parseInt(key));
                return;
            }
        }
    }

    //初始化cell
    private _initCell(cell:cc.Node|any, reload?:boolean) {
        if ((this.ScrollModel === ScrollModel.Horizontal && this.Direction === Direction.TOP_TO_BOTTOM__LEFT_TO_RIGHT) || (this.ScrollModel === ScrollModel.Vertical && this.Direction === Direction.LEFT_TO_RIGHT__TOP_TO_BOTTOM)) {
            let tag = cell._cellIndex * cell.childrenCount;
            for (let index = 0; index < cell.childrenCount; ++index) {
                let node = cell.children[index];
                let viewCell = node.getComponent(PlugTableViewCell);
                if (viewCell) {
                    viewCell._cellInit_(this);
                    viewCell.init(tag + index, this._data, reload, [cell._cellIndex, index]);
                }
            }
        } else {
            if (this.ViewType === ViewType.Flip) {
                let tag = Math.floor(cell._cellIndex / this._showCellCount);
                let tagnum = tag * this._showCellCount * cell.childrenCount;
                for (let index = 0; index < cell.childrenCount; ++index) {
                    let node = cell.children[index];
                    let viewCell = node.getComponent(PlugTableViewCell);
                    if (viewCell) {
                        viewCell._cellInit_(this);
                        viewCell.init(this._showCellCount * index + cell._cellIndex % this._showCellCount + tagnum, this._data, reload, [index + tag * cell.childrenCount, index]);
                    }
                }
            } else {
                for (let index = 0; index < cell.childrenCount; ++index) {
                    let node = cell.children[index];
                    let viewCell = node.getComponent(PlugTableViewCell);
                    if (viewCell) {
                        viewCell._cellInit_(this);
                        viewCell.init(index * this._count + cell._cellIndex, this._data, reload, [index, index]);
                    }
                }
            }
        }
    }

    //设置cell的位置
    private _setCellPosition(node:cc.Node, index:number) {
        if (this.ScrollModel === ScrollModel.Horizontal) {
            if (index === 0) {
                node.x = -this.content.width * this.content.anchorX + node.width * node.anchorX;
            } else {
                node.x = getChildByCellIndex(this.content, index - 1).x + node.width;
            }
            node.y = (node.anchorY - this.content.anchorY) * node.height;
        } else {
            if (index === 0) {
                node.y = this.content.height * (1 - this.content.anchorY) - node.height * (1 - node.anchorY);
            } else {
                node.y = getChildByCellIndex(this.content, index - 1).y - node.height;
            }
            node.x = (node.anchorX - this.content.anchorX) * node.width;
        }
    }

    private _addCell(index:number) {
        let cell = this._getCell();
        this._setCellAttr(cell, index);
        this._setCellPosition(cell, index);
        cell.setParent(this.content);
        this._initCell(cell);
    }

    private _setCellAttr(cell:cc.Node|any, index:number) {
        cell.setSiblingIndex(index >= cell._cellIndex ? this._cellCount : 0);
        cell._cellIndex = index;
    }

    private _addCellsToView() {
        for (let index = 0; index <= this._maxCellIndex; ++index) {
            this._addCell(index);
        }
    }

    private _getCell() {
        
        if (this._cellPool.size() === 0) {
            let cell = cc.instantiate(this.cell);
            
            let node = new cc.Node();
            node.anchorX = 0.5;
            node.anchorY = 0.5;

            let length = 0;

            if (this.ScrollModel === ScrollModel.Horizontal) {
                node.width = cell.width;
                let cellHeight = cell.height||64; //不能为0
                let childrenCount = Math.floor((this.content.height) / (cellHeight));
                node.height = this.content.height;

                for (let index = 0; index < childrenCount; ++index) {
                    if (!cell) {
                        cell = cc.instantiate(this.cell);
                    }
                    cell.x = (cell.anchorX - 0.5) * cell.width;
                    cell.y = node.height / 2 - cell.height * (1 - cell.anchorY) - length;
                    length += cell.height;
                    cell.setParent(node);
                    cell = null;
                }
            } else {
                node.height = cell.height;
                let cellWidth = cell.width||64; //不能为0
                let childrenCount = Math.floor((this.content.width) / (cellWidth));
                node.width = this.content.width;

                for (let index = 0; index < childrenCount; ++index) {
                    if (!cell) {
                        cell = cc.instantiate(this.cell);
                    }
                    cell.y = (cell.anchorY - 0.5) * cell.height;
                    cell.x = -node.width / 2 + cell.width * cell.anchorX + length;
                    length += cell.width;
                    cell.setParent(node);
                    cell = null;
                }
            }

            this._cellPool.put(node);
        }
        let cell = this._cellPool.get();
        return cell;
    }

    private _getCellSize() {
        let cell = this._getCell();
        let cellSize = cell.getContentSize();
        this._cellPool.put(cell);
        return cellSize;
    }

    private _getGroupCellCount() {
        let cell = this._getCell();
        let groupCellCount = cell.childrenCount;
        this._cellPool.put(cell);
        return groupCellCount;
    }

    /**
     * 清空回收当前tableView
     */
    clear() {
        for (let index = this.content.childrenCount - 1; index >= 0; --index) {
            this._cellPool.put(this.content.children[index]);
        }
        this._cellCount = 0;
        this._showCellCount = 0;
    }

    /**
     * 重载数据
     * @param data 
     */
    reload(data:{/**数据数组*/array?:Array<any>, /**目标对象*/target?:any}) {
        if (data !== undefined) {
            this._data = data;
        }
        for (let index = this.content.childrenCount - 1; index >= 0; --index) {
            this._initCell(this.content.children[index], true);
        }
    }

    private _getCellPoolCacheName():string {
        if (this.ScrollModel === ScrollModel.Horizontal) {
            return this.cell.name + 'h' + this.content.height;
        } else {
            return this.cell.name + 'w' + this.content.width;
        }
    }

    private _initTableView() {
        if (this._cellPool) {
            this.clear();
        }

        let name = this._getCellPoolCacheName();
        if (!PlugTableView._cellPoolCache[name]) {
            PlugTableView._cellPoolCache[name] = new cc.NodePool(PlugTableViewCell);
        }
        this._cellPool = PlugTableView._cellPoolCache[name];
    
         this._cellSize = this._getCellSize();
        this._groupCellCount = this._getGroupCellCount();
   
        this._count = Math.ceil(this._paramCount / this._groupCellCount);

        if (this.ScrollModel === ScrollModel.Horizontal) {
            this.__view.width = this.node.width;
            this.__view.x = (this.__view.anchorX - this.node.anchorX) * this.__view.width;

            this._cellCount = Math.ceil(this.__view.width / this._cellSize.width) + 1;
            if (this.ViewType === ViewType.Flip) {
                if (this._cellCount > this._count) {
                    if (this.isFill) {
                        this._cellCount = Math.floor(this.__view.width / this._cellSize.width);
                    } else {
                        this._cellCount = this._count;
                    }
                    this._showCellCount = this._cellCount;
                    this._pageTotal = 1;
                } else {
                    this._pageTotal = Math.ceil(this._count / (this._cellCount - 1));
                    this._count = this._pageTotal * (this._cellCount - 1);
                    this._showCellCount = this._cellCount - 1;
                }
            } else {
                if (this._cellCount > this._count) {
                    if (this.isFill) {
                        this._cellCount = Math.floor(this.__view.width / this._cellSize.width);
                    } else {
                        this._cellCount = this._count;
                    }
                    this._showCellCount = this._cellCount;
                } else {
                    this._showCellCount = this._cellCount - 1;
                }
            }

            this.content.width = this._count * this._cellSize.width;
            // if (this.content.width <= this.__view.width) {
            //     this.content.width = this.__view.width + 1;
            // }

            //停止_scrollView滚动
            this.stopAutoScroll();
            this.scrollToLeft();
            
        } else {
            this.__view.height = this.node.height;
            this.__view.y = (this.__view.anchorY - this.node.anchorY) * this.__view.height;

            this._cellCount = Math.ceil(this.__view.height / this._cellSize.height) + 1;
            if (this.ViewType === ViewType.Flip) {
                if (this._cellCount > this._count) {
                    if (this.isFill) {
                        this._cellCount = Math.floor(this.__view.height / this._cellSize.height);
                    } else {
                        this._cellCount = this._count;
                    }
                    this._showCellCount = this._cellCount;
                    this._pageTotal = 1;
                } else {
                    this._pageTotal = Math.ceil(this._count / (this._cellCount - 1));
                    this._count = this._pageTotal * (this._cellCount - 1);
                    this._showCellCount = this._cellCount - 1;
                }
            } else {
                if (this._cellCount > this._count) {
                    if (this.isFill) {
                        this._cellCount = Math.floor(this.__view.height / this._cellSize.height);
                    } else {
                        this._cellCount = this._count;
                    }
                    this._showCellCount = this._cellCount;
                } else {
                    this._showCellCount = this._cellCount - 1;
                }
            }

            this.content.height = this._count * this._cellSize.height;
            // if (this.content.height <= this.__view.height) {
            //     this.content.height = this.__view.height + 1;
            // }

            //停止_scrollView滚动
            this.stopAutoScroll();
            this.scrollToTop();
        }

        this._changePageNum(1 - this._page);

        this._lastOffset = this.getScrollOffset();
        this._minCellIndex = 0;
        this._maxCellIndex = this._cellCount - 1;

        this._addCellsToView();
    }


    /**
     * 初始化 Table
     * @param paramCount - count:cell的总个数 
     * @param data - data:要向cell传递的数据
     */
    initTableView(paramCount:number, data:any) {
        this._paramCount = paramCount;
        this._data = data;
        if (this.ScrollModel === ScrollModel.Horizontal) {
            this.horizontal = true;
            this.vertical = false;
        } else {
            this.vertical = true;
            this.horizontal = false;
        }
        this.__view = this.content.getParent();

        //为scrollBar添加size改变的监听
        this.verticalScrollBar && this.verticalScrollBar.node.on('size-changed', function () {
            this._updateScrollBar(this._getHowMuchOutOfBoundary());
        }, this);

        this.horizontalScrollBar && this.horizontalScrollBar.node.on('size-changed', function () {
            this._updateScrollBar(this._getHowMuchOutOfBoundary());
        }, this);

        if (this.node.getComponent(cc.Widget)) {
            this.node.getComponent(cc.Widget).updateAlignment();
        }

        this._initTableView();
    }


    //*************************************************重写ScrollView方法*************************************************//
    // touch event handler
    _onTouchBegan(event, captureListeners) {
        super['_onTouchBegan'](event, captureListeners);
        this._touchstart(event);
    }

    _onTouchMoved(event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        if (this['_hasNestedViewGroup'](event, captureListeners)) return;
        let touch = event.touch;
        if (this.content) {
            this['_handleMoveLogic'](touch);
        }
        // Do not prevent touch events in inner nodes
        if (!this.cancelInnerEvents) {
            return;
        }

        let deltaMove = pSub(touch.getLocation(), touch.getStartLocation());
        //FIXME: touch move delta should be calculated by DPI.
        if (deltaMove.mag() > 7) {
            if (!this._touchMoved && event.target !== this.node) {
                // Simulate touch cancel for target node
                let cancelEvent = new cc.Event.EventTouch(event.getTouches(), event.bubbles);
                cancelEvent.type = cc.Node.EventType.TOUCH_CANCEL;
                cancelEvent.touch = event.touch;
                //cancelEvent.simulate = true;
                //event.target.dispatchEvent(cancelEvent);
                event.target.emit(cc.Node.EventType.TOUCH_CANCEL, cancelEvent);
                this._touchMoved = true;
            }
        }
        this['_stopPropagationIfTargetIsMe'](event);

        this._touchmove(event);
    }

    _onTouchEnded(event, captureListeners) {
        super['_onTouchEnded'](event, captureListeners);
        this._touchend(event);
    }

    _onTouchCancelled(event, captureListeners) {
        super['_onTouchCancelled'](event, captureListeners);
        this._touchend(event);
    }

    stopAutoScroll() {
        this._scrollDirection = ScrollDirection.None;
        super.stopAutoScroll();
    }

    scrollToBottom(timeInSecond?, attenuated?) {
        this._scrollDirection = ScrollDirection.Up;
        super.scrollToBottom(timeInSecond, attenuated)
    }

    scrollToTop(timeInSecond?, attenuated?) {
        this._scrollDirection = ScrollDirection.Down;
        super.scrollToTop(timeInSecond, attenuated)
    }

    scrollToLeft(timeInSecond?, attenuated?) {
        this._scrollDirection = ScrollDirection.Right;
        super.scrollToLeft(timeInSecond, attenuated)
    }

    scrollToRight(timeInSecond?, attenuated?) {
        this._scrollDirection = ScrollDirection.Left;
        super.scrollToRight(timeInSecond, attenuated)
    }

    scrollToOffset(offset, timeInSecond?, attenuated?) {
        let nowOffset = this.getScrollOffset();
        let p = pSub(offset, nowOffset);
        if (this.ScrollModel === ScrollModel.Horizontal) {
            if (p.x > 0) {
                this._scrollDirection = ScrollDirection.Left;
            } else if (p.x < 0) {
                this._scrollDirection = ScrollDirection.Right;
            }
        } else {
            if (p.y > 0) {
                this._scrollDirection = ScrollDirection.Up;
            } else if (p.y < 0) {
                this._scrollDirection = ScrollDirection.Down;
            }
        }

        super.scrollToOffset(offset, timeInSecond, attenuated)
    }

    //*******************************************************END*********************************************************//


    /**
     * 添加滚动回调
     * @param target  目标节点
     * @param component 组件
     * @param handler  方法名
     */
    addScrollEvent(target:cc.Node, component:string, handler:string) {
        let eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        this.scrollEvents.push(eventHandler);
    }

    /**
     * 添加滚动回调
     * @param target  目标节点
     * @param component 组件
     * @param handler  方法名
     */
    removeScrollEvent(target:cc.Node) {
        for (let key in this.scrollEvents) {
            let eventHandler = this.scrollEvents[key]
            if (eventHandler.target === target) {
                this.scrollEvents.splice(parseInt(key), 1);
                return;
            }
        }
    }

    /** 清除滚动回调列表 */
    clearScrollEvent() {
        this.scrollEvents = [];
    }

    /**
     * 添加翻页回调
     * @param target  目标节点
     * @param component 组件
     * @param handler  方法名
     */
    addPageEvent(target:cc.Node, component:string, handler:string) {
        let eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        this.pageChangeEvents.push(eventHandler);
    }

    /**
     * 移除翻页回调
     * @param target  目标节点
     */
    removePageEvent(target:cc.Node) {
        for (let key = 0; key < this.pageChangeEvents.length; key++) {
            let eventHandler = this.pageChangeEvents[key]
            if (eventHandler.target === target) {
                this.pageChangeEvents.splice(key, 1);
                return;
            }
        }
    }

    /** 清空翻页回调列表  */
    clearPageEvent() {
        this.pageChangeEvents = [];
    }

    /**滚动到上一页 */
    scrollToNextPage() {
        this.scrollToPage(this._page + 1);
    }

    /**滚动到下一页 */
    scrollToLastPage() {
        this.scrollToPage(this._page - 1);
    }

    /** 滚动到某一页 */
    scrollToPage(page:number) {
        if (this.ViewType !== ViewType.Flip || page === this._page) {
            return;
        }

        if (page < 1 || page > this._pageTotal) {
            return;
        }

        let time = 0.3 * Math.abs(page - this._page);

        this._changePageNum(page - this._page);

        let x = this.__view.width;
        let y = this.__view.height;
        x = (this._page - 1) * x;
        y = (this._page - 1) * y;
        this.scrollToOffset({ x: x, y: y }, time);
    }

    /**
     * 获取cells - 获得目前正在展示的所有cell,将以数组的形式作为回掉的参数传递
     * @param callback - 回调函数，返回 cells 组 
     */
    getCells(callback:(cells:Array<cc.Node>)=>any) {
        let cells = [];
        let nodes = quickSort(this.content.children, function (a, b) {
            return a._cellIndex < b._cellIndex;
        });
        for (let key in nodes) {
            let node = nodes[key];
            for (let k in node.children) {
                cells.push(node.children[k]);
            }
        }
        callback(cells);
    }

    /** 获得初始初始化tableView时传递的数据 */
    getData() {
        return this._data;
    }

    /**
     * 获得目前正在展示的行或列范围,将以数组的形式作为回掉的参数传递
     * @param callback - 回调函数，返回 cells 组 
     */
    getGroupsRange(callback:(cells:Array<cc.Node>)=>any) {
        let arr = [];
        for (let i = this._minCellIndex; i <= this._maxCellIndex; i++) {
            arr.push(i);
        }
        callback(arr);
    }

    private _changePageNum(num:number) {
        this._page += num;

        if (this._page <= 0) {
            this._page = 1;
        } else if (this._page > this._pageTotal) {
            this._page = this._pageTotal;
        }

        for (let key = 0; key < this.pageChangeEvents.length; key++) {
            let event = this.pageChangeEvents[key];
            event.emit([this._page, this._pageTotal]);
        }
    }

    private _touchstart(event) {
        if (this.ScrollModel === ScrollModel.Horizontal) {
            this.horizontal = false;
        } else {
            this.vertical = false;
        }
    }

    private _touchmove(event) {
        if (this.horizontal === this.vertical) {
            let startL = event.getStartLocation();
            let l = event.getLocation();
            if (this.ScrollModel === ScrollModel.Horizontal) {
                if (Math.abs(l.x - startL.x) <= 7) {
                    return;
                }
            } else {
                if (Math.abs(l.y - startL.y) <= 7) {
                    return;
                }
            }

            if (this.ScrollModel === ScrollModel.Horizontal) {
                this.horizontal = true;
            } else {
                this.vertical = true;
            }
        }
    }

    private _touchend(event) {
        if (this.ScrollModel === ScrollModel.Horizontal) {
            this.horizontal = true;
        } else {
            this.vertical = true;
        }

        if (this.ViewType === ViewType.Flip && this._pageTotal > 1) {
            this._pageMove(event);
        }

        // this._ckickCell(event);
    }

    // _ckickCell: function (event) {
    //     let srartp = event.getStartLocation();
    //     let p = event.getLocation();

    //     if (this.ScrollModel === ScrollModel.Horizontal) {
    //         if (Math.abs(p.x - srartp.x) > 7) {
    //             return;
    //         }
    //     } else {
    //         if (Math.abs(p.y - srartp.y) > 7) {
    //             return;
    //         }
    //     }

    //     let convertp = this.content.convertToNodeSpaceAR(p);
    //     for (let key in this.content.children) {
    //         let node = this.content.children[key];
    //         let nodebox = node.getBoundingBox();
    //         if (nodebox.contains(convertp)) {
    //             convertp = node.convertToNodeSpaceAR(p);
    //             for (let k in node.children) {
    //                 let cell = node.children[k]
    //                 let cellbox = cell.getBoundingBox();
    //                 if (cellbox.contains(convertp)) {
    //                     if (cell.activeInHierarchy && cell.opacity !== 0) {
    //                         cell.clicked();
    //                     }
    //                     return;
    //                 }
    //             }
    //             return;
    //         }
    //     }
    // },


    //移动距离小于25%则不翻页
    private _pageMove(event) {
        let x = this.__view.width;
        let y = this.__view.height;

        if (this.ViewType === ViewType.Flip) {
            let offset = this.getScrollOffset();
            let offsetMax = this.getMaxScrollOffset();

            if (this.ScrollModel === ScrollModel.Horizontal) {
                if (offset.x >= 0 || offset.x <= -offsetMax.x) {
                    return;
                }
                y = 0;
                if (Math.abs(event.getLocation().x - event.getStartLocation().x) > this.__view.width / 4) {
                    if (this._scrollDirection === ScrollDirection.Left) {
                        if (this._page < this._pageTotal) {
                            this._changePageNum(1);
                        } else {
                            return;
                        }
                    } else if (this._scrollDirection === ScrollDirection.Right) {
                        if (this._page > 1) {
                            this._changePageNum(-1);
                        } else {
                            return;
                        }
                    }
                }
            } else {
                if (offset.y >= offsetMax.y || offset.y <= 0) {
                    return;
                }
                x = 0;
                if (Math.abs(event.getLocation().y - event.getStartLocation().y) > this.__view.height / 4) {
                    if (this._scrollDirection === ScrollDirection.Up) {
                        if (this._page < this._pageTotal) {
                            this._changePageNum(1);
                        } else {
                            return;
                        }
                    } else if (this._scrollDirection === ScrollDirection.Down) {
                        if (this._page > 1) {
                            this._changePageNum(-1);
                        } else {
                            return;
                        }
                    }
                }
            }

            x = (this._page - 1) * x;
            y = (this._page - 1) * y;

            this.scrollToOffset({ x: x, y: y }, 0.3);
        }
    }

    private _getBoundingBoxToWorld(node) {
        let p = node.convertToWorldSpace(cc.v2(0, 0));
        return cc.rect(p.x, p.y, node.width, node.height);
    }


    private _updateCells() {
        if (this.ScrollModel === ScrollModel.Horizontal) {
            if (this._scrollDirection === ScrollDirection.Left) {
                if (this._maxCellIndex < this._count - 1) {
                    let viewBox = this._getBoundingBoxToWorld(this.__view);
                    do {
                        let node = getChildByCellIndex(this.content, this._minCellIndex);
                        let nodeBox = this._getBoundingBoxToWorld(node);

                        if (nodeBox.xMax <= viewBox.xMin) {
                            node.x = getChildByCellIndex(this.content, this._maxCellIndex).x + node.width;
                            this._minCellIndex++;
                            this._maxCellIndex++;
                            if (nodeBox.xMax + (this._maxCellIndex - this._minCellIndex + 1) * node.width > viewBox.xMin) {
                                this._setCellAttr(node, this._maxCellIndex);
                                this._initCell(node);
                            }
                        } else {
                            break;
                        }
                    } while (this._maxCellIndex !== this._count - 1);
                }

            } else if (this._scrollDirection === ScrollDirection.Right) {
                if (this._minCellIndex > 0) {
                    let viewBox = this._getBoundingBoxToWorld(this.__view);
                    do {
                        let node = getChildByCellIndex(this.content, this._maxCellIndex);
                        let nodeBox = this._getBoundingBoxToWorld(node);

                        if (nodeBox.xMin >= viewBox.xMax) {
                            node.x = getChildByCellIndex(this.content, this._minCellIndex).x - node.width;
                            this._minCellIndex--;
                            this._maxCellIndex--;
                            if (nodeBox.xMin - (this._maxCellIndex - this._minCellIndex + 1) * node.width < viewBox.xMax) {
                                this._setCellAttr(node, this._minCellIndex);
                                this._initCell(node);
                            }
                        } else {
                            break;
                        }
                    } while (this._minCellIndex !== 0);
                }
            }
        } else {
            if (this._scrollDirection === ScrollDirection.Up) {
                if (this._maxCellIndex < this._count - 1) {
                    let viewBox = this._getBoundingBoxToWorld(this.__view);
                    do {
                        let node = getChildByCellIndex(this.content, this._minCellIndex);
                        let nodeBox = this._getBoundingBoxToWorld(node);

                        if (nodeBox.yMin >= viewBox.yMax) {
                            node.y = getChildByCellIndex(this.content, this._maxCellIndex).y - node.height;
                            this._minCellIndex++;
                            this._maxCellIndex++;
                            if (nodeBox.yMin - (this._maxCellIndex - this._minCellIndex + 1) * node.height < viewBox.yMax) {
                                this._setCellAttr(node, this._maxCellIndex);
                                this._initCell(node);
                            }
                        } else {
                            break;
                        }
                    } while (this._maxCellIndex !== this._count - 1);
                }
            } else if (this._scrollDirection === ScrollDirection.Down) {
                if (this._minCellIndex > 0) {
                    let viewBox = this._getBoundingBoxToWorld(this.__view);
                    do {
                        let node = getChildByCellIndex(this.content, this._maxCellIndex);
                        let nodeBox = this._getBoundingBoxToWorld(node);

                        if (nodeBox.yMax <= viewBox.yMin) {
                            node.y = getChildByCellIndex(this.content, this._minCellIndex).y + node.height;
                            this._minCellIndex--;
                            this._maxCellIndex--;
                            if (nodeBox.yMax + (this._maxCellIndex - this._minCellIndex + 1) * node.width > viewBox.yMin) {
                                this._setCellAttr(node, this._minCellIndex);
                                this._initCell(node);
                            }
                        } else {
                            break;
                        }
                    } while (this._minCellIndex !== 0);

                }
            }
        }
    }

    private _getScrollDirection() {
        let offset = this.getScrollOffset();

        let lastOffset = this._lastOffset;
        this._lastOffset = offset;
        offset = pSub(offset, lastOffset);

        if (this.ScrollModel === ScrollModel.Horizontal) {
            if (offset.x > 0) {
                this._scrollDirection = ScrollDirection.Right;
            } else if (offset.x < 0) {
                this._scrollDirection = ScrollDirection.Left;
            } else {
                this._scrollDirection = ScrollDirection.None;
            }
        } else {
            if (offset.y < 0) {

                this._scrollDirection = ScrollDirection.Down;
            } else if (offset.y > 0) {
                this._scrollDirection = ScrollDirection.Up;
            } else {
                this._scrollDirection = ScrollDirection.None;
            }
        }
    }

    // called every frame, uncomment this function to activate update callback
    update(dt) {
        super.update(dt);

        if (this._cellCount === this._showCellCount || this._pageTotal === 1) {
            return;
        }
        this._getScrollDirection();
        this._updateCells();
    }


    static _tableView = [];


    /** 刷新当前有效的所有tableView */
    static reload() {
        for (let key in PlugTableView._tableView) {
            PlugTableView._tableView[key].reload();
        }
    }

    /**清空回收当前有效的所有tableView */
    static clear() {
        for (let key in PlugTableView._tableView) {
            PlugTableView._tableView[key].clear();
        }
    }

}


function pSub(t, e) {
    return cc.v2(t.x - e.x, t.y - e.y)
}

function quickSort(arr, cb) {
    //如果数组<=1,则直接返回
    if (arr.length <= 1) { return arr; }
    let pivotIndex = Math.floor(arr.length / 2);
    //找基准
    let pivot = arr[pivotIndex];
    //定义左右数组
    let left = [];
    let right = [];

    //比基准小的放在left，比基准大的放在right
    for (let i = 0; i < arr.length; i++) {
        if (i !== pivotIndex) {
            if (cb) {
                if (cb(arr[i], pivot)) {
                    left.push(arr[i]);
                } else {
                    right.push(arr[i]);
                }
            } else {
                if (arr[i] <= pivot) {
                    left.push(arr[i]);
                } else {
                    right.push(arr[i]);
                }
            }
        }
    }
    //递归
    return quickSort(left, cb).concat([pivot], quickSort(right, cb));
}

function getChildByCellIndex(parent, index) {
    for (let i = 0, c = parent.children, n = c.length; i < n; i++) {
        if (c[i]._cellIndex === index) {
            return c[i];
        }
    }
    return null;
}