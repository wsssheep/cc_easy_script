/*
 * @Author: wss 
 * @Date: 2019-04-12 20:03:17 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-15 17:32:39
 */

const {ccclass, property, menu} = cc._decorator;

//todo - 未实装, 未检验


/**发送事件的模式 */
enum SEND_MODE {
    /** 广播模式，将冒泡事件广播给父节点 */
    ONE_TARGET,
    /** 锁定节点模式， 将冒泡事件直接传递给某个节点 */
    MULTIPLE_TARGET,
    /** cc.Director 模式， 将冒泡事件传递给 Director */
    CC_DIRECTOR
}

/**发送信息支持的事件类型 */
let EVENT_NAMES = {
    ON_COLLISION_ENTER:"onCollisionEnter",
    ON_COLLISION_STAY:"onCollisionStay",
    ON_COLLISION_EXIT:"onCollisionExit",
    ON_TOUCH_START:"onTouchStart",
    ON_TOUCH_MOVE:"onTouchMove",
    ON_TOUCH_END:"onTouchEnd",
    ON_TOUCH_CANCEL:"onTouchCancel",
}


/**
 *  事件转发器 [ver 0.1]
 * +事件冒泡转发器,调用事件转发器,
 * +事件转发器可以将按钮调用与逻辑关系分离
 */
@ccclass
@menu("添加特殊行为/Logic/Event Sender(事件转发器)")
export default class BhvEventSender extends cc.Component {

    @property({
        tooltip:"接受信息的节点",
        type:cc.Node,
        visible:function(){
            return this.sendMode === SEND_MODE.ONE_TARGET
        }
    })
    receiveNode:cc.Node = null;

    /**其他节点接收的事件名称 */
    static EVENTS = EVENT_NAMES; 

    @property({
        tooltip:"ONE_TARGET = 发送信息给一个指定节点,\nMULTIPLE_TARGET = 广播给父节点,\nCC_DIRECTOR =传递给cc.director",
        type:cc.Enum(SEND_MODE)
    })
    sendMode:SEND_MODE = SEND_MODE.ONE_TARGET;

    
    @property({
        displayName:"Send TouchEvent",
        tooltip:"是否传递 点击该对象的监听事件"
    })
    private isSendTouchEvent:boolean = true;

    @property({
        displayName:"Send CollisionEvent",
        tooltip:"是否传递该对象的碰撞监听事件"
    })
    private isSendCollisionEvent:boolean = true;



    //传递 click 事件
    //传递 collision 事件


    @property({
        type:[cc.String]
    })
    extraParams:Array<String> = [];



    onLoad () {
    
    }

    onEnable(){
        if(this.isSendTouchEvent === true){
            this.node.on(cc.Node.EventType.TOUCH_START,this.onTouchStart,this,true);
            this.node.on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this,true);
            this.node.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this,true);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this,true);
        }
    }

    onDisable(){
        if(this.isSendTouchEvent === true){
            this.node.off(cc.Node.EventType.TOUCH_START,this.onTouchStart,this,true);
            this.node.off(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this,true);
            this.node.off(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this,true);
            this.node.off(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this,true);    
        }
    }

    start () {

    }

    onTouchStart(e:cc.Touch){
        this.sendEvent(EVENT_NAMES.ON_TOUCH_START,e);
    }

    onTouchMove(e:cc.Touch){
        this.sendEvent(EVENT_NAMES.ON_TOUCH_MOVE,e);
    }

    onTouchEnd(e:cc.Touch){
        this.sendEvent(EVENT_NAMES.ON_TOUCH_END,e);
    }

    onTouchCancel(e:cc.Touch){
        this.sendEvent(EVENT_NAMES.ON_TOUCH_CANCEL,e);
    }

    /** 广播 click 事件 给 父节点, 使用 event。getUserData() ,获取额外传参数组 */
    sendEvent(type,arg1?,arg2?,arg3?,arg4?,arg5?){
        if(type == '' ||!type)return;
        switch (this.sendMode) {
            case SEND_MODE.ONE_TARGET:
                this.receiveNode.emit(type,arg1,arg2,arg3,arg4,arg5);
                break;
            case SEND_MODE.MULTIPLE_TARGET:
                let  event = new cc.Event.EventCustom(type,true);
                event.setUserData(this.extraParams);
                this.node.dispatchEvent(event);
                break;
            case SEND_MODE.CC_DIRECTOR:
                cc.director.emit(type,arg1,arg2,arg3,arg4,arg5);
                break;
        
            default:
                break;
        }



    }

    /**广播 click 事件 给 cc.director */
    sendDirector(e,type){
        let args = this.extraParams;
        cc.director.emit(type,args[0],args[1],args[2],args[3],args[4]);
    }

    onCollisionEnter(other,self){
        if(this.isSendCollisionEvent === false)return;
        this.receiveNode.emit("onCollisionEnter",other,self);
    }
    
    onCollisionStay(other,self){
        if(this.isSendCollisionEvent === false)return;
        this.receiveNode.emit("onCollisionStay",other,self);
    }
    
    onCollisionExit(other,self){
        if(this.isSendCollisionEvent === false)return;
        this.receiveNode.emit("onCollisionExit",other,self);

    }



    // update (dt) {}
}
