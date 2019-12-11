/*
 * @Author: wss 
 * @Date: 2019-04-24 17:02:28 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-24 22:35:49
 */


const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**
 * 区域传送者 [v0.1.0]
 * 绑定了这个行为的 对象 会在一个区域内随机传送
 * 一般用途为随机在区域出现的闪光 等效果
 * （一般是父节点,你也可以指定节点)
 */
@ccclass
@menu("添加特殊行为/Movement/Area Transfer (区域随机)")
@disallowMultiple
export default class BhvAreaTransfer extends cc.Component {

    /**开始延迟闪烁时间(可以控制闪烁顺序) */
    @property
    delayTime: number = 0;

    /**每次传送的间隔时间 */
    @property
    waitTime: number = 0.5;

    /**传送间隔时间的取值随机范围 */
    @property
    waitTimeRandom: number = 0;

    @property({
        type:cc.Node,
        tooltip:'区域节点默认为自身父对象，如果需要引用其他节点,需要注意节点位置关系'
    })
    private areaNode: cc.Node = null;

    private timer:number = 0;
    private targetTime:number = 0;


    // LIFE-CYCLE CALLBACKS:

    onLoad(){
        this.targetTime = this.delayTime;
    }

    transPosition() {

        let parent = this.areaNode || this.node.getParent();
        if(parent == null){console.error('Area Transfer 对象 必须有父节点')}
        let anchor = parent.getAnchorPoint();
        let bounds = parent.getBoundingBox();//包围盒为父节点的包围盒
        let waitTime = this.waitTime + (Math.random() * 2 - 1) * this.waitTimeRandom;
        let rx =   Math.random() * bounds.width - bounds.width * anchor.x;
        let ry =   Math.random() * bounds.height - bounds.height * anchor.y;
        
        this.node.x = rx;
        this.node.y = ry;
        this.node.runAction(cc.sequence([
            cc.fadeTo(waitTime*0.2, 255),
            cc.delayTime(waitTime*0.6),
            cc.fadeTo(waitTime*0.2, 0)
        ]));

        this.targetTime =  waitTime;

    }

    start() {

    }

    update(dt){
        if(!this.enabled)return;
        this.timer +=dt;
        if(this.timer >= this.targetTime){
            this.timer = 0;
            this.transPosition();
        }
    }


}
