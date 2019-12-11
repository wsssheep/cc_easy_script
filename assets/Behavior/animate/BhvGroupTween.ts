import {ANI_ACTION_TYPE, EASE_TYPE, IGetAniActionConfig, TweenConfig } from './commonTween';
const {ccclass, property,menu} = cc._decorator;

/**
 * 群体动画 [v1.0.0]
 * 适用于需要控制一群节点批量进行动画移动的情况
 */
@ccclass
@menu("添加特殊行为/Animate/Group Tween (组tween)")
export default class BhvGroupTween extends cc.Component {

    
    @property({
        tooltip:'延迟决定，什么时候播放tween动画'
    })
    delayTime:number = 0;

    @property({
        tooltip:'动画时间'
    })
    easeTime:number = 0;

    @property({
        tooltip:'对于需要tween的节点，与之前一个节点相间隔的时间'
    })
    delayTimeOffset:number = 0;

    @property
    reverseOrder:boolean = false;

    /** 进入动画类型 */
    @property({
        type: cc.Enum(ANI_ACTION_TYPE),
        tooltip: '入口动画',
        displayName: 'Animation Type',
    })
    private animationType: ANI_ACTION_TYPE = ANI_ACTION_TYPE.SCALE;

    /** 进入动画TWEEN类型 */
    @property({ 
        type: cc.Enum(EASE_TYPE),
        tooltip: '入口动画 的 TWEEN 类型',
        displayName: 'Animation Tween',
    })
    private easeType: EASE_TYPE = EASE_TYPE.SineInOut;

    @property([cc.Node])
    private tweenNodes:cc.Node[] = [];


    // LIFE-CYCLE CALLBACKS:

    onLoad () {

        if(this.tweenNodes.length<=0){
            this.tweenNodes = this.tweenNodes.concat(this.node.children);
        }

    }

    start () {

        this.node.opacity = 0;
        this.scheduleOnce(()=>{
            this.node.opacity = 255;
            this.playIn();
        },0.1);

    }

    runTweenAction(node:cc.Node,index:number,reverse:boolean = false){

        let id = this.reverseOrder?(this.node.children.length-1-index):index;
        let time = this.delayTime + this.delayTimeOffset * id;

        let config:IGetAniActionConfig = {
            type: this.animationType,
            time:this.easeTime,
            isActionOut:reverse,
            ease:this.easeType,
            node: node,
            width: this.node.width,
            height: this.node.height,
            delay:time
        }

        let action = TweenConfig.getAction(config);
        node.runAction(action);

    }

    playIn(){
       this.tweenNodes.forEach((element,index) => {
            this.runTweenAction(element, index, false);
        });
    }

    playOut(){
        this.tweenNodes.forEach((element,index) => {
            this.runTweenAction(element, index, true);
        });
    }

    // update (dt) {}
}
