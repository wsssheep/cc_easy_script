/*
 * @Author: wss 
 * @Date: 2019-06-22 16:17:23 
 * @Last Modified by: wss
 * @Last Modified time: 2019-11-07 00:55:06
 */


const { ccclass, property, menu, disallowMultiple } = cc._decorator;

//todo 修复按钮双击判断为
//todo 增加配置化参数

const GESTURE_HOLD_TIMEOUT = 0.5;			// 长按点击的时间
const GESTURE_TAP_TIMEOUT = 0.333;		    // 轻触点击的时间
const GESTURE_HOLD_THRESHOLD = 15;		    // 持续按住时，手指允许偏离多少像素(防止手滑误差)
const GESTURE_DOUBLE_TAP_THRESHOLD = 25;	// 轻触双击时，允许两次触摸的坐标偏差
const GESTURE_SWIPE_DISTANCE_MIN = 50;      //滑动超过多少距离才算滑动生效
const GESTURE_SWIPE_TIMEOUT = 0.2;          //滑动超过多少时间算是无效

/**
 * 方向对应枚举值
 */
enum DIRECTION {
    NONE = 0,
    LEFT_DOWN = 1,
    DOWN = 2,
    RIGHT_DOWN = 3,
    LEFT = 4,
    CENTER = 5,
    RIGHT = 6,
    LEFT_UP = 7,
    UP = 8,
    RIGHT_UP = 9,
}

enum TOUCH_EVENT {
    TAP,
    SWIPE,
    HOLD
}

/**
 * 屏幕触摸区域划分
 */
enum SCREEN_DIV_TYPE {
    LEFT_RIGHT,
    LEFT_MIDDLE_RIGHT,
    UP_DOWN,
    UP_MIDDLE_DOWN
}

/**
 * Cocos Touch 输入事件
 * 封装节点touch 事件，让 触摸能够在全局环境中使用
 * 兼容鼠标输入操作方式
 * 
 */
@ccclass
@menu("添加特殊行为/Input/BhvTouchInput (全局鼠标)")
@disallowMultiple
export default class BhvTouchInput extends cc.Component {

    private static _Instance: BhvTouchInput;
    static GetInstance(): BhvTouchInput {
        if (!this._Instance) {
            let canvas = cc.find('Canvas');
            let comp = canvas.getComponent(BhvTouchInput);
            if (comp == null) {
                comp = canvas.addComponent(BhvTouchInput);
            }
            this._Instance = comp;
        }

        return this._Instance;
    }

    /**  获取触摸点的世界坐标 */
    static GetWorldXY(id: number = 0): cc.Vec2 {
        return this.GetInstance().getWorldTouchPos(id);
    }

    /**  获取触摸点的Canvas坐标 */
    static GetCanvasXY(id: number = 0): cc.Vec2 {
        return this.GetInstance().getTouchPos(id);
    }

    /** 返回所占用屏幕的比例 */
    static GetScreenRatio(id: number = 0): cc.Vec2 {
        let pos = this.GetInstance().getTouchPos(id);
        let size = cc.winSize;
        return cc.v2(pos.x / size.width, pos.y / size.height);
    }

    /** 获取触点在 View 内的坐标 */
    static GetViewXY(id: number = 0): cc.Vec2 {
        return this.GetInstance().getTouchPosInView(id);
    }

    /** 触点是否按下 */
    static IsTouch(id: number = 0): boolean {
        return this.GetInstance().isTouch(id);
    }

    
    static AddInputUp(callback: (e: cc.Event.EventTouch) => void, target) {
        this.GetInstance().events.on('TouchStart', callback, target);
    }

    static AddInputDown(callback: (e: cc.Event.EventTouch) => void, target) {
        this.GetInstance().events.on('TouchEnd', callback, target);
    }

    static AddInputTap(callback: (isDouble?: boolean) => void, target) {
        this.GetInstance().events.on('Tap', callback, target);
    }

    static AddInputHold(callback: () => void, target) {
        this.GetInstance().events.on('Hold', callback, target);
    }

    /** 4 方向 的 swipe 监听 (判断容差45度)*/
    static AddInputSwipe(callback: (dir?: DIRECTION, distance?: number, angle?: number) => void, target?) {
        this.GetInstance().events.on('Swipe', callback, target);
    }

    /** 8 方向 的 swipe 监听 (判断容差45度) */
    static AddInputSwipeFull(callback: (dir?: DIRECTION, distance?: number, angle?: number) => void, target?) {
        this.GetInstance().events.on('Swipe', callback, target);
    }

    /**从 Target 目标上移除所有监听事件 */
    static RemoveAllEvents(target) {
        this.GetInstance().events.targetOff(target);
    }

    /**事件目标 */
    private events = new cc.EventTarget();

    /**
     * 监听触摸的节点，这样才能接收到正确的冒泡事件
     */
    @property({
        tooltip: '接受触摸的节点(从对应节点寻找)',
        type: cc.Node
    })
    private listenNode: cc.Node = null;

    @property({
        tooltip: '是否允许 长按触发事件 (略微消耗性能)',
    })
    private allowHold: boolean = true;

    @property({
        tooltip: '测试绘图模式, 可以监控触摸点所在位置',
    })
    private debug: boolean = false;

    private pressure = 0;

    public DIRECTION = DIRECTION;

    private ctrl = {
        left: false,
        right: false,
        up: false,
        down: false,
        middle: false
    }

    private ctx: cc.Graphics;

    /**计时器时间(标记touch 的时间) */
    private timer: number = 0;

    /**记录不同触摸点信息的数组 */
    private touchArray: Array<{
        triggeredHold: boolean,
        isTouch: boolean,
        startTime: number,
        curTime: number,
        lastTapTime: number,
        lastTouchPos: cc.Vec2,
        lastTouchPosInView: cc.Vec2,
        lastTapPos: cc.Vec2
    }> = [];


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        //初始化触摸数据(10点触摸)
        let array = this.touchArray;
        for (let i = 0; i < 10; i++) {
            array.push({
                triggeredHold: false,
                isTouch: false,
                lastTouchPos: cc.v2(0, 0),
                lastTouchPosInView: cc.v2(0, 0),
                startTime: 0,
                curTime: 0,
                lastTapTime: -1000,
                lastTapPos: cc.v2(-1000, -1000)
            })
        }


    }

    start() {

    }

    onEnable() {
        this.bindNode();
    }

    onDisable() {
        this.unbindNode();
    }

    onDestroy() {
        BhvTouchInput._Instance = null;
    }


    /**
     * 将角度(0~360) 转换为 direction ;
     */
    public getAngleDirection4(angle: number): DIRECTION {
        angle = (angle + 360) % 360;
        if (Math.abs(angle - 270) < 45) {
            return DIRECTION.UP;
        } else if (Math.abs(angle - 180) < 45) {
            return DIRECTION.LEFT;
        } else if (Math.abs(angle - 90) < 45) {
            return DIRECTION.DOWN;
        } else {
            return DIRECTION.RIGHT;

        }
    }

    /**
     * 将角度（0~360 ） 转换为 direction
     */
    public getAngleDirection8(angle: number): DIRECTION {
        angle = (angle + 360) % 360;
        if (Math.abs(angle - 315) < 22.5) {
            return DIRECTION.RIGHT_UP;
        } else if (Math.abs(angle - 270) < 22.5) {
            return DIRECTION.UP;
        } else if (Math.abs(angle - 225) < 22.5) {
            return DIRECTION.LEFT_UP;
        } else if (Math.abs(angle - 180) < 22.5) {
            return DIRECTION.LEFT;
        } else if (Math.abs(angle - 135) < 22.5) {
            return DIRECTION.LEFT_DOWN;
        } else if (Math.abs(angle - 90) < 22.5) {
            return DIRECTION.DOWN;
        } else if (Math.abs(angle - 45) < 22.5) {
            return DIRECTION.RIGHT_DOWN;
        } else {
            return DIRECTION.RIGHT;
        }
    }


    /** 绑定触摸时间所在的节点, 一般是绑定UI层 */
    bindNode(node?: cc.Node) {
        if (node == null) {
            node = this.listenNode || this.node || cc.find("Canvas");
        }
        //如果绑定过了节点，那么就先解除原节点的绑定事件

        if (this.listenNode) this.unbindNode();
        this.listenNode = node;
        node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this, true);
        node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this, true);
        node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this, true);

        node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this, true);
        node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this, true);


        cc.view.setResizeCallback(() => {
            this.node.width = cc.view.getCanvasSize().width;
            this.node.height = cc.view.getCanvasSize().height;
        });

    }

    /** 解除绑定触摸事件所在的节点 */
    unbindNode() {
        let node = this.listenNode;
        if (!node.isValid) return;
        node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    /** 检查是否触发 Hold 事件 */
    private checkTriggerHold(id: number, duration: number) {


        let info = this.touchArray[id];

        if (info.triggeredHold) return;// 触发了 trigger hold 以后 不能再触发了

        if (duration >= GESTURE_HOLD_TIMEOUT) {
            info.triggeredHold = true;

        }


    }

    private getTouchId(e: cc.Event.EventTouch){
        if(e.getTouches().length<=1)return 0;
        var id = e.getTouches().findIndex((v) => {
            return v == e.touch;
        });
        return id;
    }

    /**检查是否触发 tap 事件 */
    private checkTriggerTap(e: cc.Event.EventTouch, duration: number) {
        
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        if (info.triggeredHold) return;

        let offsetTimer = duration;
        let touchMag = e.getStartLocation().sub(e.getLocation()).mag();

        if (offsetTimer <= GESTURE_TAP_TIMEOUT && touchMag < GESTURE_HOLD_THRESHOLD) {

            let tapMag = info.lastTapPos.sub(e.getLocation()).mag();
            // 上一次点击的距离和时间范围内:触发二连击
            //todo 双击 double 可能有 bug 存在
            //console.log(offsetTimer,GESTURE_TAP_TIMEOUT);
            if ((offsetTimer <= GESTURE_TAP_TIMEOUT * 2) && tapMag < GESTURE_DOUBLE_TAP_THRESHOLD) {
                //console.log("双击轻触 事件！",e.getID());
                let event = new cc.Event.EventCustom('double-tap-gesture', true);
                this.node.dispatchEvent(event);


                info.lastTapPos = cc.v2(-1000, -1000);
                info.lastTapTime = -10000;
            }
            // Otherwise trigger single tap
            else {
                //console.log("轻触！事件",e.getID());
                let event = new cc.Event.EventCustom('tap-gesture', true);
                this.node.dispatchEvent(event)

                info.lastTapPos = e.getLocation();
                info.lastTapTime = this.timer;
            }


        }
    }

    /** 检查滑动操作 */
    private checkSwipe(e: cc.Event.EventTouch, duration: number) {
        //TODO 检查鼠标滑动 动作
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        let offset = e.getStartLocation().sub(e.getLocation());
        let dis = offset.mag();

        if (dis > GESTURE_SWIPE_DISTANCE_MIN && duration < GESTURE_SWIPE_TIMEOUT) {
            let angle = cc.misc.radiansToDegrees(cc.Vec2.RIGHT.signAngle(offset.normalize()));
            angle = 180 - angle; //调整角度范围到 0~ 360 度

            // cc.log("滑动！事件",id,"距离：",dis,"角度：",this.getAngleDirection8(angle));

            this.events.emit('Swipe', id, this.getAngleDirection4(angle), angle, dis);
            this.events.emit('SwipeFull', id, this.getAngleDirection8(angle), angle, dis);

        }


    }

    /**
     *  检查不同区域范围的点击(以 屏幕为基准)
     *  比如，左右  上下 左中右 上中下
     */
    private checkTouchArea(e: cc.Event.EventTouch) {
        //TODO 检查鼠标在不同区域范围内的点击结果
    }

    private isTouch(id: number = 0): boolean {
        return this.touchArray[id].isTouch;
    }

    private getTouchPos(id: number = 0): cc.Vec2 {
        return this.touchArray[id].lastTouchPos;
    }

    private getTouchPosInView(id: number = 0): cc.Vec2 {
        return this.touchArray[id].lastTouchPosInView;
    }

    private getWorldTouchPos(id: number = 0): cc.Vec2 {
        return this.node.convertToWorldSpaceAR(this.getTouchPos(id));
    }


    private onTouchStart(e: cc.Event.EventTouch) {
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        if (info) {
            info.startTime = this.timer;
            info.curTime = this.timer;
            info.triggeredHold = false;
            info.isTouch = true;
            info.lastTouchPos = e.getLocation()
            info.lastTouchPosInView = e.getLocationInView()
        }

        this.events.emit('TouchStart', e.getID(), e);

    }

    private onTouchMove(e: cc.Event.EventTouch) {
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        if (info) {
            info.curTime = this.timer;
            info.lastTouchPos = e.getLocation()
            info.lastTouchPosInView = e.getLocationInView()

        }
        this.events.emit('TouchMove', e.getID(), e);
    }

    private onTouchEnd(e: cc.Event.EventTouch) {
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        if (info) {
            info.curTime = this.timer;
            info.lastTouchPos = e.getLocation()
            info.lastTouchPosInView = e.getLocationInView()
            let duration = info.curTime - info.startTime;
            //检查是否为 tap
            this.checkTriggerTap(e, duration);
            this.checkSwipe(e, duration);
            info.isTouch = false;
        }
        this.events.emit('TouchEnd', e.getID(), e);
    }

    private onTouchCancel(e: cc.Event.EventTouch) {
        let id = this.getTouchId(e);
        let info = this.touchArray[id];
        if (info) {
            info.curTime = this.timer;
            let duration = info.curTime - info.startTime;
            this.checkSwipe(e, duration);
            info.isTouch = false;
        }
        this.events.emit('TouchEnd', e.getID(), e);
    }

    /**鼠标抬起时 */
    private onMouseUp(e: cc.Event.EventMouse) {

    }

    /**鼠标按下时 */
    private onMouseDown(e: cc.Event.EventMouse) {

    }

    /**鼠标移动时 */
    private onMouseMove(e: cc.Event.EventMouse) {

    }

    /**鼠标滚动时 */
    private onMouseWheel(e: cc.Event.EventMouse) {

    }

    update(dt) {
        this.timer += dt;
        if (this.allowHold) {
            let array = this.touchArray
            array.forEach((e, index) => {
                if (e.isTouch == true) {
                    this.checkTriggerHold(index, this.timer - e.startTime);
                }
            });
        }

    }
}


