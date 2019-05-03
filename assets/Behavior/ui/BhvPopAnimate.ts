import { EASE_TYPE, getTweenType } from './../utils/commonTween';

const {ccclass, property, menu, disallowMultiple} = cc._decorator;


enum ANIMATE_STATE {
    /**   无 */NONE,
    /** 淡入 */FADE,
    /** 缩放 */SCALE,
    /** 扩散 */SPREAD,
    /** 翻转宽度 */FLIP_WIDTH,
    /** 翻转高度 */FLIP_HEIGHT,
    /** 移上 */MOVE_UP,
    /** 移下 */MOVE_DOWN,
    /** 移右 */MOVE_RIGHT,
    /** 移左 */MOVE_LEFT,
}


/**
 * 预制弹窗动画 ver 0.1.0 
 * 包含自动弹窗动画,可以针对某节点 进行快速的切入/切出的动画设置
 */
@ccclass
@menu("添加特殊行为/UI/Pop Animate (弹窗动画)")
@disallowMultiple
export default class BhvPopAnimate extends cc.Component {

    /** 进入动画类型 */
    @property({
        type:cc.Enum(ANIMATE_STATE),
        tooltip:'入口动画',
        displayName:'Animation In'
    })
    private animationPopIn:ANIMATE_STATE = ANIMATE_STATE.SCALE;

    /** 离开动画类型 */
    @property({
        type:cc.Enum(ANIMATE_STATE),
        tooltip:'弹出动画',
        displayName:'Animation Out'
    })
    private animationPopOut:ANIMATE_STATE = ANIMATE_STATE.SCALE;

    /** 进入动画TWEEN类型 */
    @property({
        type:cc.Enum(EASE_TYPE),
        tooltip:'入口动画 的 TWEEN 类型',
        displayName:'Animation In Ease'
    })
    private easePopIn:EASE_TYPE = EASE_TYPE.SineInOut;

    /** 离开动画 TWEEN 类型 */
    @property({
        type:cc.Enum(EASE_TYPE),
        tooltip:'弹出动画 的 TWEEN 类型',
        displayName:'Animation Out Ease'
    })
    private easePopOut:EASE_TYPE = EASE_TYPE.SineInOut;

    @property({
        tooltip:'动画播放速度倍率(基于默认配置),越小越快，默认1'
    })
    private animateSpeed:number = 1;

    @property({
        type:cc.Node,
        tooltip:'黑色遮罩,默认会搜索 名为 dark 的节点'    
    })
    private darkMask:cc.Node = null;

    @property({
        type:cc.Node,
        tooltip:'动画目标'
    })
    private target:cc.Node = null;


    @property({
        tooltip:'是否在弹出动画完成后，自动销毁该弹窗',
        displayName:'End Destroy',
    })
    private isFadeoutDestroy = true;

    @property({
        tooltip:'是否在开始就自动播放入',
        displayName:'Auto Start Animation'
    })
    private isStartAnimate = true;

    @property({
        tooltip:'是否自动播放离开动画',
        displayName:'Auto End Animation'
    })
    private isAutoOutAnimation = false;

    
    @property({
        tooltip:'从开始播放动画，到离开动画之间需要多久',
        displayName:'Wait Time',
        visible:function(){
            return this.isAutoOutAnimation;
        }
    })
    private autoPlayWaitTime = 0.5;


    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //this.darkMask.opacity = 0;
        this.onPlayAnimationIn();
    }

    // start () {
    //     //未设定黑幕遮罩，将自动创建一个黑色遮罩
    //     //this.onPlayAnimationIn();
    //必须在 onload 后 立刻触发，否则动画会有1帧延迟显示
    // }

    private getTweenType = getTweenType;

    onEnable(){
        this.node.on('pop-animate-in',this.onPlayAnimationIn,this);
        this.node.on('pop-animate-out',this.onPlayAnimationOut,this);
    }

    onDisable(){
        this.node.off('pop-animate-in',this.onPlayAnimationIn,this);
        this.node.off('pop-animate-out',this.onPlayAnimationOut,this);
    }

    public onPlayAnimationIn(delay:number =0){
        let dark = this.darkMask;
        let speed:number = this.animateSpeed||1;
        let runAnimation = ()=>{
            //遮罩淡入 
            if(this.darkMask){
                let preOpacity = dark.opacity;
                dark.opacity = 0;
                let action = cc.fadeTo(0.2*speed,preOpacity).easing(cc.easeSineInOut());
                dark.runAction(action);
            }

            //进入弹窗动画
            if(this.target == null)return;
            this.play(this.target,this.animationPopIn,false);
        };

        //延迟播放动画内容
        if(typeof delay == 'number'&&delay>0){
            this.scheduleOnce(runAnimation,delay);
        }else{
            runAnimation();
        }


    }

    public onPlayAnimationOut(delay:number =0){
            let dark = this.darkMask;
            let speed:number = this.animateSpeed||1;

            let runAnimation = () =>{
                //遮罩淡入 
                if(this.darkMask){
                    let action = cc.fadeTo(0.2*speed,0).easing(cc.easeSineInOut());
                    dark.runAction(action);
                }

                //进入弹出动画
                if(this.target == null)return;
                this.play(this.target,this.animationPopOut,true);
            }

            //延迟播放动画内容(可配合本身动画操作)
            if(typeof delay == 'number'&&delay>0){
                this.scheduleOnce(runAnimation,delay);
            }else{
                runAnimation();
            }

    }

    /**
     * 播放该动画
     * @param type 
     * @param isOut - 是否反向播放 
     */
    public play(target:cc.Node,type:ANIMATE_STATE,reserve:boolean = false){
        let action:cc.Action;
        let speed:number = this.animateSpeed*0.2||1;
        let preX = this.target.x;
        let preY = this.target.y;
        let screenSize = cc.winSize;
        let ease:Function  =  cc.easeSineInOut();
        if(!reserve){
            ease = this.getTweenType(this.easePopIn)
        }else{
            ease = this.getTweenType(this.easePopOut)

        }

        switch (type) {
            case ANIMATE_STATE.SCALE:
                if(!reserve){
                    target.setScale(0,0);
                    action = cc.scaleTo(speed,1,1).easing(ease);
                }else{
                    action = cc.scaleTo(speed,0,0).easing(ease);
                }

                break;
            case ANIMATE_STATE.FADE:
                if(!reserve){
                    target.opacity = 0;
                    action = cc.fadeIn(speed).easing(ease);
                }else{
                    action = cc.fadeOut(speed).easing(ease);
                }
                break;
            case ANIMATE_STATE.SPREAD:
                if(!reserve){
                    target.setScale(5,5);
                    action = cc.scaleTo(speed,1,1).easing(ease);
                    target.opacity = 0;
                    target.runAction(cc.fadeTo(speed,255).easing(ease));
                }else{
                    action = cc.scaleTo(speed,5,5).easing(ease);
                    target.runAction(cc.fadeTo(speed,0).easing(ease)) ;
                }
                break;
            case ANIMATE_STATE.FLIP_HEIGHT:
                if(!reserve){
                    target.setScale(0,1);
                    action = cc.scaleTo(speed,1,1).easing(ease);
                }else{
                    action = cc.scaleTo(speed,0,1).easing(ease);
                }
                break;
            case ANIMATE_STATE.FLIP_WIDTH:
                if(!reserve){
                    target.setScale(1,0);
                    action = cc.scaleTo(speed,1,1).easing(ease);
                }else{
                    action = cc.scaleTo(speed,1,0).easing(ease);
                }
                break;
            case ANIMATE_STATE.MOVE_UP:
                if(!reserve){
                    this.target.y = preY - screenSize.height;
                    action = cc.moveTo(speed,preX,preY).easing(ease);
                }else{
                    action = cc.moveTo(speed,preX,preY+screenSize.height).easing(ease);
                }
                break;
            case ANIMATE_STATE.MOVE_DOWN:
                if(!reserve){
                    this.target.y = preY + screenSize.height;
                    action = cc.moveTo(speed,preX,preY).easing(ease);
                }else{
                    action = cc.moveTo(speed,preX,preY-screenSize.height).easing(ease);
                }
                break;
            case ANIMATE_STATE.MOVE_LEFT:
                if(!reserve){
                    this.target.x = preX + screenSize.width;
                    action = cc.moveTo(speed,preX,preY).easing(ease);
                }else{
                    action = cc.moveTo(speed,preX-screenSize.width,preY).easing(ease);
                }
                break;
            case ANIMATE_STATE.MOVE_RIGHT:
                if(!reserve){
                    this.target.x = preX - screenSize.width;
                    action = cc.moveTo(speed,preX,preY).easing(ease);
                }else{
                    action = cc.moveTo(speed,preX+screenSize.width,preY).easing(ease);
                }
                break;
            default:
                break;
        }

        //如果是反向动画，并且有自动销毁
        if(this.isFadeoutDestroy && reserve){
            let sequence = cc.sequence([action,cc.callFunc(()=>{
                this.node.destroy();
            })] as cc.ActionInterval[]);
            target.runAction(sequence);
        }else{
            //如果需要自动播放结束动画
            if(this.isAutoOutAnimation){
                let sequence = cc.sequence([
                    action,
                    cc.delayTime(this.autoPlayWaitTime),
                    cc.callFunc(this.onPlayAnimationOut,this)
                ]as cc.ActionInterval[]);

                target.runAction(sequence);
            //如果不需要自动播放结束动画
            }else{
                target.runAction(action);
            }
        }

    }

}
