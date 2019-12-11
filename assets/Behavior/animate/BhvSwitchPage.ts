import {  EASE_TYPE, TweenConfig, IGetAniActionConfig,ANI_ACTION_TYPE } from './commonTween';

const { ccclass, property, executeInEditMode,menu} = cc._decorator;


@ccclass
@executeInEditMode
@menu("添加特殊行为/UI/Switch Page (切换页面)")
export default class BhvSwitchPage extends cc.Component {

    @property
    isLoopPage: boolean = false;

    @property
    private _index: number = 0;
    public get index(): number {
        return this._index;
    }
    @property({
        type: cc.Integer
    })
    public set index(v: number) {
        if (this.isChanging) return;
        v = Math.round(v);
        let count = this.node.childrenCount - 1;
        if (this.isLoopPage) {
            if (v > count) v = 0;
            if (v < 0) v = count;
        } else {
            if (v > count) v = count;
            if (v < 0) v = 0;
        }
        this.preIndex = this._index;//标记之前的页面
        this._index = v;
        if (CC_EDITOR) {
            this._updateEditorPage(v);
        } else {
            this._updatePage(v);
        }
    }

    @property({
        tooltip:'是否在切页时候使用动画'
    })
    useAnimation:boolean = false;

    /** 进入动画类型 */
    @property({
        type: cc.Enum(ANI_ACTION_TYPE),
        tooltip: '入口动画',
        displayName: 'Animation Type',
        visible:function(){return this.useAnimation}
    })
    private animationType: ANI_ACTION_TYPE = ANI_ACTION_TYPE.SCALE;


    /** 进入动画TWEEN类型 */
    @property({ 
        type: cc.Enum(EASE_TYPE),
        tooltip: '入口动画 的 TWEEN 类型',
        displayName: 'Animation In Ease',
        visible:function(){return this.useAnimation}
    })
    private easePopIn: EASE_TYPE = EASE_TYPE.SineInOut;

    /** 离开动画 TWEEN 类型 */
    @property({
        type: cc.Enum(EASE_TYPE),
        tooltip: '弹出动画 的 TWEEN 类型',
        displayName: 'Animation Out Ease',
        visible:function(){return this.useAnimation}
    })
    private easePopOut: EASE_TYPE = EASE_TYPE.SineInOut;

    @property({
        tooltip: '切页动画的播放时间',
        visible:function(){return this.useAnimation}
    })
    private easeTime: number = 1;

    @property({
        tooltip: '中间动画延迟时间',
        displayName:'EaseIn DelayTime ',
        visible:function(){return this.useAnimation}
    })
    private easeInDelayTime: number = 0;


    private preIndex: number = 0;

    //判断是否在 changing 页面状态

    private _isChanging: boolean = false;
    /**只读，是否在changing 的状态 */
    public get isChanging(): boolean {
        return this._isChanging;
    }


    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.preIndex = this.index;
    }

    private _updateEditorPage(page: number) {
        if (!CC_EDITOR) return;
        let children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if (i == page) {
                node.active = true;
            } else {
                node.active = false;
            }


        }
    }

    private _updatePage(page: number){
        let children = this.node.children;
        let preIndex = this.preIndex;
        let curIndex = this.index;
        if (preIndex === curIndex) return;//没有改变就不进行操作


        let preNode: cc.Node = children[preIndex];//旧节点
        let showNode: cc.Node = children[curIndex];//新节点

        //默认不使用动画
        if(this.animationType === ANI_ACTION_TYPE.NONE||this.useAnimation === false){
            preNode.active = false;
            showNode.active = true;
            return;
        }

        this._isChanging = true;
        showNode.active = true;//激活新节点

        let cfgIn:IGetAniActionConfig = {
            type: this.animationType,
            time:this.easeTime/2,
            isActionOut:false,
            ease:this.easePopIn,
            node: showNode,
            width: this.node.width,
            height: this.node.height,
            delay:this.easeInDelayTime
        }

        let cfgOut:IGetAniActionConfig = {
            type: this.animationType,
            time:this.easeTime/2,
            isActionOut:true,
            ease:this.easePopOut,
            node: preNode,
            width: this.node.width,
            height: this.node.height,
        }

        let action_out = TweenConfig.getAction(cfgOut)
        let action_in =  TweenConfig.getAction(cfgIn);
        preNode.runAction(cc.sequence([action_out, cc.callFunc(() => {
            preNode.active = false;
            this._isChanging = false;
        })]));


        showNode.runAction(cc.sequence([action_in, cc.callFunc(() => {
            //初始化一下等操作
        })]));

    }

    //更新页面（不建议直接调用）
    private _updatePage_Old(page: number) {
        let children = this.node.children;
        let preIndex = this.preIndex;
        let curIndex = this.index;
        if (preIndex === curIndex) return;//没有改变就不进行操作


        let preNode: cc.Node = children[preIndex];//旧节点
        let showNode: cc.Node = children[curIndex];//新节点

        //默认不使用动画
        if(this.animationType === ANI_ACTION_TYPE.NONE||this.useAnimation === false){
            preNode.active = false;
            showNode.active = true;
            return;
        }

        let type = 2;//动画类型
        let time = this.easeTime || 0.5;//动画过渡总时间

        showNode.active = true;//激活新节点
        this._isChanging = true;

        let action_out;
        let action_in;

        let easing_in = cc.easeBackInOut();
        let easing_out = cc.easeBackInOut();

        let width = this.node.width;
        let height = this.node.height;

        //条件 overIndex ,  false = 正常顺序滑页，true = 反转顺序滑页，
        // 写入条件 pre > cur 根据页码的顺序切换
        let compareOrder = 0;
        let overIndex = false; //preIndex > curIndex; 

        if (compareOrder === 0) {
            overIndex = preIndex > curIndex;
        } else if (compareOrder === 1) {
            overIndex = preIndex < curIndex;
        } else if (compareOrder === 2) {
            overIndex = true;
        } else {
            overIndex = false;
        }

        //改变动作顺序, 改变切页的顺序，false 同向切页, true 反向切页
        let slideOrder = false;

        switch (type) {
            case 0://淡入淡出
                showNode.opacity = 0;
                action_out = cc.fadeTo(time / 2, 0);
                action_in = cc.sequence([
                    cc.delayTime(time / 2),
                    cc.fadeTo(time / 2, 255),
                ]);
                break;
            case 1://SLIDE 滑动切入左右 LEFT TO RIGHT/RIGHT TO LEFT
                if (overIndex) {
                    showNode.x = width * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(-width, 0)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                } else {
                    showNode.x = -width * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(width, 0)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                }
                break;
            case 2://SLIDE 滑动切入上下 UP TO DOWN / DOWN TO UP
                if (overIndex) {
                    showNode.y = height * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(0, -height)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                } else {
                    showNode.y = -height * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(0, height)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                }
                break;
            case 3://SLIDE 滑动切入 前后 Front TO BACK / BACK TO FRONT
                if (overIndex) {
                    showNode.x = -width * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(-width, 0)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                } else {
                    showNode.x = +width * (slideOrder ? 1 : -1);
                    action_out = cc.moveTo(time / 2, cc.v2(width, 0)).easing(easing_out);
                    action_in = cc.moveTo(time / 2, cc.v2(0, 0)).easing(easing_in);
                }
                break;
            case 4://SCALE 正常缩放 SCALE
                showNode.scale = 0.01;//设为0 会导致一些判断问题
                showNode.opacity = 0;
                action_out = cc.sequence([
                    cc.scaleTo(time / 2, 0.01).easing(easing_out),
                    cc.fadeTo(time / 2 * 0.1, 0)
                ])
                action_in = cc.sequence([
                    cc.scaleTo(time / 2, 1).easing(easing_in),
                    cc.fadeTo(time / 2 * 0.1, 255)
                ])
                break;
            case 5://SCALE 扩散缩放 SCALE_OUT
                if (overIndex) {
                    showNode.scale = 5;
                    showNode.opacity = 0;
                    action_out = cc.scaleTo(time / 2, 0).easing(easing_out);
                    action_in = cc.spawn([
                        cc.scaleTo(time / 2, 1).easing(easing_in),
                        cc.fadeTo(time / 2, 255)
                    ]);

                } else {
                    showNode.scale = 0.01;
                    showNode.opacity = 0;
                    action_out = cc.spawn([
                        cc.scaleTo(time / 2, 5).easing(easing_out),
                        cc.fadeTo(time / 2, 0)
                    ]);
                    action_in = cc.spawn([
                        cc.scaleTo(time / 2, 1).easing(easing_in),
                        cc.fadeTo(time / 2, 255)
                    ]);
                }
                break;
            case 6://FLIP 缩放翻转 左右
                showNode.scaleX = 0.01;
                showNode.opacity = 0;
                action_out = cc.spawn([
                    cc.delayTime(time / 2),
                    cc.scaleTo(time / 2, 0.01, 1).easing(easing_out)
                ]);

                action_in = cc.sequence([
                    cc.delayTime(time / 2),
                    cc.spawn([
                        cc.fadeTo(time / 2, 255).easing(easing_in),
                        cc.scaleTo(time / 2, 1, 1).easing(easing_in)
                    ])
                ]);
                break;
            case 7://FLIP 缩放翻转 上下
                showNode.scaleY = 0.01;
                showNode.opacity = 0;
                action_out = cc.spawn([
                    cc.delayTime(time / 2),
                    cc.scaleTo(time / 2, 1, 0.01).easing(easing_out)
                ]);

                action_in = cc.sequence([
                    cc.delayTime(time / 2),
                    cc.spawn([
                        cc.fadeTo(time / 2, 255).easing(easing_in),
                        cc.scaleTo(time / 2, 1, 1).easing(easing_in)
                    ])
                ]);

                break;
            default:
                break;
        }


        preNode.runAction(cc.sequence([action_out, cc.callFunc(() => {
            preNode.active = false;
            this._isChanging = false;
        })]));

        showNode.runAction(cc.sequence([action_in, cc.callFunc(() => {
            //初始化一下等操作
        })]));

    }

    public next(): boolean {
        if (this.isChanging) {
            return false;
        } else {
            this.index++;
            return true;
        }

    }

    public previous(): boolean {
        if (this.isChanging) {
            return false;
        } else {
            this.index--;
            return true;
        }
    }

    public setEventIndex(e, index): boolean {
        if (this.index >= 0 && this.index != null && this.isChanging === false) {
            this.index = index;
            return true;
        } else {
            return false;
        }
    }


    // update (dt) {}
}
