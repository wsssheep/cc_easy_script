// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property,disallowMultiple ,menu} = cc._decorator;

/**
 * 触摸区域获取
 */
@ccclass
@menu("添加特殊行为/General/Input Area (输入区域)")
@disallowMultiple
export default class BhvInputArea extends cc.Component {

    /**是否正在触摸该区域 */
    public isTouching:boolean = false;

    /** 是否悬浮在该区域上 */
    public isOverArea:boolean = false;
 
    private startTouchId:number = 0;

    public duration:number = 0;

    onEnable(){
        let node = this.node;
        node.on(cc.Node.EventType.TOUCH_START,this.onTouchStart,this,true);
        node.on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this,true);
        node.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this,true);
        node.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this,true);
        node.on(cc.Node.EventType.MOUSE_ENTER,this.onMouseEnter,this);
        node.on(cc.Node.EventType.MOUSE_LEAVE,this.onMouseLeave,this);
    }

    onDisable(){
        let node = this.node;
        node.off(cc.Node.EventType.TOUCH_START,this.onTouchStart,this,true);
        node.off(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this,true);
        node.off(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this,true);
        node.off(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this,true);
        node.off(cc.Node.EventType.MOUSE_ENTER,this.onMouseEnter,this,true);
        node.off(cc.Node.EventType.MOUSE_LEAVE,this.onMouseLeave,this,true);
    }

    start () {

    }

    onMouseEnter(e:cc.Event.EventMouse){
        this.isOverArea = true;
    }

    onMouseLeave(e:cc.Event.EventMouse){
        this.isOverArea = false;
    }

    onTouchStart(e:cc.Touch){
        this.startTouchId = e.getID();
        this.isTouching = true;
    }

    onTouchMove(e:cc.Touch){
        if(e.getID()!== this.startTouchId)return;
        this.isTouching = true;
    }

    onTouchEnd(e:cc.Touch){
        if(e.getID()!== this.startTouchId)return;
        this.isTouching = false;
    }

    onTouchCancel(e:cc.Touch){
        if(e.getID()!== this.startTouchId)return;
        this.isTouching = false;
    }

    update (dt) {
        if(this.isTouching){
            this.duration += dt;
        }
    }
}
