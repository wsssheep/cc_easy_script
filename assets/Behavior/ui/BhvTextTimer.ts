

const { ccclass, property, menu } = cc._decorator;

/**倒计时显示的类型 */
enum TIMER_TYPE {
    /**普通数字 */
    NUMBER,
    /**显示百分比 */
    PERCENTAGE,
    /**显示到分钟 */
    TIMER_MINUTE,
    /**显示到秒钟 */
    TIMER_SECOND,
    /**显示到毫秒 */
    TIMER_MS,
}


/**
 * 用于解决文字倒计时显示的行为
 */
@ccclass
@menu("添加特殊行为/UI/Text Timer (文字倒计时)")
export default class BhvTextTimer extends cc.Component {


    @property({
        type: cc.Label,
        tooltip: '计时器显示所在的文本，如果不指定将自动指定本节点组件。'
    })
    label: cc.Label = null;


    @property({
     type:cc.Node,
     tooltip:'信号目标，当倒计时完成后，会直接发送信息给该对象。'   
    })
    emitTarget: cc.Node = null;

    @property({
        type: cc.Enum(TIMER_TYPE),
        tooltip: '显示时间类型,NUMBER = 普通，TIMER_MINUTE =显示到分钟，TIMER_SECOND=显示到秒钟'
    })
    timerType: TIMER_TYPE = TIMER_TYPE.TIMER_SECOND;


    @property({
        tooltip:'信号标签，用于标记 TextTimer 的情况。节点树有多个 Text Timer 行为的时候可以用于区分'
    })
    tag:string = '';


    /**计时器 */
    private timer: number = 0;

    /**倒计时剩余时间 */
    private targetTimer: number = 0;

    /**是否处于暂停状态 */
    isPaused:boolean = true;

    start() {
        if (this.label == null) {
            this.label = this.node.getComponent(cc.Label);
        }
    }

    /**
     * 启动计时器(可以通过直接重启来重新设置时间)
     * @param startTimer (输入毫秒的倒计时时间)
     * @param target (信号发送的目标节点)
     * @param tag 
     */
    startTimer(startTimer: number,tag?:string,target?:cc.Node) {
        if(tag)this.tag = tag;
        if(target)this.emitTarget = target;

        //间隔计时器倒计时(毫秒)
        this.targetTimer = startTimer;
        this.timer = this.targetTimer;
        this.isPaused = false;
       
    }

    /**
     * 停止计时器
     * @param forceTrigger 强制触发计时器结果
     */
    stopTimer(forceTrigger:boolean = false) {
        this.isPaused = true;
        if(forceTrigger)this.timerEmit();
    }

    /**倒计时结束后 通知消息给目标节点 */
    private timerEmit(){
        let node = this.emitTarget||this.node;
        node.emit('text-timer-finish',this.tag);
    }

    /**获取倒计时百分比 */
    getPercentage(): number {
        let percentage = 1-this.timer / this.targetTimer;
        if (percentage > 1) percentage = 1;
        if (percentage < 0) percentage = 0;
        return percentage;
    }

    update(dt) {
        //每秒 + 1/60 秒
        if(this.isPaused == true)return;
        this.timer -= dt * 1000;
        //完成倒计时
        if (this.timer<=0) {
            this.isPaused = true;
            this.timerEmit();
        }else{
            this.updateText();
        }
    }

    updateText() {
        if (this.label == null) return;
        let value: string | number;
        switch (this.timerType) {
            case TIMER_TYPE.NUMBER:
                value = this.timer;
                break;
            case TIMER_TYPE.PERCENTAGE:
                value =  Math.floor(this.getPercentage() *100) +"%";
                break;
            case TIMER_TYPE.TIMER_MINUTE:
                value = this.parseTimeStamp(this.timer,'min');
                break;
            case TIMER_TYPE.TIMER_SECOND:
                value = this.parseTimeStamp(this.timer,'sec');
                break;
            case TIMER_TYPE.TIMER_MS:
                value = this.parseTimeStamp(this.timer,'ms');
                break;
            default:
                break;
        }

        this.label.string = value+"" ;
        

    }

    /**
     * 将时间(毫秒级)转换为 00：00：00 形式的显示方式
     * @param timeStamp 传入毫秒
     * @param timerUnit 显示单位，默认秒
     */
    parseTimeStamp(timeStamp: number, timerUnit: 'ms' | 'sec' | 'min'= 'sec') {
        var time = timeStamp;
        let result: string;

        var ms: string | number = Math.floor(time % 1000);
        var sec: string | number = Math.floor(time / 1000 % 60);
        var min: string | number = Math.floor(time / 1000 / 60 % 60);
        var hour: string | number = Math.floor(time / 1000 / 60 / 60 % 24);
        //补位
        if (ms < 100) { ms = "0" + ms; }
        if (sec < 10) { sec = "0" + sec; }
        if (min < 10) { min = "0" + min; }
        if (hour < 10) { hour = "0" + hour; }

        switch (timerUnit) {
            case 'ms':  result = hour + ":" + min + ":" + sec + ":" + ms;
                break;
            case 'sec': result = hour + ":" + min + ":" + sec;
                break;
            case 'min': result = hour + ":" + min;
                break;

            default:
                break;
        }

        return result;
    }

}

