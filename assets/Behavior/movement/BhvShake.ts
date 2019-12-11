/*
 * @Author: wss 
 * @Date: 2019-06-03 17:16:46 
 * @Last Modified by:   wss 
 * @Last Modified time: 2019-06-03 17:16:46 
 */


const { ccclass, property, menu } = cc._decorator;


/**
 * 震动 [v1.0.0]
 * 随机圆上一点作为振幅，不断缩小半径降低强度，半径缩小的速率就是阻尼，可以实现各种效果的震动。
 * ( 修复震动 BUG )
 */
@ccclass
@menu("添加特殊行为/Movement/Shake (震动)")
export default class BhvShake extends cc.Component {

    @property({
        tooltip: '移动模式，移动模式不会还原对象的坐标回到 shake 发生前的状态，适合运动的物体'
    })
    movingMode: boolean = false;

    @property({
        tooltip: '衰退模式，会随着震动时间强度逐渐衰退'
    })
    decayMode: boolean = false;

    @property({
        visible: function () { return this.decayMode === true },
        tooltip: '阻尼，震动时半径逐渐缩小的速率'
    })
    damping: number = 0.01;

    @property({
        tooltip: '震动时间'
    })
    shakeTime: number = 0.5;

    /**初始值 */
    @property({
        tooltip: '震动x,y的偏移量'
    })
    intensity: cc.Vec2 = cc.v2(5, 5);

    /**实际震动时用到的值 */
    _intensity: cc.Vec2 = cc.v2(5, 5);

    _originPos: cc.Vec2 = cc.v2(0, 0);

    _isShaking: boolean = false;

    _timer: number = 0.5;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this._originPos = this.node.position;
        this._intensity = this.intensity;
    }

    /**通过按钮事件调用的震动 */
    onButtonShake(e, time: string) {
        this.shake(parseFloat(time));
    }

    /**重新设置震动的初始位置 */
    setOriginPos(pos:cc.Vec2){
        this._originPos = pos;
    }

    shake(time: number = 0.5, intensity?: cc.Vec2) {
        //如果在shake状态，那么只是会维持shaking，而不改变默认的位置
        if (this._isShaking === false) {
            // this._originPos = this.node.position;
            if(!this.movingMode){
                this.node.position.x = this._originPos.x;
                this.node.position.y = this._originPos.y;
            }

        }

        if (time > 0) {
            this._timer = time;
        }

        if (intensity) this.intensity = intensity;
        this._intensity = this.intensity.clone(); //clone
        this._timer = this.shakeTime;

        this._isShaking = true;
    }


    update(dt) {
        if (!this._isShaking) return;
    
        this._timer -= dt;
        //倒计时
        if (this._timer <= 0) {
            if(!this.movingMode){
                this.node.x = this._originPos.x;
                this.node.y = this._originPos.y;
            }
            this._isShaking = false;
        }

        let sx, sy;
        sx = (Math.random() * 2 - 1) * this._intensity.x;
        sy = (Math.random() * 2 - 1) * this._intensity.y;

        if(this.decayMode){
            if (this._intensity.x > 0.01) {
                this._intensity.x -= this._intensity.x * this.damping *dt * 60; 
            } else {
                this._intensity.x = 0;
            }

            if (this._intensity.y > 0.01) {
                this._intensity.y -= this._intensity.y *this.damping *dt *60 ; 
            } else {
                this._intensity.y = 0;
            }

            if(this._intensity.y<0.01 && this._intensity.x<0.01){
                this._intensity.y = 0;
                this._intensity.x = 0;
                if(!this.movingMode){
                    this.node.x = this._originPos.x;
                    this.node.y = this._originPos.y;
                }

                this._isShaking = false;
                return;
            }
        }

        //震动中
        if (this.movingMode) {
            this.node.x += sx;
            this.node.y += sy;
        } else {
            this.node.x = this._originPos.x + sx;
            this.node.y = this._originPos.y + sy;
        }

    }
}

