/*
 * @Author: wss 
 * @Date: 2019-04-30 16:23:57 
 * @Last Modified by: wss
 * @Last Modified time: 2019-11-05 12:40:37
 */


const {ccclass, property,executeInEditMode} = cc._decorator;

enum PROP_CONDITION {
    SCALE,
    SCALE_X,
    SCALE_Y,
    X,
    Y,
    WIDTH,
    HEIGHT,
    OPACITY
}

const PROP_NAME_ARRAY = ['scale','scaleX','scaleY','x','y','width','height','opacity']

/**
 * [进度条]以百分比控制进度条的属性
 * 
 */
@ccclass
export default class BhvProgressLimit extends cc.Component {

    @property(cc.Node)
    target:cc.Node= null;

    @property
    valueMin:number = 0;
    
    @property
    valueMax:number = 1;

    @property
    private _propType : PROP_CONDITION = 0;
    public get propType() : PROP_CONDITION {
        return this._propType;
    }
    @property({
        type:cc.Enum(PROP_CONDITION)
    })
    public set propType(v : PROP_CONDITION) {
        this._propType = v;
        if(CC_EDITOR){
            this._editorUpdateConfig(v);
        }
    }
    

    @property
    private _progress : number = 0.5;
    public get progress() : number {
        return this._progress;
    }
    @property({
        range:[0,1],
        slide:true
    })
    public set progress(v : number) {
        if(v<0)v=0;
        if(v>1)v=1;
        this._progress = v;
        this.updateProp(v);
    }
    
    //在编辑器中切换限制条件后的控制情况
    _editorUpdateConfig(v){
        switch (v) {
            case PROP_CONDITION.SCALE:
                this.valueMin = 0;
                this.valueMax = 1;
                break;
            case PROP_CONDITION.SCALE_X:
                this.valueMin = 0;
                this.valueMax = 1;
                break;
            case PROP_CONDITION.SCALE_Y:
                this.valueMin = 0;
                this.valueMax = 1;
                break;
            case PROP_CONDITION.X:
                this.valueMin = 0;
                this.valueMax = 640;
                break;
            case PROP_CONDITION.Y:
                this.valueMin = 0;
                this.valueMax = 640;
                break;
            case PROP_CONDITION.WIDTH:
                this.valueMin = 0;
                this.valueMax = this.node.width||100;
                break;
            case PROP_CONDITION.HEIGHT:
                this.valueMin = 0;
                this.valueMax = this.node.height||100;
                break;
            case PROP_CONDITION.OPACITY:
                this.valueMin = 0;
                this.valueMax = 255;
                break;
        
            default:
                break;
        }
    }

    updateProp(v){
        let prop = this.propType;
        let propName = PROP_NAME_ARRAY[prop];
        let value = this.mapValue(v,0,1,this.valueMin,this.valueMax);
        let node = this.target||this.node;
        if(propName in node){
            node[propName] = value;
        }

    }

    private mapValue(x: number, xMin: number, xMax: number, yMin: number, yMax: number){
        return (yMax - yMin) * (x - xMin) / (xMax - xMin) + yMin;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
