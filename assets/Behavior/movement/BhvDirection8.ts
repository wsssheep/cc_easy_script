// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property, menu, disallowMultiple} = cc._decorator;


enum DIRECTION {
    up_down,
    left_light,
    direction4,
    direction8,
}

enum ANGLE_MODE {
    no,degree45,degree90,degree360
}


/**
 * 8 Direction行为控制节点在上、下、左、右和对角线上移动，
 * 默认情况下由键盘方向键控制。
 */
@ccclass
@menu("添加特殊行为/Movement/Direction8 (八方向移动)")
@disallowMultiple
export default class BhvDirection8 extends cc.Component {

    @property({tooltip: "最大移动速度"})
    maxSpeed:number = 200;

    @property({tooltip: "加速度"})
    accel:number = 600;

    @property({tooltip: "减速度"})
    decel:number = 500;

 
    @property({
        type: cc.Enum(DIRECTION),
        tooltip: '角度方向,0-up_down 只允许上下移动\n1-left_light 只允许左右移动\n2-direction4 只允许4个方向移动\n3-direction8 允许8个方向移动'
    })
    directions:DIRECTION = DIRECTION.direction8;

    @property({tooltip: '使用默认控制器'})
    defaultControls:boolean = false;

    @property({
        type: cc.Enum(ANGLE_MODE),
        tooltip: '设置角度平滑'
    })
    angleMode:ANGLE_MODE = ANGLE_MODE.degree360;
    
    @property({tooltip: '默认是否启用该行为'})
    initialState:boolean = true;
    
    private upKey:boolean;
    private downKey:boolean;
    private leftKey:boolean;
    private rightKey:boolean;
    private ignoreInput:boolean;
    private simUp:boolean;
    private simDown:boolean;
    private simLeft:boolean;
    private simRight:boolean;
    //判断上一帧是否真的按下按键了
    private lastUpTick:number;
    private lastDownTick:number;
    private lastLeftTick:number;
    private lastRightTick:number;

    private dx:number;
    private dy:number;
    private _tickCount:number;
    private _onBlurCallback:any;

    /**枚举值: 运行运动的方向 */
    DIRECTION = DIRECTION;

    /**枚举值: 0移动时,跟随的平滑角度值 */
    ANGLE_MODE = ANGLE_MODE;

    // LIFE-CYCLE CALLBACKS:

    start() {
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

        //放开按键的最后时间
        this.lastUpTick = -1;
        this.lastDownTick = -1;
        this.lastLeftTick = -1;
        this.lastRightTick = -1;

        // Movement
        this.dx = 0;
        this.dy = 0;

        //计时器
        this._tickCount = 0;        

    }

    onEnable() {
        if(!this.defaultControls)return;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        //切后台或隐藏时，按键停止
        cc.game.on(cc.game.EVENT_HIDE,this.onWindowBlur,this);
        
        //兼容浏览器，丢失焦点后，把输入事件强制关闭
        if(cc.sys.isBrowser){
            this._onBlurCallback = null;
            this._onBlurCallback = ()=>{this.onWindowBlur()};
            cc.game.canvas.addEventListener('blur', this._onBlurCallback);     
        }


    }

    onDisable() {
        if(!this.defaultControls)return;
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        if(this._onBlurCallback && cc.sys.isBrowser)cc.game.canvas.removeEventListener('blur', this._onBlurCallback);
    }

    private onKeyDown(event) {
        var keyCode = event.keyCode;
        var key = cc.macro.KEY;
        var tickCount = this._tickCount;
        switch (keyCode) {
            case key.left:	// left
                if (this.lastLeftTick < tickCount)
                    this.leftKey = true;
                
                break;
            case key.up:	// up
                if (this.lastUpTick < tickCount)
                    this.upKey = true;

                break;
            case key.right:	// right
                if (this.lastRightTick < tickCount)
                    this.rightKey = true;
                    
                break;
            case key.down:	// down
                if (this.lastDownTick < tickCount)
                    this.downKey = true;
                
                break;
            }


    }

    private onKeyUp(event) {
        var keyCode = event.keyCode;
        var key = cc.macro.KEY;
		var tickCount = this._tickCount;
	
		switch (keyCode) {
		case key.left:	// left
			this.leftKey = false;
			this.lastLeftTick = tickCount;
			break;
		case key.up:	// up
			this.upKey = false;
			this.lastUpTick = tickCount;
			break;
		case key.right:	// right
			this.rightKey = false;
			this.lastRightTick = tickCount;
			break;
		case key.down:	// down
			this.downKey = false;
			this.lastDownTick = tickCount;
            break;
        }

    }

    isMoving() {
        return this.dx !== 0 || this.dy !== 0;
    }

    stop() {
        this.dx = 0;
        this.dy = 0;
    }

    reverse() {
        this.dx *= -1;
        this.dy *= -1;
    }

    simulate(ctrl) {
        // 4=left, 6=right, 8=up, 2=down
        switch (ctrl) {
            case 2:
                this.simDown = true;
                break;
            case 4:
                this.simLeft = true;
                break;
            case 6:
                this.simRight = true;
                break;
            case 8:
                this.simUp = true;
                break;
        }
    }

    update(dt) {
        this._tickCount++;
        var left = this.leftKey || this.simLeft;
        var right = this.rightKey || this.simRight;
        var up = this.upKey || this.simUp;
        var down = this.downKey || this.simDown;

        this.simLeft = false;
        this.simRight = false;
        this.simUp = false;
        this.simDown = false;
        if (!this.enabled)
            return;
        //todo 检查当前的碰撞状态，决定是否能移动

        //忽略所有按钮的输入
        if (this.ignoreInput) {
            left = false;
            right = false;
            up = false;
            down = false;
        }

        // Up & down mode: ignore left & right keys
        if (this.directions === DIRECTION.up_down) {
            left = false;
            right = false;
        }
        // Left & right mode: ignore up & down keys
        else if (this.directions === DIRECTION.left_light) {
            up = false;
            down = false;
        }
        // 4 directions mode: up/down take priority over left/right
        if (this.directions === DIRECTION.direction4 && (up || down)) {
            left = false;
            right = false;
        }
        // Apply deceleration when no arrow key pressed, for each axis
        if (left == right) // both up or both down
        {
            if (this.dx < 0) {
                this.dx += this.decel * dt;

                if (this.dx > 0)
                    this.dx = 0;
            } else if (this.dx > 0) {
                this.dx -= this.decel * dt;

                if (this.dx < 0)
                    this.dx = 0;
            }
        }

        if (up == down) {
            if (this.dy < 0) {
                this.dy += this.decel * dt;
                if (this.dy > 0) this.dy = 0;
            } else if (this.dy > 0) {
                this.dy -= this.decel * dt;
                if (this.dy < 0) this.dy = 0;
            }
        }

        // 应用加速度
        if (left && !right) {
            // Moving in opposite direction to current motion: add deceleration
            if (this.dx > 0)
                this.dx -= (this.accel + this.decel) * dt;
            else
                this.dx -= this.accel * dt;
        }

        if (right && !left) {
            if (this.dx < 0)
                this.dx += (this.accel + this.decel) * dt;
            else
                this.dx += this.accel * dt;
        }

        if (up && !down) {
            if (this.dy > 0)
                this.dy -= (this.accel + this.decel) * dt;
            else
                this.dy -= this.accel * dt;
        }

        if (down && !up) {
            if (this.dy < 0)
                this.dy += (this.accel + this.decel) * dt;
            else
                this.dy += this.accel * dt;
        }

        //进行角色移动
        var ax:number, ay:number,collObj:boolean;
        if (this.dx !== 0 || this.dy !== 0) {
            // Limit to max speed
            var speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);

            if (speed > this.maxSpeed) {
                // Limit vector magnitude to max speed
                var a = Math.atan2(this.dy, this.dx);
                this.dx = this.maxSpeed * Math.cos(a);
                this.dy = this.maxSpeed * Math.sin(a);
            }

            // 保存之前的角度 和位置，对前进一步进行碰撞检查
            var oldX = this.node.x;
            var oldY = this.node.y;

            var oldAngle = this.node.rotation;

            // Attempt X movement
            this.node.x += this.dx * dt;

            collObj = false; //todo - 碰撞检查 碰撞到了对象,返回之前位置
            if (collObj) {
                this.node.x = oldX;
                this.dx = 0;
            }

            this.node.y -= this.dy * dt;

            collObj = false; // //todo - 碰撞检查  碰撞到了对象,返回之前位置
            if (collObj) {
                this.node.y = oldY;
                this.dy = 0;
            }

            ax = Math.round(this.dx * 1000000) / 1000000
            ay = Math.round(this.dy * 1000000) / 1000000

            //只要物体还在运动而不被固体阻挡，就要应用角度。
            if ((ax !== 0 || ay !== 0) && this.node.rotation!==null) {
                if (this.angleMode === ANGLE_MODE.degree90) // 90 degree intervals
                    this.node.rotation = Math.round(cc.misc.radiansToDegrees(Math.atan2(ay, ax)) / 90.0) * 90.0;
                else if (this.angleMode === ANGLE_MODE.degree45) // 45 degree intervals
                    this.node.rotation = Math.round(cc.misc.radiansToDegrees(Math.atan2(ay, ax)) / 45.0) * 45.0;
                else if (this.angleMode === ANGLE_MODE.degree360) // 360 degree
                    this.node.rotation = cc.misc.radiansToDegrees( Math.atan2(ay, ax) );
            }

            if (this.node.rotation != oldAngle) {
                collObj = false; // //todo - 碰撞检查  碰撞到了对象,返回之前角度
                if (collObj) {
                    this.node.rotation = oldAngle;
                }
            }

        }

        

    }

    // 丢失焦点，暂停键盘操作
	private onWindowBlur(){
		this.upKey = false;
		this.downKey = false;
		this.leftKey = false;
		this.rightKey = false;
    }

}
