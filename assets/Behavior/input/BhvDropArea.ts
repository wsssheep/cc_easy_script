import BhvDragDrop from "./BhvDragDrop";

/*
 * @Author: wss 
 * @Date: 2019-05-08 12:21:15 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-09 16:27:01
 */


const {ccclass, property, menu,disallowMultiple} = cc._decorator;

enum DRAG_EFFECT {
    none,
    scale,
    color,
    opacity
}

/**
 *  放置区域
 *  可以捕获到 拖拽过来的节点的信息，反馈拖拽情况
 */
@ccclass
@menu("添加特殊行为/General/Drop Area(放置区域)")
@disallowMultiple
export default class BhvDropArea extends cc.Component {

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

    //用于识别 放入的 道具 和 区域 是否一致，影响监听结果
    @property
    tag:string = '';

    private _pre_dragColor:cc.Color;
    private _pre_scale:number;
    private _pre_opacity:number;

    
    onEnable(){
        cc.director.on('onAreaDragStart:' + this.tag,this.onDragStart,this);
        cc.director.on('onAreaDragMove:' + this.tag,this.onDragMove,this);
        cc.director.on('onAreaDragDrop:' + this.tag,this.onDragDrop,this);
    }

    onDisable(){
        cc.director.off('onAreaDragStart:' + this.tag,this.onDragStart);
        cc.director.off('onAreaDragMove:' + this.tag,this.onDragMove);
        cc.director.off('onAreaDragDrop:' + this.tag,this.onDragDrop);
    }
    onLoad () {
        this.saveNodeEffect();
    }

    /**检查一个节点是否丢在了该节点的内部 */
    checkNodeOverlap(node:cc.Node){
        let boundA = node.getBoundingBoxToWorld();
        let boundB =  this.node.getBoundingBoxToWorld()
        if( cc.Intersection.rectRect(boundA,boundB)){
            return true;
        }else{
            return false;
        }
    }

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

    //发现有东西在拖拽（在这里可以出现提示之类的操作）
    private onDragStart(event:cc.Event.EventTouch,tag:string){
        //
    }
    
    //拖拽移动了
    private onDragMove(event:cc.Event.EventTouch,tag:string){
        let node:cc.Node  = event.currentTarget;
        let comp = node.getComponent(BhvDragDrop);
        let inRange  = this.checkNodeOverlap(node);
        
        if( inRange){
            //查询唯一节点标记
            if(comp._usedFlag === null){
                comp._usedFlag = this.node.uuid;
                this.onDragMoveEnter(node);
                node.emit('onDragEnterArea',this.node);
            }
        }else{
            //查询唯一节点标记
            if(comp._usedFlag === this.node.uuid){
                comp._usedFlag = null;
                this.onDragMoveLeave(node);
                node.emit('onDragLeaveArea',this.node);
            }
        }
        
    }
    
    //拖拽放下了
    private onDragDrop(event:cc.Event.EventTouch,tag:string){

        let node:cc.Node  = event.currentTarget;
        let comp = node.getComponent(BhvDragDrop);
        this.setNodeEffect(false);
        //查询唯一节点标记
        if(comp._usedFlag && comp._usedFlag !== this.node.uuid)return;
        
        //成功放入节点
        if( this.checkNodeOverlap(node)){
            this.onDropInArea(node);
            node.emit('onDropInNode',this.node);
        }else{
            this.onDropOutArea(node);
        }
    }


    //移动进入 drop 区域内部
    private onDragMoveEnter(node:cc.Node){
        this.saveNodeEffect();
        this.setNodeEffect(true);
        this.node.emit('onDragMoveEnter',node,this.node,this.tag);
    }

    //移动离开 drop 区域内部
    private onDragMoveLeave(node:cc.Node){
       this.setNodeEffect(false);
       this.node.emit('onDragMoveLeave',node,this.node,this.tag);
    }

    //丢在了drop 区域
    private onDropInArea(node:cc.Node){
        console.log('丢到节点区域了');
        this.node.emit('onDropInArea',node,this.node,this.tag);
    }
    
    //丢在了 drop 区域外部
    private onDropOutArea(node:cc.Node){
        this.node.emit('onDropOutArea',node,this.node,this.tag);
    }



    // update (dt) {}
}
