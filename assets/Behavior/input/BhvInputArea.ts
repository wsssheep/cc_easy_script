/*
 * @Author: wss 
 * @Date: 2019-06-22 15:41:32 
 * @Last Modified by: wss
 * @Last Modified time: 2019-06-22 16:17:08
 */

const {ccclass, property,disallowMultiple ,menu,executionOrder} = cc._decorator;

/**
 * 触摸区域 [v0.0.1]
 */
@ccclass
@menu("添加特殊行为/Input/Input Area (输入区域)")
@disallowMultiple
@executionOrder(-1)
export default class BhvInputArea extends cc.Component {

    @property
    tag:string = '';

    /**是否正在触摸该区域 */
    public isTouching:boolean = false;

    /** 是否悬浮在该区域上 */
    public isOverArea:boolean = false;
 
    private startTouchId:number = 0;

    public duration:number = 0;

    static _TempComps:{tag:string,comp:BhvInputArea}[] = [];

    /**
     * 查找触摸区域的问题
     * @param tag 查询的标签
     */
    static find(tag:string):BhvInputArea{
        let res = this._TempComps.find(v=>v.tag === tag);
        if(res){
            return res.comp;
        }
    }

    onLoad(){
        BhvInputArea._TempComps.push({
            tag:this.tag,
            comp:this
        })
    }

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

    onDestroy(){
        let index =  BhvInputArea._TempComps.findIndex(config=>{return config.comp === this});
        BhvInputArea._TempComps.splice(index);
    }

    update (dt) {
        if(this.isTouching){
            this.duration += dt;
        }
    }
}
