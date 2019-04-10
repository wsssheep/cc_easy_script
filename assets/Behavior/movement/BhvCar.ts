import BhvCameraExtra from "../general/BhvCameraExtra";

/*
 * @Author: ws.s 
 * @Date: 2018-12-04 20:58:46 
 * @Last Modified by: wss
 * @Last Modified time: 2019-03-06 21:37:10
 */
 //* ver 1.0.1 修复car 行为无法漂移的问题
 //* ver 1.0.2 增加car角度锁定设置,可以在漂移完成后，矫正回车的运动角度
 //todo ver 1.0.3 车辆的碰撞反弹实现 (加入 c2runtime 中的 push out 方法,强制推出)

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**角度制,限制角度范围, 弧度制*/
let clamp_angle = function (a) {
    // Clamp in radians
    a %= 2 * Math.PI;       // now in (-2pi, 2pi) range

    if (a < 0)
        a += 2 * Math.PI;   // now in [0, 2pi) range
    return a;
};

/**角度制，判断是否为顺时针, 弧度制  */
let angleClockwise = function (a1, a2) {
    let s1 = Math.sin(a1);
    let c1 = Math.cos(a1);
    let s2 = Math.sin(a2);
    let c2 = Math.cos(a2);
    return c1 * s2 - s1 * c2 <= 0;
};

/**求两个角度的夹角, 弧度制 */
let angleDiff = function (a1, a2) {
    if (a1 === a2)
        return 0;

    let s1 = Math.sin(a1);
    let c1 = Math.cos(a1);
    let s2 = Math.sin(a2);
    let c2 = Math.cos(a2);
    let n = s1 * s2 + c1 * c2;

    // Prevent NaN results
    if (n >= 1)
        return 0;
    if (n <= -1)
        return Math.PI;

    return Math.acos(n);
};

enum LIMIT_TYPE{
    NONE,
    ANGLE_45,
    ANGLE_90
}

enum DIRECTION{
    LEFT,
    RIGHT,
    UP,
    DOWN
}


/**
 * ver 0.1
 * 使节点拥有 车类似的 左右转向，前后加速减速的特性。
 * 默认情况下，将由键盘上的箭头键控制（向上加速，向下制动，向左和向右转向)
 */
@ccclass
@menu("添加特殊行为/Movement/Car (车运动)")
@disallowMultiple
export default class BhvCar extends cc.Component {

    /**最大速度 */
    @property({ 
        tooltip: "最大移动速度", 
    })
    maxSpeed: number = 350;

    /**加速度 */
    @property({ tooltip: "加速度", })
    accel: number = 200;

    /**减速度 */
    @property({ tooltip: "减速度", })
    decel: number = 300;

    @property({
        tooltip: "初始转向速度设置, angle/s",
        visible:true,
        displayName:'Steer Speed'
    })
    startSteerSpeed: number = 255;

    @property({
        tooltip: "初始漂移恢复速度设置,angle/s",
        displayName:'Drift Recover'
    })
    startDriftRecover: number = 185;

    /**摩擦系数 */
    @property({
        tooltip: "摩擦系数",
    })
    friction: number = 0.4;

    /**是否锁定运动角度 */
    @property({
        tooltip: "是否锁定运动角度"
    })
    isLockAngle: boolean = false;

    /**是否使用默认控制器 */
    @property({
        tooltip: "是否使用默认控制器"
    })
    defaultControls: boolean = false;

    @property({
        tooltip: '默认是否启用该行为'
    })
    initialState: boolean = true;

    /**限制车辆转向角度,15度角 45度角 或者 90度角 */
    @property({
        tooltip: '转向后自动将车辆转向角度 矫正',
        type:cc.Enum(LIMIT_TYPE)
    })
    limitAngleType:LIMIT_TYPE = LIMIT_TYPE.NONE;

    /**角度约束强度 */
    @property({
        tooltip: '约束强度设定,0~1',
        max:1,
        min:0,
        step:0.01,
        visible:function(){
            return this.limitAngleType != LIMIT_TYPE.NONE
        }
    })
    limitPower:number = 0.15;

    /**转向速度, angle/s*/
    get steerSpeed() {
        return cc.misc.radiansToDegrees(this._steerSpeed);
    }
    set steerSpeed(value: number) {
        this._steerSpeed = cc.misc.degreesToRadians(value);
    }
    /**漂移速度,弧度制  */
    private _steerSpeed: number;

    /**漂移恢复速度,angle/s*/
    get driftRecover() {
        return cc.misc.radiansToDegrees(this._driftRecover);
    }
    set driftRecover(value: number) {
        this._driftRecover = cc.misc.degreesToRadians(value);
    }

  

    /**漂移恢复速度,弧度值 */
    private _driftRecover: number;

    /**速度 */
    private s: number = 0;

    /**运动角度,弧度制 */
    private a: number = 0;

    /**最小角度,弧度值 */
    private m: number = 0;

    /**限制的角度类型 */
    static LIMIT_TYPE = LIMIT_TYPE;

    get speed(): number {
        return this.s;
    }
    set speed(speed: number) {
        let max = this.maxSpeed + this._speedUpValue;
        if (speed < - max )
            speed = - max ;
        if (speed >  max  )
            speed =  max  ;
        this.s = speed;
    }

    get angle(): number {
        return cc.misc.radiansToDegrees(this.a);
    }
    set angle(angle: number) {
        this.a = cc.misc.degreesToRadians(angle);
    }

    get vector(): cc.Vec2 {
        let x = Math.cos(this.m) * this.s;
        let y = Math.sin(this.m) * this.s;
        return cc.v2(x, y);
    }

    private upKey: boolean;
    private downKey: boolean;
    private leftKey: boolean;
    private rightKey: boolean;
    private ignoreInput: boolean;

    private simUp: boolean;
    private simDown: boolean;
    private simLeft: boolean;
    private simRight: boolean;

    /**是否在漂移 */
    private _isDrift: boolean;
    private isCollideObject:boolean = false;

    /**上一次碰撞的反弹角度 */
    private lastCollideAngle:number = 0;

    lastX: number;
    lastY: number;
    lastRotation: number;
    
    /** 0 = */
    private _speedUpState:number= 0;
    /**加速剩余时间 */
    private _speedUpDuration:number =0;
    /**当前加速器所加速的值*/
    private _speedUpValue:number =0;
    /**speedUpLerp */
    private _speedUpLerp:number = 0.1;
    
    /**是否使用临时加速器改变最大速度值*/
    get isSpeedUp(){
        return this._speedUpDuration>0; 
    };

    /**丢失焦点的回调函数 */
    _onBlurCallback: any;

    /**模拟的运动方向的常量 */
    static DIRECTION = DIRECTION;

    /** 属性初始化 */
    init(config:{
        maxSpeed?:number
        accel?:number
        decel?:number
        steerSpeed?:number
        driftRecover?:number
        friction?:number
    } = {}){
        
        //覆盖车辆默认属性
        if(config.maxSpeed)this.maxSpeed = config.maxSpeed;
        if(config.accel)this.accel = config.accel;
        if(config.decel)this.decel = config.decel;
        if(config.steerSpeed)this.startSteerSpeed = config.steerSpeed;
        if(config.driftRecover)this.startDriftRecover = config.driftRecover;
        if(config.friction)this.friction = config.friction;
        
        //重新启动一次start
        this.start();
    }

    // LIFE-CYCLE CALLBACKS:
    start() {

        this.driftRecover = this.startDriftRecover;
        this.steerSpeed = this.startSteerSpeed;
   

        // Key states
        this.upKey = false;
        this.downKey = false;
        this.leftKey = false;
        this.rightKey = false;
        this.ignoreInput = false;

        // Simulated key states
        this.simUp = false;
        this.simDown = false;
        this.simLeft = false;
        this.simRight = false;

        // Movement
        /**速度 */
        this.s = 0;

        /**角度 */
        this.a = cc.misc.degreesToRadians(this.node.rotation);
        /**最小角度 */

        this.m = cc.misc.degreesToRadians(this.node.rotation);
        this.enabled = this.initialState;

        this.lastX = this.node.x;
        this.lastY = this.node.y;
        this.lastRotation = this.node.rotation;

    }

    onEnable() {
        if (!this.defaultControls) return;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        //切后台或隐藏时，按键停止
        cc.game.on(cc.game.EVENT_HIDE, this.onWindowBlur, this);

        //兼容浏览器，丢失焦点后，把输入事件强制关闭
        if (cc.sys.isBrowser) {
            this._onBlurCallback = null;
            this._onBlurCallback = () => {
                this.onWindowBlur()
            };
            cc.game.canvas.addEventListener('blur', this._onBlurCallback);
        }


    }

    onDisable() {
        if (!this.defaultControls) return;
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        if (this._onBlurCallback && cc.sys.isBrowser) cc.game.canvas.removeEventListener('blur', this._onBlurCallback);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let keyCode:number = event.keyCode;
        let key = cc.macro.KEY;

        switch (keyCode) {
            case key.left: // left
                this.leftKey = true;
                break;
            case key.up: // up
                this.upKey = true;
                break;
            case key.right: // right
                this.rightKey = true;
                break;
            case key.down: // down
                this.downKey = true;
                break;
        }

    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        let keyCode: number = event.keyCode;
        let key = cc.macro.KEY;
        switch (keyCode) {
            case key.left: // left
                this.leftKey = false;
                break;
            case key.up: // up
                this.upKey = false;
                break;
            case key.right: // right
                this.rightKey = false;
                break;
            case key.down: // down
                this.downKey = false;
                break;
        }

    }

    // 丢失焦点，暂停键盘操作
    private onWindowBlur() {
        this.upKey = false;
        this.downKey = false;
        this.leftKey = false;
        this.rightKey = false;
    }

    /**
     * 模拟车运动
     * @param ctrl 0=left, 1=right, 2=up, 3=down
     */
    simulate(ctrl:DIRECTION) {
        // 0=left, 1=right, 2=up, 3=down
        switch (ctrl) {
            case DIRECTION.LEFT:
                this.simLeft = true;
                break;
            case DIRECTION.RIGHT:
                this.simRight = true;
                break;
            case DIRECTION.UP:
                this.simUp = true;
                break;
            case DIRECTION.DOWN:
                this.simDown = true;
                break;
        }
    }

    /**判断车是否在移动 */
    get isMoving():boolean{
        return this.speed !== 0;
    }

    /**车辆正在转向 */
    get isSteering():boolean{
        return this.leftKey || this.simLeft || this.rightKey || this.simRight; 
    }

    /**0-之前左转向了 1-之前右转向了 */
    lastSteerDir:DIRECTION = DIRECTION.LEFT;

    /**车辆是否正在漂移 */
    get isDrifting():boolean{
        return this._isDrift;
    }

  

    /**停止车移动,顺便停止操作 */
    stop() {
        this.speed = 0;

        this.leftKey = false;
        this.rightKey = false;
        this.upKey = false;
        this.downKey = false;
        
    }

    /**是否忽略玩家的输入 */
    setIgnoreInput(ignoring: boolean) {
        this.ignoreInput = ignoring;
    }

    /**控制车转角度 矫正的 函数 */
    private updateLimitCheck(){
        //放开左右按键的情况下,角度矫正
        if(this.limitAngleType == LIMIT_TYPE.NONE)return;
        
            let a:number = 0;
            let at:number = cc.misc.radiansToDegrees(this.a);
            let range:number= 0;
            let lerp:number = this.limitPower;

            switch (this.limitAngleType) {
                case LIMIT_TYPE.ANGLE_45:
                    a = 45;
                    range = a/2 * 0.8;
                    break;

                case LIMIT_TYPE.ANGLE_90:
                    a = 90;
                    range = a/2 * 0.8;
                    break;
            
                default:
                    break;
            }

            if(at%a <=0.01)return;
            if(at%a>a-range){
                this.a = cc.misc.lerp(this.a,this.a+cc.misc.degreesToRadians(a-at%a),lerp);
            }else if(at%a<range){
                this.a = cc.misc.lerp(this.a,this.a-cc.misc.degreesToRadians(at%a),lerp);
            }
        
    }

    /**
     * 车辆加速一定时间
     * @param addSpeed 增加的速度
     * @param duration 加速持续的时间(峰值)
     * @param lerp lerp系数，越接近1越快丢失最大速度
     */
    speedUp(addSpeed:number =100,duration:number = 0.01,lerp:number =0.1){
        this._speedUpValue = addSpeed;
        this._speedUpDuration = duration;
        this._speedUpLerp = lerp;
        this.speed = this.maxSpeed;
    }


    /**最高速度的,动态改变 */
    private _changeMaxSpeed(dt){
        if(this._speedUpValue<=0 && this._speedUpDuration<=0)return;
      

        let max:number = this.maxSpeed+this._speedUpValue;
        let lerp:number  =this._speedUpLerp ;
        
        if(this._speedUpDuration>0){
            this._speedUpDuration -=dt;
            if(this.s<max){
                this.s = cc.misc.lerp(this.s,max,0.01);
            }
            if(this._speedUpDuration<0.01)  this._speedUpDuration = 0;
        }else{           
            this._speedUpValue = cc.misc.lerp(this._speedUpValue,0,lerp);
            if(this._speedUpValue<=10)this._speedUpValue = 0;
        }
     

    }


    update(dt: number) {
        if (dt === 0) return;
        this._changeMaxSpeed(dt);

        let left = this.leftKey || this.simLeft;
        let right = this.rightKey || this.simRight;
        let up = this.upKey || this.simUp;
        let down = this.downKey || this.simDown;

        /**极限速度 */
        let max = this.maxSpeed + this._speedUpValue;

        this.simLeft = false;
        this.simRight = false;
        this.simUp = false;
        this.simDown = false;

        if (!this.enabled)
            return;

        // Object had its angle changed: change angle of motion
        if (!this.isLockAngle &&  this.node.rotation !== this.lastRotation) {
            this.a = cc.misc.degreesToRadians(this.node.rotation);
            this.m = cc.misc.degreesToRadians(this.node.rotation);
            this.lastRotation =  this.node.rotation;
        }

        // Is already overlapping solid: must have moved itself in (e.g. by rotating or being crushed),
        // so push out
        let collObj = false;//this.runtime.testOverlapSolid(this.inst);
        if (collObj) {
            // this.runtime.registerCollision(this.inst, collobj);
            // if (!this.runtime.pushOutSolidNearest(this.inst))
            // 	return;		// must be stuck in solid
        }

        // Ignoring input: ignore all keys
        if (this.ignoreInput) {
            left = false;
            right = false;
            up = false;
            down = false;
        }

        // Apply acceleration
        if (up && !down) {
            this.s += this.accel * dt;
            if (this.s > max)
                this.s = max;
        }

        // Apply deceleration or reverse
        if (down && !up) {
            this.s -= this.decel * dt;
            if (this.s < -max)
                this.s = -max;
        }

        // Both keys down or up: apply 10% deceleration
        if (down === up) {
            if (this.s > 0) {
                this.s -= this.decel * dt * 0.1;

                if (this.s < 0)
                    this.s = 0;
            }
            else if (this.s < 0) {
                this.s += this.decel * dt * 0.1;

                if (this.s > 0)
                    this.s = 0;
            }
        }

        // Reversing: swap left + right leys
        if (this.s < 0) {
            let temp = left;
            left = right;
            right = temp;
        }

      

        // Steering
        if (left && !right) {
            this.a = clamp_angle(this.a - this._steerSpeed * dt * (Math.abs(this.s) /max ));
            this.lastSteerDir =  DIRECTION.LEFT;
        }

        if (right && !left) {
            this.a = clamp_angle(this.a + this._steerSpeed * dt * (Math.abs(this.s) /max));
            this.lastSteerDir =  DIRECTION.RIGHT;
        }

        if (right == left && this.limitAngleType !== LIMIT_TYPE.NONE){
            this.updateLimitCheck();
        }


        // Drift recovery
        let recover:number = this._driftRecover * dt;
        let diff:number = angleDiff(this.a, this.m);

        if (diff > cc.misc.degreesToRadians(90)){
            recover += (diff - cc.misc.degreesToRadians(90));
        }
 

        if (diff <= recover){
           this.m = clamp_angle(this.a); 
           this._isDrift = false;
        }
        else if (angleClockwise(this.a, this.m)){
            this.m = clamp_angle(this.m + recover);
            this._isDrift = true;
        }
        else{
            this.m = clamp_angle(this.m - recover);
            this._isDrift = true;
        }

        // console.log(Math.floor(cc.misc.radiansToDegrees(recover)));
        // Move
        this.lastX = this.node.x;
        this.lastY = this.node.y;

        if (this.s !== 0 && dt !== 0) {
            this.node.x += Math.cos(this.m) * this.s * dt;
            this.node.y -= Math.sin(this.m) * this.s * dt;

            if (!this.isLockAngle) {
                this.node.rotation =  cc.misc.radiansToDegrees(this.a);
                this.lastRotation = this.node.rotation;
            }

            // Moved in to a solid?
            let hitSolid:boolean = this.isCollideObject;//this.runtime.testOverlapSolid(this.inst);
            if (hitSolid) {
                this.s = Math.abs(this.s);
                this.m = this.lastCollideAngle;
                this.node.x += Math.cos(this.m) * this.s * dt;	// move out for another tick to try and avoid solid
                this.node.y -= Math.sin(this.m) * this.s * dt;
                this.s *= (1 - this.friction);
            }
        }
        else if (!this.isLockAngle && this.node.rotation !== cc.misc.radiansToDegrees(this.a) ) {
             this.node.rotation = cc.misc.radiansToDegrees(this.a);
             this.lastRotation = this.node.rotation;
        }

    }



}
