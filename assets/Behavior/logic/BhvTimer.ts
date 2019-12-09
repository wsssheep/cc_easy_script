
const {ccclass, property, menu} = cc._decorator;

enum TIMER_TYPE {
    /**触发一次立刻销毁 */
    ONCE,

    /**重复次数 */
    REPEAT,
    
    /**根据指定间隔时间循环触发事件 */
    LOOP,
    
}

/**
 * 触发计时器，到达时间就触发一次指定的回调，可以循环
 */
@ccclass
@menu("添加特殊行为/General/Timer (定时器)")
export default class BhvTimer extends cc.Component {

    @property({
        tooltip:'计时器标签，用于识别当前的计时器'
    })
    tag: string = '';

    @property
    activeAtStart:boolean = true;

    @property
    private _type : TIMER_TYPE = TIMER_TYPE.REPEAT;
    public get type() : TIMER_TYPE {
        return this._type;
    }
    @property({
        type:cc.Enum(TIMER_TYPE)
    })
    public set type(v : TIMER_TYPE) {
        this._type = v;
        switch (v) {
            case TIMER_TYPE.ONCE:
                this.targetLoop = 0;
                break;
            case TIMER_TYPE.REPEAT:
                this.targetLoop = 1;              
                break;
            case TIMER_TYPE.LOOP:
                this.targetLoop = cc.macro.REPEAT_FOREVER;          
                break;
        
            default:
                break;
        }
   
    }
    

    /**当前时间 */
    private curTime:number = 0;
    
    /**结束时间 */
    private endTime:number = 2;
    
    /**目标时间 */
    @property({
        tooltip:'目标的时间',
        displayName:'Time'
    })
    public targetTime:number = 2;


    static TYPE =  TIMER_TYPE;

    /**目标时间随机变动值，0.2 就是 -0.2~0.2 范围变动 */
    @property({
        tooltip:'目标时间随机偏移值',
        displayName:'Time Random',
       visible:function(){return this.type !== TIMER_TYPE.ONCE} 
    })
    targetTimeRandom:number = 0;

    /**当前循环次数 */
    loopTime:number = 0; //循环次数

    /**目标循环次数 */
    @property({
        tooltip:'重复次数',
        type:cc.Integer,
        displayName:'Repeat Count',
        visible:function(){return this.type === TIMER_TYPE.REPEAT} 
    })
    targetLoop:number = 1; //目标循环次数




    /**还剩余多少时间结束 */
    public get leftTime() : number {
        return this.endTime - this.curTime;
    }

    /**进度百分比 */
    public get progress() : number {
        return this.curTime/this.endTime ;
    }
    

    @property(cc.Component.EventHandler)
    events:cc.Component.EventHandler[] = [];

    /**计时器是否在运行（暂停中也算） */
    isRun:boolean = false;

    /**暂停 */
    paused:boolean = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if(this.activeAtStart){
            this.startTimer();
        }
    }

    startTimer (interval?:number,repeat?:number,timeRnd?:number) {
        this.isRun = true;
        //默认值不改变计时器的世界

        if(typeof timeRnd === 'number'){
            this.targetTimeRandom = timeRnd;
        }

        if(typeof timeRnd === 'number'){
            this.targetTime = interval;
        }

        if(typeof interval === 'number'){
            if(repeat === cc.macro.REPEAT_FOREVER){
                this.targetLoop = cc.macro.REPEAT_FOREVER;
            }else{
                this.targetLoop = Math.round(repeat);
            }
        }

        this.endTime = this.targetTime;
    }

    stopTimer(){
        this.isRun = false;
    }

    //通过事件设置开启计时器
    private onEventStart(){
        this.startTimer();
    }

    //通过事件停止计时器
    private onEventStop(){
        this.stopTimer();
    }

    //完成了一次时间
    onFinishTimer(){
        this.curTime = 0;
        this.loopTime +=1;

        //触发回调事件
        this.events.forEach(comp=>{
            comp.emit([this.loopTime,this.targetLoop,comp.customEventData])
        })
        
        //判断是否要继续循环
        if(this.targetLoop !== cc.macro.REPEAT_FOREVER && this.loopTime>=this.targetLoop){
            this.stopTimer();
        }else{
            //随机变动目标时间
            if(this.targetTimeRandom !== 0){
                this.endTime = this.targetTime + (Math.random()*2-1) * this.targetTimeRandom;
            }else{
                this.endTime = this.targetTime;
            }
        }


    }

    

    update (dt) {
        if(this.isRun === false)return;
        if(this.paused === true)return; //暂停时间

        let delta = dt * 60 / 60; //1帧
        this.curTime +=delta;
        if(this.curTime >=this.endTime){
            this.onFinishTimer();
        }


    }
}
