/*
 * @Author: wss 
 * @Date: 2019-04-17 22:43:26 
 * @Last Modified by: wss
 * @Last Modified time: 2019-06-14 01:51:25
 */

const {ccclass, property} = cc._decorator;


/**修复sin cos 运算极小值误差 */
const round6dp = function (x)
{
    return Math.round(x * 1000000) / 1000000;
};

enum STATE_MODE {
    STOP,
    MOVE,
    JUMP,
    FALL,
    LAND,
    STOMP
}

enum SIMULATE_CONTROL {
    LEFT,
    RIGHT,
    JUMP
}



/**
 * [开发中] 平台跳跃/Platform ver 0.0.0
 */
@ccclass
export default class BhvPlatform extends cc.Component {

    /**最大移动速度 */
    @property
    maxSpeed:number = 330;

    /**移动加速度 */
    @property
    acceleration:number = 1500;

    /**移动减速度 */
    @property
    deceleration:number = 1500;

    /**跳跃力量 */
    @property
    jumpStrength:number = 650

    /**重力加速度 */
    @property
    gravity:number = 1500;
    
    /**最大下落速度 */
    @property
    maxFallSpeed:number = 1000;
    
    /**可以跳跃的次数 */
    @property
    jumpCountMax:number = 2;

    /**启用墙跳 */
    @property
    enableWallJump:boolean = false;

    /**启用滑墙 */
    @property
    stompEnabled:boolean = false;

    /**滑墙力度 */
    @property
    stompStrength:boolean = false;

    @property({tooltip:'根据按键时长ms 决定 跳跃能够达到最大的高度'})
    jumpSustain:number = 0;


    @property
    defaultControls:boolean = true;

    /** 是否忽略玩家的输入 */
    ignoringInput:boolean = false;

    // 按键状态
    private _leftKey = false;
    private _rightKey = false;
    private _jumpKey = false;
    private _jumped = false;			// prevent bunnyhopping
    private _isJumping = false;			// Helper for Jump control
    private _stomped = false;
    private jumpControl:boolean = true;

    // 模拟控制状态
    private simLeft = false;
    private simRight = false;
    private simJump = false;

    // Last floor collide for moving platform
    private lastFloorObject = null;
    private loadFloorObject = -1;
    private lastFloorPos:cc.Vec2 = cc.v2(0,0);
    private floorIsJumpthru = false;
    private wasOnFloor = false;
    private wasOverJumpthru = false;

    private animMode:STATE_MODE = STATE_MODE.STOP;

    private fallthrough = 0;			// fall through jump-thru.  >0 to disable, lasts a few ticks
    private firstTick = true;

    // Movement
    private delta:cc.Vec2 =cc.v2(0,0);

    /**已跳跃的次数 */
    private _jumpedCount = 0;
    private collisionFlagX:1|0|-1 = 0;
    private collisionFlagY:1|0|-1 = 0;
    
    // 键位
    private downx  = 0;
    private downy = 0;
    private rightx = 0;
    private righty =0;
    private g = 0;
    private ga = 0;

    /** 墙跳时的潜在加速度，有助于在跳墙时刺激玩家墙跳 */
    private potencialAcc = 0;
    /* Helper to reset some events after certain ammount of ticks
    * Currently is used by Wall jump, when we reset the potentialAcc to
    * 0 after some ticks
    */
    private tickCount = 0;
    private lastTickCount = 0;
    private isStickWall = false;
    private _onBlurCallback:any = null;

    
    public get gravityDirection() : -1|1 {
        return this.gravity<0?-1:1;
    }
    
    //生命周期函数

    onLoad(){

    }

    start () {

    }

    onEnable() {
        if (this.defaultControls){
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

    }

    onDisable() {
        this.lastFloorObject = null;

        if (this.defaultControls){
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
            if (this._onBlurCallback && cc.sys.isBrowser) cc.game.canvas.removeEventListener('blur', this._onBlurCallback);
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let keyCode:number = event.keyCode;
        let key = cc.macro.KEY;
        switch (keyCode) {
            case key.left: // left
                this._leftKey = true;
                break;
            case key.space: // up
                this._jumpKey = true;
                break;
            case key.right: // right
                this._rightKey = true;
                break;
        }

    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        let keyCode: number = event.keyCode;
        let key = cc.macro.KEY;
        switch (keyCode) {
            case key.left: // left
                this._leftKey = false;
                break;
            case key.space: // up
                this._jumpKey = false;
                break;
            case key.right: // right
                this._rightKey = false;
                break;
        }

    }

    // 丢失焦点，暂停键盘操作
    private onWindowBlur() {
        this._jumpKey = false;
        this._leftKey = false;
        this._rightKey = false;
    }

    //碰撞状态发生情况
    onCollisionEnter (other, self) {

        //this._jumpCount = 0;
        
        let otherAabb = other.world.aabb;
        let otherPreAabb = other.world.preAabb.clone();

        let selfAabb = self.world.aabb;
        let selfPreAabb = self.world.preAabb.clone();
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb))
            {
                if (this.delta.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax))
                    {
                        if (Math.abs(selfPreAabb.yMin - otherPreAabb.yMax) < 0.3)
                            {
                                this.collisionFlagX = 0;
                            }
                        else
                            this.collisionFlagX = -1;
                    }
                else if (this.delta.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin))
                    {
                        if (Math.abs(selfPreAabb.yMin - otherPreAabb.yMax) < 0.3)
                            {
                                this.collisionFlagX = 0;
                            }
                        else
                            this.collisionFlagX = 1;
                    }

                this.delta.x = 0;
                //other.touchingX = true;

                return;
            }
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb))
            {
                if (this.delta.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax))
                    {
                        this.node.y = otherPreAabb.yMax - this.node.getParent().y;
                        this._isJumping = false;// 碰到砖块接触跳跃状态
                        this.collisionFlagY = -1;
                    }
                else if (this.delta.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin))
                    {
                        this.node.y = otherPreAabb.yMin - selfPreAabb.height - this.node.getParent().y;
                        this.collisionFlagY = 1;
                    }
                else{
					
                    this.collisionFlagY = 0;

                    if ((selfPreAabb.xMax == otherPreAabb.xMin))
                    {
                        //this.fallDown = true;
                    }

                }
                
                this.delta.y = 0;
                //other.touchingY = true;
            }

    }

    //保持碰撞的状况
    onCollisionStay(other,self){

    }

    // 结束碰撞的状况
    onCollisionExit(other,self){
        
    }

    update(dt){
        let mx, my, obstacle, mag, allover, i, len, j, oldx, oldy,landed;
        
		if (!this._jumpKey && !this.simJump) this._jumped = false;
			
		let left = this._leftKey || this.simLeft;
		let right = this._rightKey || this.simRight;
        let jump = (this._jumpKey || this.simJump) && !this._jumped;
        
		this.simLeft = this.simRight = this.simJump = false; //清除模拟按键
		if (!this.enabled) return;
		if (this.ignoringInput) left = right = jump = false;// 忽略所有的按键输入
		
		let lastFloor = this.lastFloorObject;
    
        
		// 判断是否在地面上
		let floor_ = this.getOnTheFloor();
		
		if (this.collisionFlagY == -1) {
			/* reset jumping vars, it landed */
			this._isJumping = false;
			this._jumpedCount = 0;
			this._stomped = false;
			
			if (this.delta.y > 0) {
				// By chance we may have fallen perfectly to 1 pixel above the floor, which might make
				// isOnFloor return true before we've had a pushOutSolid from the floor to make us sit
				// tightly on it.  So we might actually be hovering 1 pixel in the air.  To resolve this,
				// if this is the first landing issue another pushInFractional.
				if (!this.wasOnFloor) {
					//this.pushInFractional(this.node, -this.downx, -this.downy, floor_, 16);
					this.wasOnFloor = true;
				}
					
				this.delta.y = 0;
			}

			// First landing on the floor or floor changed
			if (lastFloor != floor_) {
				this.lastFloorObject = floor_;
				this.lastFloorPos.x = floor_.x;
				this.lastFloorPos.y = floor_.y;

			}

			/* JUMP -------------------------------------------------------------- */
			if (jump) {	
		
				// Check we can move up 1px else assume jump is blocked.
				oldx = this.node.x;
				oldy = this.node.y;
				this.node.x -= this.downx;
                this.node.y -= this.downy;
                
                //判断允许 jump (没有碰撞任何东西?)
				if ((this.collisionFlagY === 0) && ( this.collisionFlagX ===0) ) { //this.testOverlapSolid(this.node)
					this.delta.y = -this.jumpStrength;
                    this.animMode = STATE_MODE.JUMP;
                    
					// Prevent bunnyhopping: dont allow another jump until key up
                    this._jumped = true;
                    this._jumpedCount++;
					
					// Check if jump control is enabled
					//if (this.jumpControl == 1) {
						this._isJumping = true;
					//}
					
				} else {
					jump = false;
				}
				this.node.x = oldx;
				this.node.y = oldy;
			}
		}
		// Not on floor: apply gravity
		else {
			this.lastFloorObject = null;
			
			this.delta.y += this.gravity * dt;
			
			// Cap to max fall speed
			if (this.delta.y > this.maxFallSpeed)this.delta.y = this.maxFallSpeed;
				
			// 仍然设置跳跃标志以防止双击跳跃
			if (jump)this._jumped = true;
            
            
			/* Double JUMP -------------------------------------------------------------- */
			if (jump && this._jumpedCount<this.jumpCountMax && !this.isStickWall) {	
				// Check we can move up 1px else assume jump is blocked.
				oldx = this.node.x;
				oldy = this.node.y;
				this.node.x -= this.downx;
				this.node.y -= this.downy;
		
				let obstacleSide = this.collisionFlagX !==0;  //this.testOverlapSolid(this.node);
				console.log("overlapping Side: " + obstacleSide);
				if ( this.collisionFlagY === 0&& this.collisionFlagX ===0 ) { // - !this.testOverlapSolid(this.node)
					this.delta.y = -this.jumpStrength;
                    this.animMode = STATE_MODE.JUMP;//跳跃状态切换
					// 多段跳增加 一次
                    this._jumpedCount++;
                    
					// Check if jump control is enabled
					if (this.jumpControl == true)this._isJumping = true;
					
				} else {
					jump = false;
				}
					
				this.node.x = oldx;
                this.node.y = oldy;
                
			}/* STOMP -------------------------------------------------------------- */			
			else if (jump && this.stompEnabled && !this._stomped && !this.isStickWall) {	
				console.log("stomp");
				this.delta.y = +this.stompStrength;
				// Trigger On Stomp
				this.animMode = STATE_MODE.STOMP;
				this._stomped = true;
			}
		}
		
		this.wasOnFloor = !!floor_;

        

        //仍以负向量y跳跃时，跳跃游戏按钮释放时，我们重置 y向量为0,就会停止加速了
        //释放后，我们将速度重置为0，所以它停止加速 
		if (this.isJumping && !this._jumped && (this.delta.y < 0)) {
			this.delta.y = this.delta.y/2;
			this._isJumping = false;
		}
		
        // 未按下按键时，应用 水平方向的减速度
		if (left == right)	// 包括LEFT 和 RIGHT 按键同时按下的情况
		{
			if (this.delta.x < 0)
			{
				this.delta.x += this.deceleration * dt;
				
				if (this.delta.x > 0)
					this.delta.x = 0;
			}
			else if (this.delta.x > 0)
			{
				this.delta.x -= this.deceleration * dt;
				
				if (this.delta.x < 0)
					this.delta.x = 0;
			}
		}
		
		// 应用加速度
		if (left && !right) {
			// 向与当前运动相反的方向移动：添加减速度
			if (this.delta.x > 0)
				this.delta.x -= (this.acceleration + this.deceleration) * dt - this.potencialAcc;
			else
				this.delta.x -= this.acceleration * dt - this.potencialAcc;
		}
		if (right && !left) {
			if (this.delta.x < 0)
				this.delta.x += (this.acceleration + this.deceleration) * dt - this.potencialAcc;
			else
				this.delta.x += this.acceleration * dt - this.potencialAcc;
		}
		
		// 限制最大速度
		if (this.delta.x > this.maxSpeed)
			this.delta.x = this.maxSpeed;
		else if (this.delta.x < -this.maxSpeed)
			this.delta.x = -this.maxSpeed;
		
		if (this.delta.x !== 0) {		
			// Attempt X movement
			oldx = this.node.x;
			oldy = this.node.y;
			mx = this.delta.x * dt * this.rightx;
			my = this.delta.x * dt * this.righty;
            
            
            //检查1 px 横向 和1 px向上是否是空闲的。否则，斜坡太陡了，无法被攀登。
			this.node.x += this.rightx * (this.delta.x > 1 ? 1 : -1) - this.downx;
			this.node.y += this.righty * (this.delta.x > 1 ? 1 : -1) - this.downy;
		
			
			let is_jumpthru = false;
			
			let slope_too_steep = this.testOverlapSolid(this.node);
			
			/*
			if (!slope_too_steep && floor_)
			{
				slope_too_steep = this.testOverlapJumpThru(this.node);
				is_jumpthru = true;
				
				// Check not also overlapping jumpthru from original position, in which
				// case ignore it as a bit of background.
				if (slope_too_steep)
				{
					this.node.x = oldx;
					this.node.y = oldy;
					this.node.set_bbox_changed();
					
					if (this.testOverlap(this.node, slope_too_steep))
					{
						slope_too_steep = null;
						is_jumpthru = false;
					}
				}
			}
			*/

			// 移回来，并且移动真实的值
			this.node.x = oldx + mx;
			this.node.y = oldy + my;
	
			// 测试墙壁侧面是否重叠了
			obstacle = this.testOverlapSolid(this.node);
			//console.log(obstacle);
			if (!obstacle && floor_){
				obstacle = this.testOverlapJumpThru(this.node);
				
				// Check not also overlapping jumpthru from original position, in which
				// case ignore it as a bit of background.
				if (obstacle) {
					this.node.x = oldx;
					this.node.y = oldy;
					
					if (this.testOverlap(this.node, obstacle))
					{
						obstacle = null;
						is_jumpthru = false;
					}
					else
						is_jumpthru = true;
						
					this.node.x = oldx + mx;
					this.node.y = oldy + my;
				}
			}
			
			// 判断是否贴着墙壁
			if (obstacle && !floor_ && (this.delta.y > 0) && this.enableWallJump) {
				this.isStickWall = true;
				//console.log("Is against wall");
				this.delta.y = this.delta.y/2;
				
				/* 蹭墙跳 -------------------------------------------------------------- */
					if (jump) {	
						console.log("wallJump");
						// Check we can move up 1px else assume jump is blocked.
						oldx = this.node.x;
						oldy = this.node.y;
						this.node.x -= this.downx;
						this.node.y -= this.downy;
						//console.log("wall jump overlaping: " + !this.testOverlapSolid(this.node));
						if (this.testOverlapSolid(this.node)) {
							//console.log("ok =)");
							//this.ignoreInput = true;
							this.delta.y = -this.jumpStrength;
							this.potencialAcc = 200;
                            this.lastTickCount = this.tickCount;

							
							// Trigger On Jump
							this.animMode = STATE_MODE.JUMP;
							
							// Prevent bunnyhopping: dont allow another jump until key up
							//this.doubleJumped = true;
							
							// Check if jump control is enabled
							if (this.jumpControl == true) {
								this._isJumping = true;
							}
							
						} else {
							jump = false;
						}
							
						this.node.x = oldx;
						this.node.y = oldy;
					}
			} else {
                this.isStickWall = false;
            }

            // 如果贴着墙壁的话
			if (obstacle) {
				//console.log("Obstacle: " + obstacle);
				// First try pushing out up the same distance that was moved horizontally.
				// If this works it's an acceptable slope.
				let push_dist = Math.abs(this.delta.x * dt) + 2;
				
				if (slope_too_steep || !this.pushOutSolid(this.node, -this.downx, -this.downy, push_dist, is_jumpthru, obstacle)) {
					// Failed to push up out of slope.  Must be a wall - push back horizontally.
					// Push either 2.5x the horizontal distance moved this tick, or at least 30px.
					//this.registerCollision(this.node, obstacle);
					push_dist = Math.max(Math.abs(this.delta.x * dt * 2.5), 30);
					
					
					
					// Push out of solid: push left if moving right, or push right if moving left
					if (!this.pushOutSolid(this.node, this.rightx * (this.delta.x < 0 ? 1 : -1), this.righty * (this.delta.x < 0 ? 1 : -1), push_dist, false))
					{
						// Failed to push out of solid.  Restore old position.
						this.node.x = oldx;
						this.node.y = oldy;
					} else if (floor_ && !is_jumpthru && !this.floorIsJumpthru) {
					


                        //水平推出墙成功。玩家可能在斜坡上，在这种情况下，他们可能会在空中稍稍盘旋。
                        //因此，将1像素推到地面上，然后再次推出。

						oldx = this.node.x;
						oldy = this.node.y;
						this.node.x += this.downx;
						this.node.y += this.downy;
						
						if (this.testOverlapSolid(this.node))
						{
							if (!this.pushOutSolid(this.node, -this.downx, -this.downy, 3, false))
							{
								// Failed to push out of solid.  Restore old position.
								this.node.x = oldx;
								this.node.y = oldy;
							}
						}
						else
						{
							// Not over a solid. Put it back.
							this.node.x = oldx;
							this.node.y = oldy;
						}
					}
					
					if (!is_jumpthru)
						this.delta.x = 0;	// stop
				}
				else if (!slope_too_steep && !jump && (Math.abs(this.delta.y) < Math.abs(this.jumpStrength / 4)))
				{
                    //一定是从斜坡上推出来的。当从侧面跳到平台上时，将dy设置为0可处理罕见的边缘情况，
                    //从而在着陆时触发坡度检测。
					this.delta.y = 0;
					
                    //在这种罕见的情况下，如果玩家不在地板上，他们可能落地时从未摔倒过。
                    //这意味着“着陆”不会触发，所以现在就触发它。 
					if (!floor_)landed = true;
				}
			}
			else
			{
				// 以前在地板上，但现在不是了
				let newfloor = this.getOnTheFloor();
				if (floor_ && !newfloor)
				{

                    //水平移动，但不重叠任何内容。
                    //向下推在一定程度上保持脚在向下的斜坡上。 
					mag = Math.ceil(Math.abs(this.delta.x * dt)) + 2;
					oldx = this.node.x;
					oldy = this.node.y;
					this.node.x += this.downx * mag;
					this.node.y += this.downy * mag;
					
					if (this.testOverlapSolid(this.node) || this.testOverlapJumpThru(this.node))
						this.pushOutSolid(this.node, -this.downx, -this.downy, mag + 2, true);
					else
					{
						this.node.x = oldx;
						this.node.y = oldy;
					}
				}
				else if (newfloor && this.delta.y === 0)
				{
					// 轻轻地推到地板上，确保玩家紧紧地站在地面上。
					this.pushInFractional(this.node, -this.downx, -this.downy, newfloor, 16);
				}
			}
		}
		
		landed = false;
		
		if (this.delta.y !== 0)
		{
			// Attempt Y movement
			oldx = this.node.x;
			oldy = this.node.y;
			this.node.x += this.delta.y * dt * this.downx;
			this.node.y += this.delta.y * dt * this.downy;
			let newx = this.node.x;
			let newy = this.node.y;
			
	 		let collobj = this.testOverlapSolid(this.node);
			
			let fell_on_jumpthru = false;
			
			if (!collobj && (this.delta.y > 0) && !floor_)
			{
				// Get all jump-thrus currently overlapping
				allover = this.fallthrough > 0 ? null : this.testOverlapJumpThru(this.node, true);
				
				// Filter out all objects it is not overlapping in its old position
				if (allover && allover.length)
				{
					// Special case to support vertically moving jumpthrus.
					if (this.wasOverJumpthru)
					{
						this.node.x = oldx;
                        this.node.y = oldy;
                        						
						for (i = 0, j = 0, len = allover.length; i < len; i++)
						{
							allover[j] = allover[i];
							
							if (!this.testOverlap(this.node, allover[i]))
								j++;
						}
						
						allover.length = j;
							
						this.node.x = newx;
                        this.node.y = newy;
                        
					}
					
					if (allover.length >= 1)
						collobj = allover[0];
				}
				
				fell_on_jumpthru = !!collobj;
			}
			
			if (collobj)
			{
				//this.registerCollision(this.node, collobj);
				
				// Push either 2.5x the vertical distance (+10px) moved this tick, or at least 30px.
				let push_dist = Math.max(Math.abs(this.delta.y * dt * 2.5 + 10), 30);
				
				// Push out of solid: push down if moving up, or push up if moving down
				if (!this.pushOutSolid(this.node, this.downx * (this.delta.y < 0 ? 1 : -1), this.downy * (this.delta.y < 0 ? 1 : -1), push_dist, fell_on_jumpthru, collobj))
				{
					// Failed to push out of solid.  Restore old position.
					this.node.x = oldx;
					this.node.y = oldy;
					this.wasOnFloor = true;		// prevent adjustment for unexpected floor landings
				}
				else
				{
					this.lastFloorObject = collobj;
					this.lastFloorPos.x = collobj.x;
					this.lastFloorPos.y = collobj.y;
					
					// Make sure 'On landed' triggers for landing on a jumpthru
					if (fell_on_jumpthru)
						landed = true;
				}
				
				this.delta.y = 0;	// stop
			}
		}
		
		// Run animation triggers
		
		// 已经开始下坠了吗？
		if (this.animMode !== STATE_MODE.FALL && this.delta.y > 0 && !floor_)
		{
			this.animMode = STATE_MODE.FALL;
		}
		
		// 是否站在地板上呢？
		if (floor_ || landed)
		{
			//正在下落吗？（即刚刚着陆）或已经跳了，但跳被阻止了
			if (this.animMode === STATE_MODE.FALL || landed || (jump && this.delta.y === 0))
			{
	
				if (this.delta.x === 0 && this.delta.y === 0)
					this.animMode = STATE_MODE.STOP;
				else
					this.animMode = STATE_MODE.MOVE;
			}
			//刚刚降落：处理正常移动/停止的触发器
			else
			{
				if (this.animMode !== STATE_MODE.STOP && this.delta.x === 0 && this.delta.y === 0)
				{
					this.animMode = STATE_MODE.STOP;
				}
				
				// 已经开始移动，并且处于在地板上？
				if (this.animMode !== STATE_MODE.MOVE && (this.delta.x !== 0 || this.delta.y !== 0) && !jump)
				{
					this.animMode = STATE_MODE.MOVE;
				}
			}
		}
		
		if (this.fallthrough > 0)this.fallthrough--;
			
        this.wasOverJumpthru = this.testOverlapJumpThru(this.node);
        
        this.node.x += this.delta.x;
        this.node.y -= this.delta.y;


    }

    updateGravity(){
		// down vector
		this.downx = Math.cos(this.ga);
		this.downy = Math.sin(this.ga);
		
		// right vector
		this.rightx = Math.cos(this.ga - Math.PI / 2);
		this.righty = Math.sin(this.ga - Math.PI / 2);
		
		// get rid of any sin/cos small errors
		this.downx = round6dp(this.downx);
		this.downy = round6dp(this.downy);
		this.rightx = round6dp(this.rightx);
		this.righty = round6dp(this.righty);
		
		this.g = this.gravity;
		
		// gravity is negative (up): flip the down vector and make gravity positive
		// (i.e. change the angle of gravity instead)
		if (this.gravity < 0) {
			this.downx *= -1;
			this.downy *= -1;
			this.gravity = Math.abs(this.g);
        }
        
    }

    onDestroy(){
        //  解除引用关系
        this.lastFloorObject = null;
    }

    pushOutSolid(...params):any{
  
    }

    pushInFractional(...params):any{
        
    }

    testOverlap(...params):any{
        
    }

    testOverlapSolid(...params):any{
       
    }

    testOverlapJumpThru(...params):any{
    
    }

    //状态判断条件

    /** 正在贴墙 */
    isByWall():boolean{
        return false;
    }

    /**正在下降 */
    isFalling():boolean{
        return this.delta.y > 0;
    }

    /** 正在跳跃 */
    isJumping():boolean{
        return this.delta.y < 0;
    }

    /**正在移动 */
    isMoving():boolean{
        return false;
    }

    /** 是否在地板上 */
    isOnFloor():boolean{
        return false;
    }

    /**正在地面 */
    getOnTheFloor():any{
        var ret = null;
		var ret2 = null;
		var i, len, j;
		
		// Move object one pixel down
		var oldx = this.node.x;
		var oldy = this.node.y;
		this.node.x += this.downx;
		this.node.y += this.downy;
		
		// See if still overlapping last floor object (if any)
		if (this.lastFloorObject && this.testOverlap(this.node, this.lastFloorObject)) {
			// Put the object back
			this.node.x = oldx;
			this.node.y = oldy;
			return this.lastFloorObject;
		} else {
			ret = this.testOverlapSolid(this.node);
			
			if (!ret && this.fallthrough === 0)
				ret2 = this.testOverlapJumpThru(this.node, true);
			
			// Put the object back
			this.node.x = oldx;
			this.node.y = oldy;
			
			if (ret)		// was overlapping solid
			{
				// If the object is still overlapping the solid one pixel up, it
				// must be stuck inside something.  So don't count it as floor.
				if (this.testOverlap(this.node, ret))
					return null;
				else
					return ret;
			}
			
			// Is overlapping one or more jumpthrus
			if (ret2 && ret2.length) {
				// Filter out jumpthrus it is still overlapping one pixel up
				for (i = 0, j = 0, len = ret2.length; i < len; i++) {
					ret2[j] = ret2[i];
					
					if (!this.testOverlap(this.node, ret2[i]))
						j++;
				}
				
				// All jumpthrus it is only overlapping one pixel down are floor pieces/tiles.
				// Return first in list.
				if (j >= 1) {
					this.floorIsJumpthru = true;
					return ret2[0];
				}
			}
			
			return null;
		}
    }

    /**正在下滑 */
    isStomping():boolean{
        return this._stomped;
    }


    //平台跳跃操作

    /**掉下可穿透平台 */
    fallThrough(){
		// Test is standing on jumpthru 1px down
		var oldx = this.node.x;
		var oldy = this.node.y;
		this.node.x += this.downx;
        this.node.y += this.downy;
        	
		var overlaps = false;//this.testOverlapJumpThru(this.node, false);
		this.node.x = oldx;
		this.node.y = oldy;
		
		if (!overlaps)return;
		// disable jumpthrus for 3 ticks (1 doesn't do it, 2 does, 3 to be on safe side)
		this.fallthrough = 3;			
		this.lastFloorObject = null;
    }
    
    /**运动向量 */
    setVector(vec2:cc.Vec2){

    }

    /**设置重力方向 */
    setGravityAngle(angle)
	{
		angle = cc.misc.degreesToRadians(angle);	
		if (this.ga === angle)return;	
		this.ga = angle;
		this.updateGravity();
		// 如果重力方向改变，允许从当前地板下落。
		this.lastFloorObject = null;
	};

    /**模拟操作 */
    simulate(ctrl:SIMULATE_CONTROL){
        switch (ctrl) {
            case SIMULATE_CONTROL.LEFT:
                
                break;
            case SIMULATE_CONTROL.RIGHT:
                
                break;
            case SIMULATE_CONTROL.JUMP:
                
                break;
            default:
                break;
        }
    }





    // update (dt) {}
}





