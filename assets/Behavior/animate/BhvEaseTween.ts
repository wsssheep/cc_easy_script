/*
 * @Author: wss
 * @Date: 2019-06-22 15:21:00
 * @LastEditTime: 2019-12-11 10:56:53
 * @LastEditors: wss
 */
import { EASE_TYPE, TweenConfig  } from './commonTween';

const { ccclass, property, menu } = cc._decorator;

enum PLAYBACK_MODE {
    ONCE,
    LOOP,
    PING_PONG,
    PING_PONG_LOOP,
    ONCE_DESTROY,
}


enum TWEEN_PROPERTY {
    ROTATION,//0
    OPACITY,//1
    SCALE,//2
    POSITION,//3
    SCALE_XY,//4
    SKEW_XY,//5
    COLOR,//6
}

/**
 * 执行顺序
 */
enum TWEEN_DIRECTION {
    /**从目标位置 tween 到当前位置 */
    FROM,
    /**从当前位置 tween 到目标位置 */
    TO,
    /**从自定义的初始位置,tween 到目标位置 */
    CUSTOM
}

/**
 * EaseTween [v0.0.1]
 */
@ccclass
@menu('添加特殊行为/Animate/Ease Tween(缓动动画)')
export default class BhvEaseTween extends cc.Component {

    @property
    activeOnStart: boolean = false;

    @property
    relativeMode: boolean = false;//相对坐标模式

    @property({
        type: cc.Enum(TWEEN_DIRECTION),
        tooltip: 'FROM:从目标位置飞过来,TO:从目标位置飞过去, CUSTOM:强制指定坐标'
    })
    tweenOrder: TWEEN_DIRECTION = TWEEN_DIRECTION.TO;

    @property({
        type: cc.Enum(TWEEN_PROPERTY)
    })
    tweenProperty: TWEEN_PROPERTY = TWEEN_PROPERTY.SCALE;

    @property({
        type: cc.Enum(EASE_TYPE)
    })
    easeType: EASE_TYPE = EASE_TYPE.SineInOut;

    @property({
        visible: function () { return this.tweenProperty <= 2 && this.tweenOrder === TWEEN_DIRECTION.CUSTOM }
    })
    initial: number = 0;

    @property({
        visible: function () { return this.tweenProperty >= 3 && this.tweenProperty <= 5 && this.tweenOrder === TWEEN_DIRECTION.CUSTOM }
    })
    initialPos: cc.Vec2 = cc.v2(100, 100);

    @property({
        visible: function () { return this.tweenProperty === TWEEN_PROPERTY.COLOR && this.tweenOrder === TWEEN_DIRECTION.CUSTOM }
    })
    initialColor: cc.Color = cc.color(255, 255, 255);



    @property({
        visible: function () { return this.tweenProperty <= 2 }
    })
    target: number = 0;

    @property({
        visible: function () { return this.tweenProperty >= 3 && this.tweenProperty <= 5 }
    })
    targetPos: cc.Vec2 = cc.v2(100, 100);

    @property({
        visible: function () { return this.tweenProperty === TWEEN_PROPERTY.COLOR }
    })
    targetColor: cc.Color = cc.color(255, 255, 255);

    @property
    duration: number = 1.0;

    @property
    wait: cc.Vec2 = cc.v2(0, 0);

    @property({
        type: cc.Enum(PLAYBACK_MODE)
    })
    playback: PLAYBACK_MODE = PLAYBACK_MODE.ONCE;

    @property
    actionTag: number = 0; //动作标签序号，注意区分

    @property({
        type:[cc.Component.EventHandler],
        tooltip:'tween中间停顿的时候播放的事件',
        visible:function(){return this.playback === PLAYBACK_MODE.PING_PONG||this.playback === PLAYBACK_MODE.PING_PONG_LOOP}
    })
    waitEvents: cc.Component.EventHandler[] = [];

    @property({
        type:[cc.Component.EventHandler],
        tooltip:'tween 结束时触发的事件'
    })
    finishedEvents: cc.Component.EventHandler[] = [];



    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        //加载完成后，初始化值，设置初始位置
        this.initValues();
    }

    start() {
        if (this.activeOnStart) {
            this.tweenStart();
        }
    }

    //设置或记录初始位置
    private initValues() {
        //覆盖初始值，将初始属性设置为 initial 属性
        switch (this.tweenOrder) {
            case TWEEN_DIRECTION.CUSTOM:
                //CUSTOM: 从初始值 移动到 目标值 (强制定义初始值)
                this.saveInitialToNode();
                break;
            case TWEEN_DIRECTION.TO:
                //TO: 从初始值 移动到 目标值
                this.saveNodeToInitial();
                break;
            case TWEEN_DIRECTION.FROM:
                //FROM: 从 目标值 回到 初始值 
                this.saveNodeToInitial(); //节点数据放到初始值
                this.saveTargetToNode(); //将结果数据赋给 节点
                break;

            default:
                break;
        }


    }

    //将当前节点的数据 存在 initial 值内
    private saveNodeToInitial() {
        let property = this.tweenProperty;
        let PROP = TWEEN_PROPERTY;
        let node = this.node;
        switch (property) {
            case PROP.COLOR: this.initialColor = node.color; break;
            case PROP.OPACITY: this.initial = node.opacity; break;
            case PROP.POSITION: this.initialPos.x = node.x; this.initialPos.y = node.y; break;
            case PROP.ROTATION: this.initial = node.rotation; break;
            case PROP.SCALE: this.initial = node.scale; break;
            case PROP.SCALE_XY: this.initialPos.x = node.scaleX; this.initialPos.y = node.scaleY; break;
        }
    }

    //将 initial 的数据 设置 到 节点上
    private saveInitialToNode() {
        let property = this.tweenProperty;
        let PROP = TWEEN_PROPERTY;
        let node = this.node;
        let relative = this.relativeMode;

        if (relative) {
            //相对模式
            switch (property) {
                case PROP.COLOR:
                    let a = node.color;
                    let b = this.initialColor;
                    node.color = cc.color(a.getR() + b.getR(), a.getG() + b.getG(), a.getB() + b.getB());
                    break;
                case PROP.OPACITY: node.opacity += this.initial; break;
                case PROP.POSITION: node.x += this.initialPos.x; node.y = this.initialPos.y; break;
                case PROP.ROTATION: node.rotation += this.initial; break;
                case PROP.SCALE: node.scale += this.initial; break;
                case PROP.SCALE_XY: node.scaleX += this.initialPos.x; node.scaleY += this.initialPos.y; break;
            }
        } else {
            //绝对模式,
            switch (property) {
                case PROP.COLOR: node.color = this.initialColor; break;
                case PROP.OPACITY: node.opacity = this.initial; break;
                case PROP.POSITION: node.x = this.initialPos.x; node.y = this.initialPos.y; break;
                case PROP.ROTATION: node.rotation = this.initial; break;
                case PROP.SCALE: node.scale = this.initial; break;
                case PROP.SCALE_XY: node.scaleX = this.initialPos.x; node.scaleY = this.initialPos.y; break;
            }
        }

    }

    //将目标数据设置到节点上
    private saveTargetToNode() {
        let property = this.tweenProperty;
        let PROP = TWEEN_PROPERTY;
        let node = this.node;
        let relative = this.relativeMode;
        if (relative) {
            switch (property) {
                case PROP.COLOR:
                    let a = node.color;
                    let b = this.targetColor;
                    node.color = cc.color(a.getR() + b.getR(), a.getG() + b.getG(), a.getB() + b.getB());
                    break;
                case PROP.OPACITY: node.opacity += this.target; break;
                case PROP.POSITION: node.x += this.targetPos.x; node.y = this.targetPos.y; break;
                case PROP.ROTATION: node.rotation += this.target; break;
                case PROP.SCALE: node.scale += this.target; break;
                case PROP.SCALE_XY: node.scaleX += this.targetPos.x; node.scaleY += this.targetPos.y; break;
            }
        } else {
            switch (property) {
                case PROP.COLOR: node.color = this.targetColor; break;
                case PROP.OPACITY: node.opacity = this.target; break;
                case PROP.POSITION: node.x = this.targetPos.x; node.y = this.targetPos.y; break;
                case PROP.ROTATION: node.rotation = this.target; break;
                case PROP.SCALE: node.scale = this.target; break;
                case PROP.SCALE_XY: node.scaleX = this.targetPos.x; node.scaleY = this.targetPos.y; break;
            }
        }
    }

    //获取 tween action
    private getTweenAction(reverse: boolean = false): cc.ActionInterval {
        let relative = this.relativeMode;
        let ease = TweenConfig.getTweenType(this.easeType);
        let easeTime = this.duration;
        let property = this.tweenProperty;
        let PROP = TWEEN_PROPERTY;
        let action: cc.ActionInterval;

        let rev = reverse ? -1 : 1; //相对反转值

        let pos;
        let color;


        switch (property) {
            case PROP.COLOR:

                if (relative) {
                    color = this.targetColor;
                    action = cc.tintBy(easeTime, color.getR() * rev, color.getG() * rev, color.getB() * rev);
                } else {
                    color = reverse ? this.initialColor : this.targetColor;
                    action = cc.tintTo(easeTime, color.getR(), color.getG(), color.getB());
                }
                break;
            case PROP.OPACITY:
                if (relative) {
                    action = cc.fadeTo(easeTime, (this.node.opacity + this.target * rev));
                } else {
                    action = cc.fadeTo(easeTime, reverse ? this.initial : this.target);
                }
                break;
            case PROP.POSITION:
                if (relative) {
                    action = cc.moveBy(easeTime, this.targetPos.x * rev, this.targetPos.y * rev);
                } else {
                    action = cc.moveTo(easeTime, reverse ? this.initialPos : this.targetPos);
                }
                break;
            case PROP.ROTATION:
                if (relative) {
                    action = cc.rotateBy(easeTime, this.target * rev);
                } else {
                    action = cc.rotateTo(easeTime, reverse ? this.initial : this.target);
                }
                break;
            case PROP.SCALE:
                if (relative) {
                    action = cc.scaleBy(easeTime, this.target * rev);
                } else {
                    action = cc.scaleTo(easeTime, reverse ? this.initial : this.target);
                }
                break;
            case PROP.SCALE_XY:
                if (relative) {
                    pos = this.targetPos;
                    action = cc.scaleBy(easeTime, pos.x * rev, pos.y * rev);
                } else {
                    pos = reverse ? this.initialPos : this.targetPos;
                    action = cc.scaleTo(easeTime, pos.x, pos.y);
                }
                break;
            case PROP.SKEW_XY:
                if (relative) {
                    pos = this.targetPos;
                    action = cc.skewBy(easeTime, pos.x * rev, pos.y * rev);
                } else {
                    pos = reverse ? this.initialPos : this.targetPos;
                    action = cc.skewTo(easeTime, pos.x, pos.y);
                }
                break;

            default:
                break;
        }

        //设置tween object
        if (ease) action.easing(ease);

        return action;
    }

    forceStart(){
        this.tweenStart(true);
    }

    forceStop(){
        
    }

    //开始 tween, 如果强制开始，那么动作就会被覆盖初始化
    tweenStart(force:boolean = false) {
        let isFrom = this.tweenOrder === TWEEN_DIRECTION.FROM;
        let action = this.getTweenAction(isFrom);//正常的tween 动画
        let reverseAction;
        let wait = this.wait;
        let result: cc.ActionInterval;

        let preAction =  this.node.getActionByTag(this.actionTag);

        if(force){
            this.node.stopActionByTag(this.actionTag);
        }else{
            if(preAction && !preAction.isDone){
                cc.log('动画未播放完');
                return;
            }
        }


        switch (this.playback) {
            case PLAYBACK_MODE.ONCE:
                result = cc.sequence([
                    cc.delayTime(wait.x),
                    action,
                    cc.callFunc(this.onTweenFinish, this)
                ])
                break;
            case PLAYBACK_MODE.PING_PONG:
                reverseAction = this.getTweenAction(isFrom ? false : true);

                result = cc.sequence([
                    cc.delayTime(wait.x),
                    action,
                    cc.callFunc(this.onTweenWait,this),
                    cc.delayTime(wait.y),
                    reverseAction,
                    cc.callFunc(this.onTweenFinish, this)
                ])

                break;
            case PLAYBACK_MODE.PING_PONG_LOOP:
                reverseAction = this.getTweenAction(isFrom ? false : true);
                result = cc.sequence([
                    cc.delayTime(wait.x),
                    action,
                    cc.delayTime(wait.y),
                    reverseAction,
                    cc.callFunc(this.onTweenRepeat, this)
                ]);

                result.repeatForever();//永远重复
                break;
            case PLAYBACK_MODE.LOOP:
                if (this.relativeMode) {
                    result = cc.sequence([
                        cc.delayTime(wait.x),
                        action,
                        cc.delayTime(wait.y),
                        cc.callFunc(this.onTweenRepeat, this)
                    ])
                } else {
                    result = cc.sequence([
                        cc.callFunc(this.onResetValue, this),
                        cc.delayTime(wait.x),
                        action,
                        cc.delayTime(wait.y),
                        cc.callFunc(this.onTweenRepeat, this)
                    ])
                }
                result.repeatForever();//永远重复
                break;
            default:
                break;
        }

        result.setTag(this.actionTag);

        this.node.runAction(result);
    }

    //暂停该节点上的所有的动作
    tweenPause(){
        this.node.resumeAllActions();
    }

    //恢复该节点上的所有的动作
    tweenResume(){
        this.node.pauseAllActions();
    }

    //停止，如果强制停止，就会停在当前状态
    tweenStop() {
        this.node.stopActionByTag(this.actionTag);
    }

    //重新设置初始值（仅限绝对模式,相对模式无效）
    onResetValue() {
        if (this.tweenOrder === TWEEN_DIRECTION.FROM) {
            this.saveTargetToNode();//节点恢复初始值
        } else if (this.tweenOrder === TWEEN_DIRECTION.TO) {
            this.saveInitialToNode();//节点恢复初始值
        } else {
            this.saveInitialToNode();
        }
    }

    onTweenWait(){
        this.waitEvents.forEach(comp=>{
            comp.emit([this.actionTag,comp.customEventData]);
        })  
    }

    onTweenRepeat() {
        this.finishedEvents.forEach(comp=>{
            comp.emit([this.actionTag,comp.customEventData]);
        })
    }

    onTweenFinish() {
        this.finishedEvents.forEach(comp=>{
            comp.emit([this.actionTag,comp.customEventData]);
        })
    }

    // update (dt) {}
}
