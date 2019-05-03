/*
 * @Author: ws.s 
 * @Date: 2018-12-06 16:11:31 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-19 01:15:31
 */


const { ccclass, property, menu, disallowMultiple,requireComponent} = cc._decorator;

enum FOLLOW_TYPE {
    /** 跟随玩家，且不使用 dead zone. */
    LOCK_ON,
    /** 一种跟随风格，使用高，窄的死区（0.33x 0.125），中心略高于视图中心。 */
    PLATFORM,
    /** 使用方形 dead zone 的后续样式（较大视图边缘的0.25）。 */
    TOP_DOWN,
    /** 使用小的方格 dead zone（较大视图边缘的0.125）的后续样式。 */
    TOP_DOWN_TIGHT,
}

enum SHAKE_TYPE {
    SHAKE_BOTH,
    SHAKE_HORIZONTAL,
    SHAKE_VERTICAL
}


// todo 解决 deadzone 问题, 在 follow 时角色不会对齐 deadzone 中心
// watch() 和 watchAt() 暂时切换摄像机的目标对象/ 或 X / Y 的位置上, 停留一段时间后返回。
// 看情况移除 atLimit 或者 bounds 功能 (但是，或许可以保留....)
// 如果想要来回在目标之间切换，请使用 follow(),改变目标


/**
 * [测试阶段]相机高级拓展 ver 0.1
 * 可以拓展cc 相机的基本能力,实现 移动 跟随 deadzone flash shake scale 等常用功能
 */
@ccclass
@menu("添加特殊行为/Helper/Camera Extra (相机拓展)")
@disallowMultiple
@requireComponent(cc.Camera)
export default class BhvCameraExtra extends cc.Component {
    /**debug,显示相机 debug 信息 */
    @property
    debug: boolean = true;

    /**摄像机目标节点 */
    @property(cc.Node)
    target: cc.Node = null;

    @property({
        displayName: 'Follow Type',
        tooltip:'跟随的类型,不同跟随类型的 deadzone 不同\n deadzone的区域指镜头不会跟随范围',
        type: cc.Enum(FOLLOW_TYPE)
    })
    initFollowType: FOLLOW_TYPE = FOLLOW_TYPE.LOCK_ON


    @property({
        tooltip:'是否激活相机的旋转功能,\n非正常方式，非常消耗性能',
    })
    ENABLE_ROTATE: boolean = false;

    @property({
        visible:function(){return this.ENABLE_ROTATE},
        tooltip:'控制需要旋转的节点，进行旋转，通常是游戏图层。尽量保持较少节点旋转',
        type:[cc.Node]
    })
    rotateNodes:Array<cc.Node> = [];

    /** 是否激活相机特效 */
    @property
    ENABLE_FX: boolean = true;
    
    /**保证相机运动的坐标点为整数 像素 */
    @property
    roundPx: boolean = true;

    camera: cc.Camera = null;

    /**this.view.x */
    get x() {
        return this.view.x;
    }
    set x(value: number) {
        this.view.x = value;
        if (this.bounds) this.checkBounds();
    }

    /**this.view.y */
    get y() {
        return this.view.y;
    }
    set y(value: number) {
        this.view.y = value;
        if (this.bounds) this.checkBounds();
    }

    /**相机绑定的节点的 宽度 */
    get width() {
        let canvas = cc.Canvas.instance;
        if(!canvas)return 0;
        return canvas.node.getContentSize().width;
    }
 
    /**相机绑定的节点的 高度 */
    get height() {
        let canvas = cc.Canvas.instance;
        if(!canvas)return 0;
        return canvas.node.getContentSize().height;
    }
 

    /** 相机抖动强度 */
    get shakeIntensity() {
        return this._shake.intensity;
    }
    set shakeIntensity(value: number) {
        this._shake.intensity = value;
    }

    /**修正后的视野 */
    get fixedView() {
        this._fxConfig.fixedView.set(cc.rect(0, 0, this.view.width, this.view.height))
        return this._fxConfig.fixedView;
    }

    /**相机震动参数 */
    private _shake = {
        intensity: 0,
        duration: 0,
        horizontal: false,
        vertical: false,
        shakeBounds: true,
        x: 0,
        y: 0
    };

    /**相机控制节点,相机启动时会自动生成 */
    private _ctrlNode:cc.Node;

    /**fx 参数 */
    private _fxConfig = {
         opacity:255,
         color:cc.color(0,0,0),
        /**进行时间，为0停止绘制特效 */
         duration: 0,
         /**画面特效类型 0-闪烁 1- fadeIn 2- fadeOut  */
         type:0,
         /**修正画面视野 */
         fixedView:new cc.Rect
    }

    /**相机跟随类型 */
    static FOLLOW_TYPE = FOLLOW_TYPE;

    /**相机震动类型 */
    static SHAKE_TYPE = SHAKE_TYPE;

    /**
    *相机视图。
    *进入我们希望渲染的世界（默认情况下，游戏尺寸）。
    *x/y值是世界坐标，而不是屏幕坐标，宽度/高度是渲染多少像素。
    */
    view: cc.Rect;

    /**这台照相机是否与世界范围的平齐。 */
    atLimit = { x: false, y: false };

    /**
    *相机绑定到这个矩形，不能移动到它之外。默认情况下，它被启用并设置为世界的大小。
    *矩形可以位于世界上任何地方，并按您喜欢的方式更新。
    *如果你不希望相机被束缚,可以将此设置为空。
    */
    bounds: cc.Rect;

    /** 移动到该 矩形区域内，相机不会发生运动。这参考了一些平台跳跃游戏的做法 */
    deadzone: cc.Rect;

    /**X,Y 方向的线性插值 */
    lerp: cc.Vec2 = cc.v2(1, 1);


    /**临时目标坐标点 */
    private _targetPosition: cc.Vec2 = cc.v2();

    /** deadzone 边界 */
    private _edge: number = 0;

    /**
     * 相机特效组件,在相机创建时自动生成一个节点，
     * 使用fx前提是，相机节点必须位于最高层级
     */
    private fx: cc.Graphics;

    /** debug 使用的 绘图环境 */
    private _fx_debug: cc.Graphics;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        
        //加载相机，以及相机所需节点
        let canvas: cc.Node = cc.find('Canvas');
        this.view = cc.rect(canvas.x,canvas.y,canvas.width,canvas.height);
        this.camera = this.node.getComponent(cc.Camera);

        //添加相机用控制节点 (防止影响原相机)
        this._ctrlNode = new cc.Node('ctrl');
        this._ctrlNode.setAnchorPoint(0.5,0.5);
        this._ctrlNode.setScale(1);

        this.node.addChild(this._ctrlNode);

        //创建摄像机特效用的绘制组件,例如闪烁
        if (this.ENABLE_FX == true) {
            let node = new cc.Node('fx');
            node.addComponent(cc.Graphics);
            this.node.addChild(node);
            this.fx = node.getComponent(cc.Graphics);
            this.fx.clear();
        }

        //创建debug用绘制节点组件
        if (this.debug == true) {
            let node2 = new cc.Node('fx2');
            node2.addComponent(cc.Graphics);
            this.node.addChild(node2);
            this._fx_debug = node2.getComponent(cc.Graphics);
    
        }

    }

    start() {

        /**开始跟随节点 */
        if (this.target) this.follow(this.target, this.initFollowType,0.18, 0.08);
        //this.target = null;

        //let carNode = cc.find('Canvas/LayerGame').getChildByName('car');

        //测试相机摇晃和闪烁功能
        this.scheduleOnce(() => {
            this.flash(cc.color(255, 0, 0), 0.5, true, 100);
            this.shake(0.01,1,true,SHAKE_TYPE.SHAKE_BOTH);  
            //this.run(cc.moveTo(2,100,100))
            //this.run(cc.rotateTo(2,180));   
            //this.run(cc.scaleTo(2,2));   
            //this.focusOnXY(cc.v2(516,482));
        }, 0.5);

        this.scheduleOnce(() => {
            //this.run(cc.moveTo(2,0,0))
            //this.run(cc.rotateTo(2,0));   
            //this.run(cc.scaleTo(2,1));   
            //this.focusOnXY(cc.v2(carNode.x,carNode.y));
        }, 2.5);


    }

    /**绘制debug的 图形内容*/
    protected updateDebug() {
        //创建摄像机debug框,比如闪烁
        if (!this.debug) return;
        let ctx: cc.Graphics = this._fx_debug;
        let rect = this.deadzone;
        let node = this._ctrlNode;
        let target = this.target;
        //描述 deadzone ,死区
        ctx.clear();

        if(rect){
            ctx.rect(rect.x , rect.y , rect.width, rect.height);
            ctx.lineWidth = 2;
            ctx.strokeColor = cc.color(0, 255, 0,100);
            ctx.stroke()
        }

        //描述 相机镜头的相对位移
        if(node){
            //绘制镜头十字线
            ctx.moveTo(-40,0);
            ctx.lineTo(40,0);
            ctx.lineWidth = 2;
            ctx.strokeColor = cc.color(0, 255, 0,100);
            ctx.stroke()
            ctx.moveTo(0,40);
            ctx.lineTo(0,-40);
            ctx.lineWidth = 2;
            ctx.strokeColor = cc.color(0, 255, 0,100);
            ctx.stroke()

            //绘制镜头偏移线
            ctx.moveTo(0,0);
            ctx.lineTo(node.x,node.y);
            ctx.lineWidth = 8;
            ctx.strokeColor = cc.color(0, 255, 0,50);
            ctx.stroke()
        }

        if(target){
            let pos = cc.v2(this._targetPosition.x,this._targetPosition.y); 
            let out = cc.v2();
            this.camera.getWorldToCameraPoint(pos,out);
            ctx.moveTo(-40+out.x,0+out.y);
            ctx.lineTo(40+out.x,0+out.y);
            ctx.lineWidth = 2;
            ctx.strokeColor = cc.color(255, 0, 0,100);
            ctx.stroke()
            ctx.moveTo(0+out.x,40+out.y);
            ctx.lineTo(0+out.x,-40+out.y);
            ctx.lineWidth = 2;
            ctx.strokeColor = cc.color(255, 0, 0,100);
            ctx.stroke()
        }
      
    }


    /** 用于 cc.Graphics 组件绘制矩形 */
    protected _drawRect(ctx: cc.Graphics, rect: cc.Rect, color: cc.Color = cc.color(155, 155, 255), opacity: number) {
        if (rect == null || !ctx) return
        ctx.rect(rect.x - rect.width / 2, rect.y - rect.height / 2, rect.width, rect.height);
        ctx.fillColor = cc.color(color.getR(), color.getG(), color.getB(), opacity);
        ctx.fill();
    }
  

    update(dt) {

        if (this._fxConfig.duration > 0) this.updateFX(dt);
        if (this._shake.duration > 0) this.updateShake(dt);
        if (this.target) this.updateTarget();

        //绑定节点的旋转，到相机的角度
        if(this.ENABLE_ROTATE && this.rotateNodes){

            for (let i = 0; i < this.rotateNodes.length; i++) {
                const element:cc.Node =  this.rotateNodes[i];
                if(element.rotation !== this._ctrlNode.rotation){
                    element.rotation = this._ctrlNode.rotation;
                }
            }

        }

        //绑定自身节点的缩放,到相机的缩放
        if(this.camera.zoomRatio !== this._ctrlNode.scale){
            this.camera.zoomRatio = this._ctrlNode.scale;
        }

    }

    lateUpdate(){
        if (this.bounds) this.checkBounds();
        if (this.roundPx) {
            //坐标保持整数
            this.view.x = Math.floor(this.view.x);
            this.view.y = Math.floor(this.view.y);
            this.view.width = Math.floor(this.view.width);
            this.view.height = Math.floor(this.view.height);

            this._shake.x = Math.floor(this._shake.x);
            this._shake.y = Math.floor(this._shake.y);
        }

         //绑定节点的坐标，到视角的坐标
        this.node.x = this.view.x +this._shake.x +this._ctrlNode.x;
        this.node.y = this.view.y +this._shake.y +this._ctrlNode.y;
        
        if(this.debug)this.updateDebug();

    }


    /** 更新画面颜色效果 */
    protected updateFX(dt) {

        this.fx.node.scale = 1/this._ctrlNode.scale;
        if (this._fxConfig.type === 0) {
            //  flash - 闪烁
            this.fx.node.opacity -= dt / this._fxConfig.duration * 60;
            if (this.fx.node.opacity <= 0) {
                this._fxConfig.duration = 0;
                this.fx.node.opacity = 0;
                this.fx.clear();
                //this.node.emit('bhvCameraEx','onFlashComplete')
            } else {
                this.fx.clear();
                this._drawRect(this.fx, cc.rect(0, 0, this.view.width, this.view.height), this._fxConfig.color, this.fx.node.opacity);
            }
        }
        else {
            //  fade - 渐隐
            this.fx.node.opacity += dt / this._fxConfig.duration * 60;
            let target = this._fxConfig.opacity;
            if (this.fx.node.opacity >= target) {
                this._fxConfig.duration = 0;
                this.fx.node.opacity = target;
                //this.node.emit('bhvCameraEx','onFadeComplete')
            } else {
                this.fx.clear();
                this._drawRect(this.fx, cc.rect(0, 0, this.view.width, this.view.height), this._fxConfig.color, this.fx.node.opacity);
            }
        }

    }

    /** 更新 震动 */
    protected updateShake(dt) {

        this._shake.duration -= dt;
        let screenWidth:number =  this._shake.intensity * this.view.width * 2 - this._shake.intensity * this.view.width;
        let screenHeight:number =  this._shake.intensity * this.view.height * 2 - this._shake.intensity * this.view.height;

        if (this._shake.duration <= 0) {
            //this.node.emit('camera-shake-completed')
            this._shake.x = 0;
            this._shake.y = 0;
        } else {
            if (this._shake.horizontal) {
                this._shake.x = screenWidth * (Math.random()-0.5);//
            }

            if (this._shake.vertical) {
                this._shake.y =  screenHeight * (Math.random()-0.5);
            }
        }


    }

    /** 更新摄像机目标的移动 */
    protected updateTarget() {

        if (this.deadzone) {
            this._targetPosition.x = this.target.x ;
            this._targetPosition.y = this.target.y ;

            this._edge = this._targetPosition.x - this.view.x;

         
            if (this._edge < this.deadzone.xMin) {
                this.view.x = cc.misc.lerp(this.view.x, this._targetPosition.x -this.deadzone.xMin , this.lerp.x);
            }
            else if (this._edge > this.deadzone.xMax) {
                this.view.x = cc.misc.lerp(this.view.x, this._targetPosition.x -this.deadzone.xMax , this.lerp.x);
            }

          
            this._edge = this._targetPosition.y - this.view.y;

            if (this._edge < this.deadzone.yMin) {
                this.view.y = cc.misc.lerp(this.view.y, this._targetPosition.y -this.deadzone.yMin, this.lerp.y);
            }
            else if (this._edge > this.deadzone.yMax) {
                this.view.y = cc.misc.lerp(this.view.y, this._targetPosition.y -this.deadzone.yMax , this.lerp.y);
            }
           
        }
        else {
            //世界坐标转换，转到符合 相机的坐标位置
            let start = this.target.convertToWorldSpaceAR(cc.Vec2.ZERO);
            let vc  = this.node.getParent().convertToNodeSpaceAR(start);

            this._targetPosition.x = vc.x;//this.target.x;
            this._targetPosition.y = vc.y;//this.target.y;
            this.view.x = cc.misc.lerp(this.view.x, this._targetPosition.x, this.lerp.x);
            this.view.y = cc.misc.lerp(this.view.y, this._targetPosition.y, this.lerp.y);
        }

    }



    /**
     * 
     * @param target - 相机锁定的节点目标
     * @param style - Leverage one of the existing {@link deadzone} presets.
     *  If you use a custom deadzone, ignore this parameter and manually specify the deadzone after calling follow().
     * @param lerpX - X 方向的 线性差值
     * @param lerpY - Y 方向的 线性差值
     */
    follow(target: cc.Node, style: FOLLOW_TYPE = FOLLOW_TYPE.LOCK_ON, lerpX: number = 1, lerpY: number = 1) {
        this.target = target;
        this.lerp.set(cc.v2(lerpX, lerpY));

        let helper: number;
        switch (style) {

            case FOLLOW_TYPE.PLATFORM:
                let w = this.width / 8;
                let h = this.height / 3;
                this.deadzone = new cc.Rect((this.width - w) / 2, (this.height - h) / 2 - h * 0.25, w, h);
                this.deadzone.x =  -this.deadzone.width/2;
                this.deadzone.y =  -this.deadzone.height/2;
                break;

            case FOLLOW_TYPE.TOP_DOWN:
                helper = Math.max(this.width, this.height) / 4;
                this.deadzone = new cc.Rect((this.width - helper) / 2, (this.height - helper) / 2, helper, helper);
                this.deadzone.x =  -this.deadzone.width/2;
                this.deadzone.y =  -this.deadzone.height/2;
                break;

            case FOLLOW_TYPE.TOP_DOWN_TIGHT:
                helper = Math.max(this.width, this.height) / 8;
                this.deadzone = new cc.Rect((this.width - helper) / 2, (this.height - helper) / 2, helper, helper);
                this.deadzone.x = -this.deadzone.width/2;
                this.deadzone.y = -this.deadzone.height/2;
                break;

            case FOLLOW_TYPE.LOCK_ON:
                this.deadzone = null;
                break;

            default:
                this.deadzone = null;
                break;
        }

    
        

    }

    /** 将相机跟踪目标设置为 null，如果它正在执行，则停止跟踪对象。 */
    unFollow() {
        this.target = null;
    }

    /**
    * 立即将相机焦点移到显示对象上
    */
    focusOn(node: cc.Node) {
        this.x = Math.round(node.x);
        this.y = Math.round(node.y);
    }

    /**
    * 立即将相机聚焦到某个位置上
    */
    focusOnXY(pos:cc.Vec2) {
        this.x = Math.round(pos.x);
        this.y = Math.round(pos.y);
    }


    /**
    * 让相机进行摇晃,震动屏幕
    */
    shake(intensity = 0.05, duration = 0.5, force = true, direction = SHAKE_TYPE.SHAKE_BOTH, shakeBounds = true): boolean {

        if (!force && this._shake.duration > 0) {
            //如果在震动,就不能影响之前的震动效果
            return false;
        }

        this._shake.intensity = intensity;
        this._shake.duration = duration;
        this._shake.shakeBounds = shakeBounds;

        this._shake.x = 0;
        this._shake.y = 0;

        this._shake.horizontal = (direction === SHAKE_TYPE.SHAKE_BOTH || direction === SHAKE_TYPE.SHAKE_HORIZONTAL);
        this._shake.vertical = (direction === SHAKE_TYPE.SHAKE_BOTH || direction === SHAKE_TYPE.SHAKE_VERTICAL);

        return true;

    }

    /** 画面闪烁颜色 */
    flash(color = cc.color(255, 255, 255), duration = 0.5, force = false, opacity = 255): boolean {

        if (!this.fx || (!force && this._fxConfig.duration > 0)) {
            return false;
        }
        this._fxConfig.color = color;
        this.fx.clear();
        this.fx.rect(this.view.x - this.width / 2, this.view.y - this.view.height / 2, this.view.width, this.view.height + 20);
        this.fx.fillColor = cc.color(color.getR(), color.getG(), color.getB(), opacity);
        this.fx.fill();

        this.fx.node.opacity = opacity;
        this._fxConfig.opacity = opacity;
        this._fxConfig.duration = duration;
        this._fxConfig.type = 0;

        return true;

    }

    /** 过渡到对应颜色 */
    fade(color = cc.color(0, 0, 0, 255), duration = 0.5, force = false, opacity = 255, fadeIn = true): boolean {

        if (!this.fx || (!force && this._fxConfig.duration > 0)) return false;
        this._fxConfig.color = color;
        this.fx.clear();
        this.fx.rect(this.view.x - this.width / 2, this.view.y - this.view.height / 2, this.view.width, this.view.height + 20);
        this.fx.fillColor = cc.color(color.getR(), color.getG(), color.getB(), 0);//
        this.fx.fill();
        this.fx.node.opacity = 0;
        this._fxConfig.opacity = opacity;
        this._fxConfig.duration = duration;
        this._fxConfig.type = fadeIn ? 2 : 1;
        return true;

    }

    /**
     * 效果等同于 this.node.runAction()
     * 可以对相机进行镜头运动的操作，诸如 旋转 缩放 偏移 操作
     * 目前能够生效的属性有: x,y,scale,rotation
     * @param action -需要执行的action
     */
    run(action:cc.Action){
        if(!action ||!this._ctrlNode )return;
        this._ctrlNode.runAction(action);
    }

    /**
    * 确保相机不会跑出边界范围 
    * 由 Camera.update 自动调用。
    */
    protected checkBounds() {
        //return; //!debug
        this.atLimit.x = false;
        this.atLimit.y = false;
        
        var vx = this.view.x + this._shake.x;
        var vw = this.view.x + this.view.width + this._shake.x;
        var vy = this.view.y + this._shake.y;
        var vh = this.view.y + this.view.height + this._shake.y;

        //  确保我们没有走出摄像机边界
        if (vx <= this.bounds.x * this.camera.zoomRatio) {
            this.atLimit.x = true;
            this.view.x = this.bounds.x * this.camera.zoomRatio;

            if (!this._shake.shakeBounds) {
                //  相机在边界上，所以重置抖动。
                this._shake.x = 0;
            }
        }
        else if (vw >= (this.bounds.x + this.bounds.width) * this.camera.zoomRatio) {
            this.atLimit.x = true;
            this.view.x = ((this.bounds.x + this.bounds.width) * this.camera.zoomRatio) - this.width;

            if (!this._shake.shakeBounds) {
                //  相机在边界上，所以重置抖动。
                this._shake.x = 0;
            }
        }

        if (vy <= (this.bounds.y + this.bounds.height) * this.camera.zoomRatio) {
            this.atLimit.y = true;
            this.view.y = (this.bounds.y + this.bounds.height) * this.camera.zoomRatio;

            if (!this._shake.shakeBounds) {
                // 相机在边界上，所以重置抖动。
                this._shake.y = 0;
            }
        }
        else if (vh >= this.bounds.y * this.camera.zoomRatio) {
            this.atLimit.y = true;
            this.view.y = (this.bounds.y * this.camera.zoomRatio) - this.height;

            if (!this._shake.shakeBounds) {
                //  相机在边界上，所以重置抖动。
                this._shake.y = 0;
            }
        }

    }

    /**
    *将相机重置为0、0，不跟踪任何可能跟踪的对象。
    *同时会立即重置可能已经运行的任何相机效果，例如
    *震动，闪光或褪色。
    */
    reset() {

        this.target = null;

        this.view.x = 0;
        this.view.y = 0;

        this._ctrlNode.x = 0;
        this._ctrlNode.y =0;
        this._ctrlNode.scale =1;
        this._ctrlNode.rotation = 1;

        this._shake.duration = 0;
        this._shake.x = 0;
        this._shake.y = 0;

        this.resetFX();

    }

    /** 重置特效 */
    resetFX() {

        if (this.fx) {
            this.fx.clear();
            this.fx.node.opacity = 0;
        }

        this._fxConfig.duration = 0;

    }

}
