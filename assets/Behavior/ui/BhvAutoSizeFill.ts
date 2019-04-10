
const {ccclass, property, menu} = cc._decorator;

/**
 * 自动尺寸填充 ver1.0,
 * 可以无视节点顺序,默认以父对象为尺寸参照填充
 */
@ccclass
@menu("添加特殊行为/UI/Auto Size Fill (内容适配)")
export default class NewClass extends cc.Component {


    @property({
        type:cc.Node,
        tooltip:'指定当前节点的填充目标,可以是任意节点。'
    })
    target:cc.Node = null;
    
    @property({
        tooltip:'宽高的偏移值 X Y '
    })
    offset:cc.Vec2 = cc.v2(0,0);

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if(this.target == null){
            this.target =  this.node.getParent(); 
        }
        this.onSizeChange();
    }

    onEnable(){
        if(this.target)this.target.on('size-changed',this.onSizeChange,this);
    }

    onDisable(){
        if(this.target)this.target.off('size-changed',this.onSizeChange,this);
    }

    onSizeChange(){
        if(!this.target)return;
        let offsetX = this.offset.x;
        let offsetY = this.offset.y;
        console.log(this.target);
        console.log(cc.winSize);
        //this.node.setContentSize(cc.size(,));
        this.node.width = this.target.width+offsetX;
        this.node.height = this.target.height+offsetY;
    }


    // update (dt) {}
}
