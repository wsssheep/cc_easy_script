

/*
 * @Author: wss 
 * @Date: 2019-05-03 22:55:38 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-09 16:25:10
 */


const {ccclass, property,menu,disallowMultiple} = cc._decorator;


enum DRAG_MODE {
    horizontal,
    vertical,
    both,
    dropArea
}

enum DRAG_EFFECT {
    none,
    scale,
    color,
    opacity
}

/**
 * 拖放操作判定
 */
@ccclass
@menu("添加特殊行为/General/Drag&Drop (拖放)")
@disallowMultiple
export default class BhvDragDrop extends cc.Component {

    //* 编辑器

    @property({
        type:cc.Enum(DRAG_MODE),
        tooltip:'拖拽对象的方式'
    })
    dragMode:DRAG_MODE = DRAG_MODE.both;

    @property({
        type:cc.Enum(DRAG_EFFECT),
        tooltip:'拖拽对象,对象变化的效果'
    })
    dragEffect:DRAG_EFFECT = DRAG_EFFECT.none;

    @property({
        tooltip:'是否在拖拽时，将节点置于最顶层'
    })
    dragToTop:boolean = false;

    @property({
        visible:function(){
            return this.dragEffect == DRAG_EFFECT.scale
        },
        tooltip:'拖拽对象，发生缩放变化的值'
    })
    dragScale:cc.Vec2 = cc.v2(0.9,0.9);

    @property({
        visible:function(){
            return this.dragEffect == DRAG_EFFECT.color
        },
        tooltip:'拖拽对象，发生颜色变化的值'
    })
    dragColor:cc.Color = cc.color(255,0,0);

    @property({
        visible:function(){
            return this.dragEffect == DRAG_EFFECT.opacity
        },
        tooltip:'拖拽对象，发生不透明度变化的值'
    })
    dragOpacity:number = 200;

    @property({
        tooltip:'是否在拖拽时，锁定节点坐标值，不让节点进行移动'
    })
    isLimitPosition:boolean = true;

    /**影响监听事件的发送 */
    @property({
        tooltip:'标记，会激活对应tag 的 BhvDropArea',
        visible:function(){return this.dragMode === DRAG_MODE.dropArea}
    })
    tag:string = '';

    @property({
        type:cc.Node,
        tooltip:'父节点，用于判断拖拽时是否超出了父节点的范围,未指定就获取默认父节点',
        visible:function(){return this.dragMode === DRAG_MODE.dropArea}
    })
    parent:cc.Node = null;

    @property({
        visible:function(){return this.dragMode === DRAG_MODE.dropArea}
    })
    dropBack:boolean = true;

    @property({
            tooltip:'如果成功拖放到节点上就自动销毁?' ,
            visible:function(){return this.dragMode === DRAG_MODE.dropArea}     
    })
    dropDestroy:boolean = true;

    @property({
        type:cc.Node,
        tooltip:'拖拽节点的消息收发位置' ,
        visible:function(){return this.dragMode === DRAG_MODE.dropArea}     
    })
    emitTarget:cc.Node = null;


    //*属性

    isMoving:boolean;
    moveDeltaX:number;
    moveDeltaY:number;
    
    private _pre_dragColor:cc.Color;
    private _pre_scale:number;
    private _pre_opacity:number;
    
    private _pre_position:cc.Vec2;
    private _pre_zindex:number;


    //占用标记，表示物品拖拽移动时，被某一个 判定区域所占用，避免触发第二次
    public _usedFlag:string = null;

    private _preOutRange:boolean = false;

    //拖拽时，是否超出边界框（用于丢弃物品 等判断）
    public isOutRange:boolean = false; 

    //暂时保存的边界框
    public outRangeBounds:cc.Rect = cc.rect(0,0,0,0);
  
    onLoad(){
        if(this.emitTarget == null){
            this.emitTarget = this.node;
        }
    }

    /**
     * 在脚本中方便进行初始化操作
     * @param target 
     * @param parent 
     */
    public init(target:cc.Node,parent:cc.Node,config:any){
        this.emitTarget = target;
        this.parent = parent;
        this.tag = config.tag||'';
        this.dragEffect = config.effect;
        this.dragScale =  config.dragScale;
        this.dragColor = config.dragColor;
        this.dragOpacity = config.dragOpacity;

    }
  
    start () {
        this.outRangeBounds =  this.getParentBounds();
        this.isMoving = false;
        this._pre_zindex  = this.node.zIndex;
        this.moveDeltaX =0 ;
        this.moveDeltaY =0 ;
    }

    onEnable(){
        //对象开始
         this.node.on(cc.Node.EventType.TOUCH_START,this.onDragStart,this);
         this.node.on(cc.Node.EventType.TOUCH_MOVE,this.onDragMove,this);
         this.node.on(cc.Node.EventType.TOUCH_END,this.onDragDrop,this);
         this.node.on(cc.Node.EventType.TOUCH_CANCEL,this.onDragDrop,this);
    }

    onDisable(){
        this.node.off(cc.Node.EventType.TOUCH_START,this.onDragStart,this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE,this.onDragMove,this);
        this.node.off(cc.Node.EventType.TOUCH_END,this.onDragDrop,this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL,this.onDragDrop,this);
    }

    getParentBounds():cc.Rect{
        if(this.parent){
            return this.parent.getBoundingBoxToWorld();
        }else{
            return this.node.getParent().getBoundingBoxToWorld();
        }
    }

    //检查是否超出必要范围
    checkOutRange():boolean{
        let boundA = this.outRangeBounds;
        let boundB = this.node.getBoundingBoxToWorld();
        if(!cc.Intersection.rectRect(boundB,boundA)){
            this.isOutRange = true;
        }else{
           this.isOutRange = false;
        }
        return this.isOutRange;
    }

    //自身拖拽开始
    onDragStart(event){
        //开始,记录开始前的效果状态
        this.saveNodeEffect();

        //记录开始前的碰撞盒状态
        this.outRangeBounds =  this.getParentBounds();

        //记录移动前的坐标
        this._pre_position = this.node.position;
        this.moveDeltaX =0 ;
        this.moveDeltaY =0 ;

        if(this.dragToTop){
            this.node.zIndex =  cc.macro.MAX_ZINDEX;
        }

        //改变拖拽状态
        this.setNodeEffect(true);

        if(this.dragMode === DRAG_MODE.dropArea){
            cc.director.emit('onAreaDragStart:'+this.tag,event,this.tag);
        }

        this.emitTarget.emit('onDragStart',this.node,this.tag);



    }

    //自身拖拽移动
    onDragMove(event:cc.Event.EventTouch){
        this.isMoving = true;
        var delta = event.touch.getDelta();
        
        switch (this.dragMode) {
            case DRAG_MODE.both:
            case DRAG_MODE.dropArea:
                this.moveDeltaX +=delta.x ;
                this.moveDeltaY +=delta.y ;
                this.node.x = this._pre_position.x + this.moveDeltaX; 
                this.node.y = this._pre_position.y + this.moveDeltaY; 
                break;
            case DRAG_MODE.horizontal:
                this.moveDeltaX +=delta.x ;
                this.node.x = this._pre_position.x + this.moveDeltaX; 
                break;
            case DRAG_MODE.vertical:
                this.moveDeltaY +=delta.y ;
                this.node.y += delta.y;
                this.node.y = this._pre_position.y + this.moveDeltaY; 
                break;
        
            default:
                break;
        }

        //区域检查

        if(this.dragMode === DRAG_MODE.dropArea){

            this.isOutRange  = this.checkOutRange();

            if(this.isOutRange !== this._preOutRange){
                this._preOutRange = this.isOutRange;
                if(this._preOutRange){
                    this.onMoveEnterOutRage();
                }else{
                    this.onMoveLeaveOutRage();
                }
            }
    
            cc.director.emit('onAreaDragMove:'+this.tag,event,this.tag);
            
        }

        this.emitTarget.emit('onDragMove',this.node,this.tag);


 
    }

    //自身拖拽结束
    onDragDrop(event){

        //恢复拖拽状态
        this.isMoving = false;
        this.setNodeEffect(false);

        if(this.dragToTop){
            this.node.zIndex =  this._pre_zindex;
        }
        
        //区域检查
        if(this.isOutRange){
            this.onDropOutRage();
        }
        /////////////////
        if(this.dragMode === DRAG_MODE.dropArea){
            // this.node.x = this._pre_position.x;
            // this.node.y = this._pre_position.y;
            if(this.dropBack){
                let action = cc.moveTo(0.3,this._pre_position.x,this._pre_position.y).easing(cc.easeBackOut());
                this.node.runAction(cc.sequence([
                    action,
                    cc.callFunc(()=>{
                        this.emitTarget.emit('onDropBack',this.node,this.tag);//回弹的动画
                    })
                ]));
            }else{
                this.node.x = this._pre_position.x;
                this.node.y = this._pre_position.y;
            }
            
            cc.director.emit('onAreaDragDrop:'+this.tag,event,this.tag);
        }


        this.emitTarget.emit('onDragDrop',this.node,this.tag);


    }

    //拖拽到别的节点的情况

    //移出边界范围
    onMoveEnterOutRage(){
        // console.log('进入 边界范围');
        // let node = this.node.getChildByName('delete');
        // if(node)node.active = true;
        this.emitTarget.emit('onMoveEnterOutRage',this.node,this.tag);
    }

    //从边界范围移回来
    onMoveLeaveOutRage(){
        // console.log('离开边界范围');
        // let node = this.node.getChildByName('delete');
        // if(node)node.active = false;
        this.emitTarget.emit('onMoveLeaveOutRage',this.node,this.tag);
    }

    //从边界范围外丢下了东西
    onDropOutRage(){
        let node = this.node.getChildByName('delete');
        if(node)node.active = false;
        this.emitTarget.emit('onDropOutRage',this.node,this.tag);
    }

    // //[可能不需要的回调]拖动该物体时，进入了某个节点的区域
    // onDragMoveEnter(enterNode:cc.Node){
        
    //     //this.emitTarget.emit('onDragMoveEnter',enterNode);
    // }

    // //[可能不需要的回调]拖动该物体时，离开了某个节点的区域
    // onDragMoveLeave(leaveNode:cc.Node){
    //     //this.emitTarget.emit('onDragMoveLeave',leaveNode);
    // }

    // //[可能不需要的回调]将该物体，丢在了某个节点区域内
    // onDropInNode(dropNode:cc.Node){

    //     //this.emitTarget.emit('onDropInNode',dropNode);

    //     // if(this.dropDestroy){

    //     //     this.node.destroy();
    //     // }

    //     // console.log('丢给了某个节点');
    //     // this.dropBack = false;
    //     // this.node.stopAllActions();
    //     // this.node.runAction(cc.sequence([
    //     //     cc.moveTo(0.2,dropNode.x,dropNode.y).easing(cc.easeBackInOut()),
    //     //     cc.callFunc(()=>{
    //     //         this.dropBack = true;
    //     //     })
    //     // ]));
    //     // this.node.x = dropNode.x;
    //     // this.node.y = dropNode.y;

    //     // dropNode.getComponentInChildren(cc.Label).string = this.node.getComponentInChildren(cc.Label).string;
    //     // this.node.destroy();
    //     //this.node.destroy();
    // }


    private saveNodeEffect(){
        this._pre_dragColor = this.node.color;
        this._pre_scale = this.node.scale;
        this._pre_opacity = this.node.opacity; 
    }

    private setNodeEffect(apply:boolean){
        if(apply){
            switch (this.dragEffect) {
                case DRAG_EFFECT.color:
                    this.node.color = this.dragColor;
                    break;
                case DRAG_EFFECT.scale:
                    this.node.scaleX = this.dragScale.x;
                    this.node.scaleY = this.dragScale.y;
                    break;
                case DRAG_EFFECT.opacity:
                    this.node.opacity = this.dragOpacity; 
                    break;
            
                default:
                    break;
            }
        }else{
            switch (this.dragEffect) {
                case DRAG_EFFECT.color:
                    this.node.color = this._pre_dragColor;
                    break;
                case DRAG_EFFECT.scale:
                    this.node.scale = this._pre_scale;
                    break;
                case DRAG_EFFECT.opacity:
                    this.node.opacity = this._pre_opacity; 
                    break;
            
                default:
                    break;
            }
        }
    }



    update () {
        if(!this.isLimitPosition || !this.isMoving)return;
        this.node.x = this._pre_position.x + this.moveDeltaX; 
        this.node.y = this._pre_position.y + this.moveDeltaY; 
    }



}
