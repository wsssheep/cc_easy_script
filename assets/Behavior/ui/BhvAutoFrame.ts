// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property, menu } = cc._decorator;

/**
 * 播放循环帧动画的方法
 */
@ccclass
@menu("添加特殊行为/UI/Loop Frame (帧循环)")
export default class BhvLoopFrame extends cc.Component {

    @property({
        type: [cc.SpriteFrame],
        tooltip: '动画的帧'
    })
    spriteFrames: Array<cc.SpriteFrame> = [];

    @property({
        tooltip:'帧的时间间隔'
    })
    duration: number = 0.1; 

    @property({
        tooltip:'是否循环播放'
    })
    loop: boolean = false;

    @property({
        tooltip:'是否在组件加载的时候播放'
    })
    playOnload: boolean = false;

    private sprite:cc.Sprite; // 精灵组件

    /** 是否正在播放 */
    isPlaying:boolean = false;

    playTime:number = 0;

    isLoop:boolean = false;

    endFunc:Function = null;

    onLoad() {
        // 判断一下在组件所挂在的节点上面有没有cc.Sprite组件；
        let s_com = this.node.getComponent(cc.Sprite);
        if (!s_com) { // 没有cc.Sprite组件，要显示图片一定要有cc.Sprite组件,所以我们添加一个cc.Sprite组件;
            s_com = this.node.addComponent(cc.Sprite);
        }
        this.sprite = s_com; // 精灵组件
        // end 
        this.isPlaying = false; // 是否正在播放;
        this.playTime = 0;
        this.isLoop = false;
        this.endFunc = null;

        // 显示第0个frame;
        if (this.spriteFrames.length > 0) {
            this.sprite.spriteFrame = this.spriteFrames[0];
        }

        if (this.playOnload) {
            if (!this.loop) {
                this.playOnce(null);
            }
            else {
                this.playLoop();
            }
        }
    }

    // 实现播放一次,
    playOnce(end_func) {
        this.playTime = 0;
        this.isPlaying = true;
        this.isLoop = false;
        this.endFunc = end_func;
    }
    // end 

    // 实现循环播放
    playLoop() {
        this.playTime = 0;
        this.isPlaying = true;
        this.isLoop = true;
    }
    // end 

    stop() {
        this.playTime = 0;
        this.isPlaying = false;
        this.isLoop = false;
    }

    // called every frame, uncomment this function to activate update callback
    // 每一次刷新的时候需要调用的函数，dt距离上一次刷新过去的时间;
    update(dt) {
        if (this.isPlaying === false) { // 没有启动播放，不做处理
            return;
        }

        this.playTime += dt; // 累积我们播放的时间;

        // 计算时间，应当播放第几帧，而不是随便的下一帧，
        // 否则的话，同样的动画1, 60帧，你在30FPS的机器上你会播放2秒，
        // 你在60FPS的机器上你会播放1秒，动画就不同步;

        let index = Math.floor(this.playTime / this.duration); // 向下取整数
        // index
        if (this.isLoop === false) { // 播放一次
            if (index >= this.spriteFrames.length) { // 非循环播放结束
                // 精灵显示的是最后一帧;
                this.sprite.spriteFrame = this.spriteFrames[this.spriteFrames.length - 1];
                // end 
                this.isPlaying = false;
                this.playTime = 0;
                if (this.endFunc) { // 调用回掉函数
                    this.endFunc();
                }
                return;
            }
            else {
                this.sprite.spriteFrame = this.spriteFrames[index];
            }
        }
        else { // 循环播放;

            while (index >= this.spriteFrames.length) {
                index -= this.spriteFrames.length;
                this.playTime -= (this.duration * this.spriteFrames.length);
            }

            //  在合法的范围之内
            this.sprite.spriteFrame = this.spriteFrames[index];
            // end 
        }
    }


}

