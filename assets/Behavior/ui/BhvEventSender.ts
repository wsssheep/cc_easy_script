
const {ccclass, property, menu} = cc._decorator;

//todo - 未实装, 未检验

/**
 * 事件冒泡转发器,调用事件转发器,
 * 事件转发器可以将按钮调用与逻辑关系分离
 * 
 */
@ccclass
@menu("添加特殊行为/UI/Event Sender(事件转发器)")
export default class BhvEventSender extends cc.Component {


    @property({
        type:[cc.String]
    })
    extraParams:Array<String> = [];

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    /** 广播 click 事件 给 父节点, 使用 event。getUserData() ,获取额外传参数组 */
    sendEvent(e,type){
        if(type == '' ||!type)return;

        let  event = new cc.Event.EventCustom(type,true);
        event.setUserData(this.extraParams);
        this.node.dispatchEvent(event);

    }

    /**广播 click 事件 给 cc.director */
    sendDirector(e,type){
        let args = this.extraParams;
        cc.director.emit(type,args[0],args[1],args[2],args[3],args[4]);
    }



    // update (dt) {}
}
