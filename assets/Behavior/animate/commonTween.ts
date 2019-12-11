/*
 * @Author: wss 
 * @Date: 2019-04-26 20:27:00 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-09 17:45:50
 */


//TWEEN动画类 复用模块，封装了一些基本 的 action 用来实现tween效果


/** 基本需要用到的 EASE 类型 */
export enum EASE_TYPE {
    Liner,
    SineIn,
    SineInOut,
    SineOut,
    BackIn,
    BackInOut,
    BackOut,
    BounceIn,
    BounceInOut,
    BounceOut,
    CircleIn,
    CircleInOut,
    CircleOut,
    CubicIn,
    CubicInOut,
    CubicOut,
    ElasticIn,
    ElasticInOut,
    ElasticOut,
}

//适用于一个节点的动画判断
export enum ANI_ACTION_TYPE {
    NONE,
    FADE,
    SCALE,
    SPREAD,
    FLIP_WIDTH,
    FLIP_HEIGHT,
    MOVE_UP,
    MOVE_DOWN,
    MOVE_LEFT,
    MOVE_RIGHT,
}


export enum NODE_TWEEN_PROPERTY {
    POSITION,
    SCALE,
    SCALE_X,
    SCALE_Y,
    WIDTH,
    HEIGHT,
    ROTATION,
    SKEW_X,
    SKEW_Y,
}


class AnimationCommonConfig {

     ACTION_TYPE = ANI_ACTION_TYPE;
     EASE_TYPE = EASE_TYPE
     NODE_TWEEN_PROPERTY = NODE_TWEEN_PROPERTY;
      
     getTweenType(type: EASE_TYPE) {
        let ease;
        switch (type) {
            case EASE_TYPE.Liner: ease = null; break;
            case EASE_TYPE.SineIn: ease = cc.easeSineIn(); break;
            case EASE_TYPE.SineInOut: ease = cc.easeSineInOut(); break;
            case EASE_TYPE.SineOut: ease = cc.easeSineOut(); break;
            case EASE_TYPE.BackIn: ease = cc.easeBackIn(); break;
            case EASE_TYPE.BackInOut: ease = cc.easeBackInOut(); break;
            case EASE_TYPE.BackOut: ease = cc.easeBackOut(); break;
            case EASE_TYPE.BounceIn: ease = cc.easeBounceIn(); break;
            case EASE_TYPE.BounceInOut: ease = cc.easeBounceInOut(); break;
            case EASE_TYPE.BounceOut: ease = cc.easeBounceOut(); break;
            case EASE_TYPE.CircleIn: ease = cc.easeCircleActionIn(); break;
            case EASE_TYPE.CircleInOut: ease = cc.easeCircleActionInOut(); break;
            case EASE_TYPE.CircleOut: ease = cc.easeCircleActionOut(); break;
            case EASE_TYPE.CubicIn: ease = cc.easeCubicActionIn(); break;
            case EASE_TYPE.CubicInOut: ease = cc.easeCubicActionInOut(); break;
            case EASE_TYPE.CubicOut: ease = cc.easeCubicActionOut(); break;
            case EASE_TYPE.ElasticIn: ease = cc.easeElasticIn(0.3); break;
            case EASE_TYPE.ElasticInOut: ease = cc.easeElasticInOut(0.3); break;
            case EASE_TYPE.ElasticOut: ease = cc.easeElasticOut(0.3); break;
    
            default:
                break;
        }
        return ease;
    }
    
     getAction(config: IGetAniActionConfig):cc.ActionInterval {

        let action; //最终得到的 action
        let easing = this.getTweenType(config.ease); //ease 函数
        let node = config.node; // 需要执行动作的节点
        let slideSameDir = false; //是否滑动向同一个方向，如果不是且相反滑动
        let reverseOrder = false; // false = 正常顺序滑页，true = 反转顺序滑页，
        let type = config.type;
        let id = 0;
        let time = config.time ||0;
        let delay = config.delay ||0;
        let originPos = cc.v2(0,0);

    
        let width = config.width || cc.winSize.width;//动画宽度
        let height = config.height || cc.winSize.height;//动画高度


        let ANI = ANI_ACTION_TYPE;
        let isActionOut:boolean = config.isActionOut;

        //动画 in 时，需要记录下原始坐标，方便还原
        if(node && isActionOut === false){
            originPos = node.position;
        }

        //cc.delayTime(time ), 加入一个等待动画时间的玩意儿
    
        switch (type) {
            case ANI.FADE:
                id = 0;
                break;
            case ANI.SCALE:
                id = 4;
                break;
            case ANI.SPREAD:
                id = 5;
                break;
            case ANI.FLIP_WIDTH:
                id = 6;
                break;
            case ANI.FLIP_HEIGHT:
                id = 7;
                break;
            case ANI.MOVE_UP:
                id = 2;
                reverseOrder =  false; 
                break;
            case ANI.MOVE_DOWN:
                id = 2;
                reverseOrder =  true; 
                break;
            case ANI.MOVE_LEFT:
                id = 1;
                reverseOrder = false;
                break;
            case ANI.MOVE_RIGHT:
                id = 1;
                reverseOrder = true;
                break;    
            default:
                break;
        }
    
        switch (id) {
            case 0://淡入淡出
                if (isActionOut) {
                    action = cc.fadeTo(time , 0);
                } else {
                    if(node)node.opacity = 0;
                    action = cc.fadeTo(time,255);
                }
    
                break;
            case 1://SLIDE 滑动切入左右 LEFT TO RIGHT/RIGHT TO LEFT
                if (isActionOut) {
                    action = cc.moveTo(time , cc.v2(reverseOrder ? width : -width, 0));
                } else {
                    if(node)node.x = originPos.x+ width * (reverseOrder ? 1 : -1) *  (slideSameDir ? 1 : -1);
                    action = cc.moveTo(time ,originPos);
                }
                
                break;
            case 2://SLIDE 滑动切入上下 UP TO DOWN / DOWN TO UP
                if (isActionOut) {
                    action = cc.moveTo(time , cc.v2(0, reverseOrder ? height : -height));
                } else {
                    if(node)node.y = originPos.y + height * (reverseOrder ? 1 : -1) * (slideSameDir ? 1 : -1);
                    action = cc.moveTo(time , originPos);
                }
                break;
            case 3://SLIDE 滑动切入 前后 Front TO BACK / BACK TO FRONT
                if (isActionOut) {
                    action = cc.moveTo(time , cc.v2(reverseOrder ? -width : width, 0));
                } else {
                    if(node)node.x = originPos.x - width * (reverseOrder ? 1 : -1) * (slideSameDir ? 1 : -1);
                    action = cc.moveTo(time , originPos);
                }
                break;
            case 4://SCALE 正常缩放 SCALE
                if (!isActionOut && node) {
                    node.scale = 0.01;//设为0 会导致一些判断问题
                    node.opacity = 0;
                }
                action = cc.sequence([
                    cc.scaleTo(time , isActionOut ? 0.01 : 1),
                    cc.fadeTo(time  * 0.1, isActionOut ? 0 : 255)
                ])
                break;
            case 5://SCALE 扩散缩放 SCALE_OUT
                if (isActionOut) {
                    action = cc.spawn([
                        cc.scaleTo(time , reverseOrder ? 0.01 : 5),
                        cc.fadeTo(time , 0)
                    ]);
                } else {
                    if(node){
                        node.scale = reverseOrder ? 5 : 0.01;
                        node.opacity = 0;
                    }
                    action = cc.spawn([
                        cc.scaleTo(time , 1),
                        cc.fadeTo(time , 255)
                    ]);
                }
    
                break;
            case 6://FLIP 缩放翻转 左右
                if (isActionOut) {
                    action =  cc.scaleTo(time , 0.01, 1);
                } else {
                    if(node){
                        node.scaleX = 0.01;
                        node.opacity = 0;
                    }
                    action =  cc.spawn([
                        cc.fadeTo(time , 255),
                        cc.scaleTo(time , 1, 1)
                    ])
                }
    
                break;
            case 7://FLIP 缩放翻转 上下
                if (isActionOut) {
                    action = cc.scaleTo(time , 1, 0.01)
                } else {
                    if(node){
                        node.scaleY = 0.01;
                        node.opacity = 0;
                    }
                    action =  cc.spawn([
                        cc.fadeTo(time , 255),
                        cc.scaleTo(time , 1, 1)
                    ])
                }
    


                break;
            default:
                break;
        }

        //如果 有 easing, 并且有 action ，就加上tween 效果
        if(easing && action)action.easing(easing);

        if(delay>0){
            return cc.sequence([cc.delayTime(delay),action]);
        }else{
            return action;
        }
    
    
    }


}

export let TweenConfig = new AnimationCommonConfig();

export interface IGetAniActionConfig {
    type: ANI_ACTION_TYPE;
    time:number;
    isActionOut:boolean;
    ease?:EASE_TYPE,
    delay?:number,
    /**需要设置初始值的节点，一般 in 动画 才需要 */
    node?: cc.Node;
    width?: number;
    height?: number

}