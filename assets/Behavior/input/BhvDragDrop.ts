/*
 * @Author: wss 
 * @Date: 2019-05-03 22:55:38 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-03 22:55:58
 */


const {ccclass, property,menu,disallowMultiple} = cc._decorator;


enum DRAG_MODE {
    both,
    horizontal,
    vertical
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

    //*属性

    isMoving:boolean;
    moveDeltaX:number;
    moveDeltaY:number;
    private _pre_dragColor:cc.Color;
    private _pre_scale:number;
    private _pre_opacity:number;
    private _pre_position:cc.Vec2;

    //*方法

    start () {
        this.isMoving = false;
        this.moveDeltaX =0 ;
        this.moveDeltaY =0 ;
    }

    onEnable(){
        var canvas = cc.find('Canvas');
        if(!canvas)return;

        //对象开始
  
         this.node.on(cc.Node.EventType.TOUCH_START,this.onDragStart,this);
         this.node.on(cc.Node.EventType.TOUCH_MOVE,this.onDragMove,this);
         this.node.on(cc.Node.EventType.TOUCH_END,this.onDragDrop,this);
         this.node.on(cc.Node.EventType.TOUCH_CANCEL,this.onDragDrop,this);
        
     
    }

    onDisable(){
        var canvas = cc.find('Canvas');
        if(!canvas)return;
        this.node.targetOff(this)
        canvas.targetOff(this);
    }

    onDragStart(){
        //开始,记录开始前的状态
        this._pre_dragColor = this.node.color;
        this._pre_scale = this.node.scale;
        this._pre_opacity = this.node.opacity; 
        this._pre_position = this.node.position;
        this.moveDeltaX =0 ;
        this.moveDeltaY =0 ;
     

        //改变拖拽状态
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


    }

    onDragMove(event:cc.Event.EventTouch){
        this.isMoving = true;
        var delta = event.touch.getDelta();
        
        switch (this.dragMode) {
            case DRAG_MODE.both:
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

      
 
    }


    onDragDrop(){
        //恢复拖拽状态
        this.isMoving = false;
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

    update () {
        if(!this.isLimitPosition || !this.isMoving)return;
        this.node.x = this._pre_position.x + this.moveDeltaX; 
        this.node.y = this._pre_position.y + this.moveDeltaY; 
    }





}
