

const {ccclass, property, menu, disallowMultiple} = cc._decorator;


const GESTURE_HOLD_TIMEOUT = 0.5;			// 按住多久才能算是 长按呢
const GESTURE_TAP_TIMEOUT = 0.333;		    // time for tap gesture to register
const GESTURE_HOLD_THRESHOLD = 15;		    // 持续按住时，手指允许偏离多少像素(防止误差)
const GESTURE_DOUBLE_TAP_THRESHOLD = 25;	// 轻触时，允许在start/ end 之间的坐标偏差
const GESTURE_SWIPE_DISTANCE_MIN = 50;      //滑动超过多少距离才算生效
const GESTURE_SWIPE_TIMEOUT = 0.2;          //滑动超过多少时间无效

/**
 * 方向对应枚举值
 */
enum DIRECTION {
    NONE = 0,
    LEFT_DOWN = 1,
    DOWN = 2,
    RIGHT_DOWN = 3,
    LEFT = 4,
    CENTER = 5,
    RIGHT = 6,
    LEFT_UP = 7,
    UP = 8,
    RIGHT_UP = 9,
}

/**
 * 屏幕触摸区域划分
 */
enum SCREEN_DIV_TYPE {
    LEFT_RIGHT,
    LEFT_MIDDLE_RIGHT,
    UP_DOWN,
    UP_MIDDLE_DOWN
}

/**
 * Cocos Touch 输入事件
 * 封装节点touch 事件，让 触摸能够在全局环境中使用
 */
@ccclass
@menu("添加全局插件/Input/Touch")
@disallowMultiple
export default class PlugTouch extends cc.Component {

    /**
     * 监听触摸的节点，这样才能接收到正确的冒泡事件
     */
    @property({
        tooltip:'接受触摸的节点(从对应节点寻找)',
        type:cc.Node
    })
    private listenNode:cc.Node = null;

    @property({
        tooltip:'是否允许 长按触发事件 (略微消耗性能)',
    })
    private allowHold:boolean = false;

    @property({
        tooltip:'测试绘图模式, 可以监控触摸点所在位置',
    })
    private debug:boolean = false;

    private pressure = 0;

    public DIRECTION = DIRECTION;

    private ctrl = {
        left:false,
        right:false,
        up:false,
        down:false,
        middle:false
    }
    
    /**计时器时间(标记touch 的时间) */
    private timer:number = 0;

    /**记录不同触摸点信息的数组 */
    private touchArray:Array<{
        triggeredHold:boolean,
        isTouch:boolean,
        startTime:number,
        curTime:number,
        lastTapTime:number,
        lastTapPos:cc.Vec2
    }> = [];
  

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //初始化触摸数据(10点触摸)
        let array = this.touchArray;
        for (let i = 0; i < 10; i++) {
            array.push({
                triggeredHold:false,
                isTouch:false,
                startTime:0,
                curTime:0,
                lastTapTime:-1000,
                lastTapPos:cc.v2(-1000,-1000)
            })
        }

    }

    start () {

    }

    onEnable(){

    }
 
    onDisable(){
        this.unbindNode();
    }

    /** 正在触摸中 (默认触摸点) */
    get isInTouch(){
        return 0;
    }

    /** 触摸速度 (默认触摸点) */
    get  touchSpeed(){
        return 0;
    }

    /**
     * 将角度(0~360) 转换为 direction ;
     */
    public getAngleDirection4(angle:number):DIRECTION{
        angle =(angle +360)%360;
        if(Math.abs(angle-270) < 45){
            return DIRECTION.UP;
        }else  if(Math.abs(angle-180) < 45){
            return DIRECTION.LEFT;
        }else  if(Math.abs(angle-90) < 45){
            return DIRECTION.DOWN;
        }else  {
            return DIRECTION.RIGHT;
           
        }
    }

    /**
     * 将角度（0~360 ） 转换为 direction
     */
    public getAngleDirection8(angle:number):DIRECTION{
        angle = (angle +360) %360;
        if(Math.abs(angle-315) <22.5){
            return DIRECTION.RIGHT_UP;
        }else   if(Math.abs(angle-270) < 22.5){
            return DIRECTION.UP;
        }else   if(Math.abs(angle-225) < 22.5){
            return DIRECTION.LEFT_UP;
        }else   if(Math.abs(angle-180) < 22.5){
            return DIRECTION.LEFT;
        }else   if(Math.abs(angle-135) < 22.5){
            return DIRECTION.LEFT_DOWN;
        }else   if(Math.abs(angle-90) < 22.5){
            return DIRECTION.DOWN;
        }else  if(Math.abs(angle-45) < 22.5){
            return DIRECTION.RIGHT_DOWN;
        }else  {
            return DIRECTION.RIGHT;
        }
    }


    /** 绑定触摸时间所在的节点, 一般是绑定UI层 */
    bindNode(node:cc.Node){
        if(node ==null)return;
        //如果绑定过了节点，那么就先解除原节点的绑定事件

        if(this.listenNode)this.unbindNode(); 
        this.listenNode = node;  
        node.on(cc.Node.EventType.TOUCH_START,this.onTouchStart,this,true);
        node.on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this,true);
        node.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this,true);
        node.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this,true);

        cc.view.setResizeCallback(()=>{
           this.node.width =  cc.view.getCanvasSize().width;
           this.node.height = cc.view.getCanvasSize().height;
        });
   
    }

    /** 解除绑定触摸事件所在的节点 */
    unbindNode(){
        let node = this.listenNode;
        if(!node.isValid)return;
        node.off(cc.Node.EventType.TOUCH_START,this.onTouchStart,this);
        node.off(cc.Node.EventType.TOUCH_MOVE,this.onTouchMove,this);
        node.off(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this);
        node.off(cc.Node.EventType.TOUCH_CANCEL,this.onTouchCancel,this);
    }

    /** 检查是否触发 Hold 事件 */
    private checkTriggerHold(id:number,duration:number){


        let info = this.touchArray[id];

        if (info.triggeredHold)return;// 触发了 trigger hold 以后 不能再触发了

        if (duration >= GESTURE_HOLD_TIMEOUT)
		{
            console.log("触发 长按！");
			info.triggeredHold = true;
			
        }

        
    }

    /**检查是否触发 tap 事件 */
    private checkTriggerTap(e:cc.Touch,duration:number)
	{
	

        let id = e.getID();
        let info = this.touchArray[id];
        if (info.triggeredHold)return;

        let offsetTimer = duration;
        let touchMag = e.getStartLocation().sub(e.getLocation()).mag();

		if (offsetTimer <= GESTURE_TAP_TIMEOUT  && touchMag < GESTURE_HOLD_THRESHOLD)
		{

            let tapMag = info.lastTapPos.sub(e.getLocation()).mag();
			// 上一次点击的距离和时间范围内:触发二连击
			if ((offsetTimer <= GESTURE_TAP_TIMEOUT * 2) && tapMag < GESTURE_DOUBLE_TAP_THRESHOLD)
			{
                console.log("双击轻触 事件！",e.getID());
                let event = new cc.Event.EventCustom('double-tap-gesture',true);
                this.node.dispatchEvent(event);

				
                info.lastTapPos = cc.v2(-1000,-1000);
                info.lastTapTime = -10000;
			}
			// Otherwise trigger single tap
			else
			{
                console.log("轻触！事件",e.getID());
                let event = new cc.Event.EventCustom('tap-gesture',true);
                this.node.dispatchEvent(event)

                info.lastTapPos = e.getLocation();
				info.lastTapTime = this.timer;
			}
			
	
		}
    }
    
    /** 检查滑动操作 */
    private checkSwipe(e:cc.Touch,duration:number)
    {
        //todo
        let id = e.getID();
        let info = this.touchArray[id];
        let offset =  e.getStartLocation().sub(e.getLocation());
        let dis = offset.mag();
        
        if(dis > GESTURE_SWIPE_DISTANCE_MIN && duration < GESTURE_SWIPE_TIMEOUT){
            let angle = cc.misc.radiansToDegrees( cc.Vec2.RIGHT.signAngle(offset.normalize()) );
            angle = 180 - angle; //调整角度范围到 0~ 360 度

            console.log("滑动！事件",id,"距离：",dis,"角度：",this.getAngleDirection8(angle));
            //todo
        }


    }

    /**
     *  检查不同区域的点击
     */
    private checkTouchArea(e:cc.Touch)
    {

    }


    private onTouchStart(e:cc.Touch){
        let id = e.getID();
        let info = this.touchArray[id];
        if(info){
            info.startTime = this.timer;
            info.curTime = this.timer;
            info.triggeredHold = false;
            info.isTouch = true;
        }
    

       
    }
    
    private onTouchMove(e:cc.Touch){
        let id = e.getID();
        let info = this.touchArray[id];
        if(info){
            info.curTime = this.timer;
        }
        
    }

    private onTouchEnd(e:cc.Touch){
        let id = e.getID();
        let info = this.touchArray[id];
        if(info){
            info.curTime = this.timer;
            let duration =  info.curTime - info.startTime;
            //检查是否为 tap
            this.checkTriggerTap(e,duration);
            this.checkSwipe(e,duration);
            info.isTouch = false;
        }
    }

    private onTouchCancel(e:cc.Touch){
        let id = e.getID();
        let info = this.touchArray[id];
        if(info){
            info.curTime = this.timer;
            let duration =  info.curTime - info.startTime;
            this.checkSwipe(e,duration);
            info.isTouch =false;
        }
    }

    update (dt) {
        this.timer += dt; 
        if(this.allowHold){
            let array  = this.touchArray
            array.forEach((e,index)=> {
                if(e.isTouch == true){
                    this.checkTriggerHold(index,this.timer - e.startTime);
                }
            });
        }

    }
}


