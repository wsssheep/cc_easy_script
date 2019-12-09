/*
 * @Author: wss 
 * @Date: 2019-04-23 23:14:25 
 * @Last Modified by: wss
 * @Last Modified time: 2019-04-24 00:23:09
 */


const {ccclass, property, menu, executeInEditMode} = cc._decorator;


/**
 * [Value Sync]
 * 当你需要管理同步两个组件中的某个值，可以使用这个操作
 * 注意，这个赋值是强联系的，请不要用于逻辑判断
 */
@ccclass
@menu("添加特殊行为/Logic/Value Sync (值同步)")
@executeInEditMode
export default class BhvValueSync extends cc.Component {

    @property({
        tooltip:'将值映射到另外一个值上（可以限制取值的范围)',
    })
    useValueMap:boolean = false;

    @property({
        tooltip:'区间值限制,保证输入的值不会超过区间范围',
    })
    useValueClamp:boolean = false;
    @property({
        visible:function(){return this.useValueClamp},
        tooltip:'限制输入值的区间，X= 最小值 Y=最大值',
        displayName:'Value Clamp'
    })
    inputValueRange:cc.Vec2 = cc.v2(0,1);


    @property({
        tooltip:'组件名,可以为自己的组件名(类名)或者cc.Node 或者cc其他组件名'
    })
    selfCompName:string = '';
    @property
    selfCompProperty:string = '';
    @property({
        visible:function(){return this.useValueMap},
        tooltip:'将值映射区间，X= 最小值 Y=最大值',
        displayName:'Map Range'
    })
    selfMapRange:cc.Vec2 = cc.v2(0,1);
    
    @property(cc.Node)
    otherNode:cc.Node = null;
    @property
    otherCompName:string = '';
    @property
    otherCompProperty:string = '';
    @property({
        visible:function(){return this.useValueMap},
        tooltip:'将值映射区间，X= 最小值 Y=最大值',
        displayName:'Map Range'
    })
    otherMapRange:cc.Vec2 = cc.v2(0,1);
    
    selfComp:any = null;
    otherComp:any = null;

    private _preValue:any = null;
    
    // LIFE-CYCLE CALLBACKS:

    //必须在 start判断，否则执行顺序有问题
    onLoad(){
        if(!this.selfCompName || !this.otherCompName ||!this.otherCompProperty ||!this.selfCompProperty)return;
        this.selfComp = (this.selfCompName == "cc.Node")?this.node:this.getComponent(this.selfCompName);
        this.otherComp = (this.otherCompName == "cc.Node")?this.otherNode:this.otherNode.getComponent(this.otherCompName);

        if(this.selfCompProperty in this.selfComp ===false){
            cc.error("BhvValueSync:",this.selfCompProperty,' 不在'+this.selfCompName+'组件内');
        }

        if(this.otherCompProperty in this.otherComp ===false){
            cc.error("BhvValueSync:",this.otherCompProperty,'不在'+this.selfCompName+'组件内');
        }
    }

    update (dt) {
        if(CC_EDITOR)return;//不建议编辑器模式调试
        if(!this.selfComp || !this.otherComp)return;
        //同步赋值操作 注意,为了方便使用 这里的 comp 并不知道是一个节点 还是一个组件
        let value:any = this.selfComp[this.selfCompProperty];
        if(value === undefined || value === null)return;
        //脏值判断，如果这个值没有被更新，后续的判断都应该取消
        if(value === this._preValue)return;
        this._preValue = value;

        //输入值限制
        if(this.useValueClamp){
            if(value>this.inputValueRange.y)value = this.inputValueRange.y;
            if(value<this.inputValueRange.x)value = this.inputValueRange.x;
        }
        //输入输出区间的映射
        if(this.useValueMap){
            this.otherComp[this.otherCompProperty] = this._map(value,this.selfMapRange,this.otherMapRange);
        }else{
            this.otherComp[this.otherCompProperty] = value ;
        }
    }

    //将一个区间的 值映射到另外一个区间中
    private _map(x: number, xRange: cc.Vec2, yRange:cc.Vec2) {
        let xMin = xRange.x;
        let xMax = xRange.y;
        let yMin = yRange.x;
        let yMax = yRange.y;
        return (yMax - yMin) * (x - xMin) / (xMax - xMin) + yMin;
    }
}
