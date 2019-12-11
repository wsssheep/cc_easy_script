/*
 * @Author: wss
 * @Date: 2019-06-22 15:19:32
 * @LastEditTime: 2019-12-09 14:34:05
 * @LastEditors: wss
 */


const {ccclass, property,menu,requireComponent} = cc._decorator;

/**
 * 动画播放拓展 [v1.0.0]
 */
@ccclass
@requireComponent(cc.Animation)
@menu("添加特殊行为/Animate/Animation Helper (动画拓展)")
export default class BhvAnimationHelper extends cc.Component {

    @property({
        tooltip:'动画播放完成后，是否消除该节点'
    })
    finishDestroy:boolean = false;

    private animation:cc.Animation;
    private originClip:cc.AnimationClip;

    onLoad(){
        this.animation = this.node.getComponent(cc.Animation);

        let clip =   this.animation.getClips();
        this.originClip = clip[0];
        this.animation.addClip(this.originClip,'animation-out');//只是为了识别离开状态动画
        this.originClip.wrapMode = cc.WrapMode.Normal;

    }

    onEnable(){
        this.animation.on('play',      this.onPlay as any,        this);
        this.animation.on('finished',  this.onFinished as any,    this);
    }

    onDisable(){
        this.animation.off('play',      this.onPlay);
        this.animation.off('finished',  this.onFinished);
    }

    onPlay(event,clip){
        //cc.log('DEMO:',event);
    }

    onFinished(event,clip){
        //标记自动销毁
        if(clip.name === 'animation-out'){
            this.node.destroy();
        }
    }

    play(){
        this.originClip.wrapMode = cc.WrapMode.Normal;
        this.animation.play();
    }

    reverse(){
        //创建一个反向播放的动画
        this.originClip.wrapMode = cc.WrapMode.Reverse;
        this.animation.play('animation-out');
    }

    // update (dt) {}
}
