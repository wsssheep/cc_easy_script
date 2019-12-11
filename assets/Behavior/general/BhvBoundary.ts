
const {ccclass, property,menu} = cc._decorator;

enum BOUND_MODE {
    /**以某节点的边界框为标准（不填写默认以父节点绑定） */
    NODE,   
    /**以窗口大小为基础的 */
    WINDOW, 
    /**完全自定义范围 */
    CUSTOM  
}

enum BOUNDARY_MODE {
    /**限制区域范围 */
    CLAMP,
    /**穿越边缘，从一边穿越到另外一边 */
    WRAP,
    /**自定义处理方式 */
    CUSTOM,
}


/**
 * 边界范围 [v0.1.0]
 * 不支持不同层级的 boundary旋转，只能使用矩形 或者 圆形
 * bound 行为，将对象限制在一个盒子里 或者一个圆里
 * 可以做摇杆，或者限制角色/节点的移动范围
 * 也可以将对象限制在某个矩形 或者 圆形的范围内
 * 可以在抵达边界时候 wrap出去
 * 可以不受层级关系影响
 */
@ccclass
@menu("添加特殊行为/General/Boundary (边界)")
export default class BhvBoundary extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    @property({
        type:cc.Enum(BOUND_MODE),
        tooltip: "不同的Bound 模式",   
    })
    boundMode = BOUND_MODE.NODE;

    @property({
        type:cc.Enum(BOUNDARY_MODE)
    })
    wrap:BOUNDARY_MODE = BOUNDARY_MODE.CLAMP;

    // onLoad () {}
    @property({
        type:cc.Node, 
        visible:function(){return this.boundMode === BOUND_MODE.NODE}
    })
    parent:cc.Node = null;

    @property({ 
        visible:function(){return this.boundMode === BOUND_MODE.CUSTOM}
    })
    customBoundRect:cc.Rect = cc.rect(0,0,128,128);

    @property({
        tooltip:'偏移值,偏移坐标设置 x,y 偏移宽度设置 w,h',
        visible:function(){return this.boundMode !== BOUND_MODE.CUSTOM}
    })
    boundOffset:cc.Size = cc.size(0,0);

    @property
    private _boundEdit : boolean = false;
    public get boundEdit() : boolean {
        return this._boundEdit;
    }
    @property({
        tooltip:'编辑边界的激活范围'
    })
    public set boundEdit(v : boolean) {
        this._boundEdit = v;
        if(v === false){
            this.boundLeft = true;
            this.boundRight = true;
            this.boundTop = true;
            this.boundBottom = true;
        }
    }
    

    @property({
        displayName:'+ Left',
        visible:function(){return this.boundEdit === true}
    })
    boundLeft:boolean = true;

    @property({
        displayName:'+ Right',
        visible:function(){return this.boundEdit === true}
    })
    boundRight:boolean = true;

    @property({
        displayName:'+ Top',
        visible:function(){return this.boundEdit === true}
    })
    boundTop:boolean = true;
    
    @property({
        displayName:'+ Bottom',
        visible:function(){return this.boundEdit === true}
    })
    boundBottom:boolean = true;

    @property({
        type:[cc.Component.EventHandler],
        tooltip:'边界触发事件'
    })
    boundEvents:cc.Component.EventHandler[] = [];


    _prePosition:cc.Vec2 = cc.v2(0,0)

    start () {
        this._prePosition.x = this.node.x;
        this._prePosition.y = this.node.y;
        
    }

    getBoundParent():cc.Node{
        let node;
        switch (this.boundMode) {
            case BOUND_MODE.NODE:
                node = this.parent||this.node.getParent();
                break;
            case BOUND_MODE.WINDOW:
                //todo 这里有问题，不能用 canvas，否则boundary也是不对的，因为size 会动态变
                break;
            case BOUND_MODE.CUSTOM:
                //todo
                break;
        
            default:
                break;
        }
        return node;
    }

    convertPosition(node:cc.Node,pos:cc.Vec2){
       return this.node.getParent().convertToNodeSpaceAR(node.convertToWorldSpaceAR(pos));
    }

    update (dt) {
        this.updateCheckRect(dt);
    }

    //更新检查圆形的边界
    updateCheckCircle(dt){
        
    }

    //更新检查矩形的边界
    updateCheckRect(dt){
        let parent = this.getBoundParent();
        let node = this.node;
        let offset = this.boundOffset;
        //将当前坐标转成 Parent 内的坐标系
        let playerPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let parentPos = parent.convertToWorldSpaceAR(cc.Vec2.ZERO);

        //相当于将需要绑定的目标 放入对象的 parent 里进行比较
        let pos = parent.convertToNodeSpaceAR(playerPos);

        let left =(parent.width* (1-parent.anchorX));
        let right = (parent.width* (-parent.anchorX));
        let up = parent.height * (1-parent.anchorY);
        let down =  parent.height * (-parent.anchorY);
     
        let convertPos = this._prePosition;

        //left
        if(  (pos.x+node.width/2-offset.width) > left  && this.boundLeft ){
            
            if(this.wrap == BOUNDARY_MODE.WRAP){
                convertPos = this.convertPosition(parent,cc.v2(right+node.width/2,this.node.y));
                this.node.x = convertPos.x;
            }else if(this.wrap == BOUNDARY_MODE.CLAMP){
                convertPos = cc.v2(this._prePosition.x,this.node.y);
                this.node.x = this._prePosition.x;
            }

            this.onCollideBoundary('left',convertPos);
        }
        //right
        else if( ( pos.x-node.width/2+offset.width) < right && this.boundRight ){
            if(this.wrap == BOUNDARY_MODE.WRAP){
                convertPos = this.convertPosition(parent,cc.v2(left-node.width/2,this.node.y));
                this.node.x = convertPos.x;
            }else if(this.wrap == BOUNDARY_MODE.CLAMP){
                convertPos =  cc.v2(this._prePosition.x,this.node.y);
                this.node.x = this._prePosition.x;
            }

            this.onCollideBoundary('right',convertPos);
        }

        //up
        if((pos.y+node.height/2-offset.height) > up && this.boundTop ){
            if(this.wrap == BOUNDARY_MODE.WRAP){
                convertPos = this.convertPosition(parent,cc.v2(this.node.x,down+node.height/2));
                this.node.y = convertPos.y;
                this.onCollideBoundary('top',convertPos);
            }else if(this.wrap == BOUNDARY_MODE.CLAMP){
                convertPos = cc.v2(this.node.x,this._prePosition.y);
                this.node.y = this._prePosition.y;
            }

            this.onCollideBoundary('top',convertPos);
        }
        //down
        else if( (pos.y-node.height/2+offset.height) <down && this.boundBottom ){
            if(this.wrap == BOUNDARY_MODE.WRAP){
                convertPos = this.convertPosition(parent,cc.v2(this.node.x,up-node.height/2));
                this.node.y = convertPos.y;           
            }else if(this.wrap == BOUNDARY_MODE.CLAMP){
                convertPos = cc.v2(this.node.x,this._prePosition.y);
                this.node.y = this._prePosition.y;
            }

            this.onCollideBoundary('bottom',convertPos);

        }

        this._prePosition.x = this.node.x;
        this._prePosition.y = this.node.y;
    }

    /**碰撞到了边界范围 */
    onCollideBoundary(edge:'left'|'right'|'top'|'bottom',boundPos?:cc.Vec2){
        this.boundEvents.forEach(comp=>{
            comp.emit([edge,boundPos,comp.customEventData]);//
        });

        //
    }

}
