// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property,menu,requireComponent} = cc._decorator;

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
        this.animation.on('play',      this.onPlay,        this);
        this.animation.on('finished',  this.onFinished,    this);
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
