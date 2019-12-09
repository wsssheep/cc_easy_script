
const {ccclass, property,menu} = cc._decorator;

enum ANIMATE_TYPE {
    /**线性飞去 */LIEN_TO,
    /**跳过去 */JUMP_TO,
    ///**掉落下来 */DROP_FADE, //todo 动画未开发
}

/**
 * 专门用于制作 金钱飞到某处的动画，提供一个贴图即可生成
 * （支持对象池回收)
 * todo 增加 掉落大量物品的动画模式
 */
@ccclass
@menu("添加特殊行为/Animate/Icon FlyTo")
export default class BhvIconFLyTo extends cc.Component {

    @property(cc.SpriteFrame)
    texture:cc.SpriteFrame  = null;

    @property({
        tooltip:'发射起点的坐标',
        type:cc.Node
    })
    startNode:cc.Node = null;

    @property({
        tooltip:'需要发射到哪个对象的位置上',
        type:cc.Node
    })
    emitTarget:cc.Node = null;

    @property({
        type:cc.Node,
        tooltip:'放置到哪个parent里?默认为Canvas 节点'
    })
    putParent:cc.Node = null;

    @property({tooltip:"是否在编辑器中配置动画属性"})
    custom:boolean = true;

    @property({
        type:cc.Enum(ANIMATE_TYPE),
        visible:function(){return this.custom}
    })
    type:ANIMATE_TYPE = ANIMATE_TYPE.LIEN_TO;

    @property({
        tooltip:'产生花费的时间',
        visible:function(){return this.custom}
    })
    generateTime:number = 0.5;

    @property({
        tooltip:'动画播放的时间',
        visible:function(){return this.custom}
    })
    animationTime:number = 0.5;


    @property({
        type:cc.Integer,
        visible:function(){return  this.custom&&this.type === ANIMATE_TYPE.JUMP_TO }
    })
    jumpCount:number =1;

    @property({
        type:cc.Integer,
        visible:function(){return this.custom&&this.type === ANIMATE_TYPE.JUMP_TO}
    })
    jumpHeight:number =100;

    @property({
        type:cc.Integer,
        visible:function(){return this.custom&&this.type === ANIMATE_TYPE.JUMP_TO}
    })
    jumpHeightVar:number = 100;

    @property({
        type:[cc.Component.EventHandler],
        tooltip:'达到目标点触发一次事件'
    })
    arriveTargetEvent:cc.Component.EventHandler[] = [];

    //对象池
    pool:cc.NodePool = new cc.NodePool();

    //创建节点
    private createNode():cc.Node{
        let parent = this.putParent||cc.find("Canvas");
        let node =  this.pool.get()||new cc.Node();
        let comp = node.getComponent(cc.Sprite);
        if(comp == null)comp = node.addComponent(cc.Sprite);
        node.stopAllActions();
        comp.spriteFrame = this.texture;
        parent.addChild(node);
        node.position = cc.v2(0,0);
        node.zIndex = 1000;
        node.opacity  = 0;

        return node;
    }

    //飞往目标处
    private moveTo(node:cc.Node,worldPos:cc.Vec2,timer:number = 1){
        let pos = node.getParent().convertToNodeSpaceAR(worldPos);
        let moveAction;
        if(this.type === ANIMATE_TYPE.LIEN_TO){
            moveAction = cc.moveTo(1 * timer,pos).easing(cc.easeSineInOut())
        }else{
            moveAction =  cc.jumpTo(1 * timer,pos,this.jumpHeight+(Math.random()*2-1)*this.jumpHeightVar,this.jumpCount).easing(cc.easeSineInOut())
        }
        let action = cc.spawn([
            moveAction,//,
            cc.sequence([
                cc.fadeIn(0.2 * timer),
                cc.delayTime(0.6 * timer),
                cc.fadeOut(0.2 * timer)
            ])
        ]);

        node.runAction(cc.sequence([
            action,
            cc.callFunc(()=>{
                this.arriveTargetEvent.forEach((comp,i)=>{
                    comp.emit([comp.customEventData])
                })
                this.pool.put(node);
            })
        ]));

    }

    //设置属性(会影响之后创建的动画)
    setConfig(config:IBhvIconFLyToConfig){
        this.type = config.type;
        this.jumpCount = config.jumpCount;
        this.jumpHeight = config.jumpHeight;
        this.jumpHeightVar = config.jumpHeightVar;
        this.animationTime = config.aniTime;
        this.generateTime = config.generateTime;
    }

    //生成对象
    create(count:number,startPos?:cc.Vec2,endPos?:cc.Vec2){
        //未填写坐标就用默认坐标
        if(endPos == null && this.emitTarget){
            endPos = this.emitTarget.convertToWorldSpaceAR(cc.Vec2.ZERO);
        }

        if(startPos == null){
            if(this.startNode){
                startPos = this.startNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
            }else{
                startPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            }
        }

        this.schedule(()=>{
            const node = this.createNode();
            node.position = node.getParent().convertToNodeSpaceAR(startPos);
            this.moveTo(node,endPos,this.animationTime);

        },this.generateTime/count,count-1);



    }

    onDestroy(){
        //清理缓存的所有节点
        this.pool.clear();
        this.pool = null;
    }

    // update (dt) {}
}


interface IBhvIconFLyToConfig {
    type?:ANIMATE_TYPE
    jumpCount?:number;
    jumpHeight?:number;
    jumpHeightVar?:number;
    aniTime?:number;
    generateTime?:number;
}