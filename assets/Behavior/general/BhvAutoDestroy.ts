/*
 * @Author: wss 
 * @Date: 2019-04-10 00:31:19 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-10 00:40:38
 */


const {ccclass, property,disallowMultiple,menu} = cc._decorator;


/**自动销毁时的动画类型 */
enum DESTROY_ANI {
    NONE,
    SCALE_IN,
    SCALE_OUT,
    FADE_OUT,
    SCALE_LINE
}

/**
 * 可以根据条件，让对象自动销毁
 * ver 0.1 基本功能，根据时间、距离或者信号销毁对象
 * todo ver 0.2 加入自动销毁时动画
 * todo ver 0.3 自动销毁时选择移出节点而不是 destroy，需要用cc.director 监听
 */
@ccclass
@menu("添加特殊行为/General/AutoDestroy (渐隐渐显)")
@disallowMultiple
export default class BhvAutoDestroy extends cc.Component {

    
    @property({
        tooltip:"检查时间，时间到达后触发销毁"
    })
    public isCheckTimer:boolean = true;

    @property({
        tooltip:"等待销毁的时间",
        visible:function(){
            return this.isCheckTimer === true
        }
    })
    public waitTime:number = 1.0;

    @property({
        tooltip:"检查范围，运动超过创建范围时触发"
    })
    public isCheckRange:boolean = false;

    @property({
        tooltip:"超过距离的最大值",
        visible:function(){
            return this.isCheckRange === true
        }
    })
    public outRangeMax:number = 100;

    /**初始点坐标 */
    private startPosition:cc.Vec2 = null;

    @property({
        tooltip:"检查信号传递，如果收到了指定信号就自动销毁"
    })
    public isCheckEmit:boolean = false;

    /**是否 自动将销毁的对象自动回收到对象池 */
    @property({
        tooltip:"收到该节点消息，将会自动销毁节点",
        visible:function(){
            return this.isCheckEmit === true
        }
    })
    private destroyMessage:string = "auto-destroy";

    @property({
        tooltip:"自动销毁时播放动画",
        visible:function(){
            return this.isCheckEmit ===false &&this.isCheckTimer === false && this.isCheckEmit === false;
        }
    })
    public destroyAnimation:DESTROY_ANI = DESTROY_ANI.NONE;

    /** 准备销毁对象 */
    private isReadyDestroy:boolean = false;

    
    // /**是否 自动将销毁的对象自动回收到对象池 */
    // @property({
    //     tooltip:"是否在销毁对象时，自动放入对象池"
    // })
    // private isAutoRecoveryPool:boolean = false;

    start () {
        this.startPosition = this.node.position;
        if(this.isCheckTimer){
            this.scheduleOnce(this.onReadyDestroy, this.waitTime);
        }
    }

    /**自动销毁前的操作 */
    onReadyDestroy(){
        if(this.isReadyDestroy === true)return;
        this.isReadyDestroy = true;
        let action:cc.Action;


        switch (this.destroyAnimation) {
            case DESTROY_ANI.NONE:
                
                break;
        
            default:
                break;
        }
        
        //不允许销毁的情况
        this.node.destroy();

    }

    update (dt) {
        if(this.isReadyDestroy === true)return;
        //超出范围
        if(this.isCheckRange){
            let dy = this.node.y-this.startPosition.y
            let dx = this.node.x-this.startPosition.x
            let dis = Math.sqrt(dx * dx + dy * dy);
            if(dis>this.outRangeMax){
                this.onReadyDestroy();
            }

        }
    }
}
