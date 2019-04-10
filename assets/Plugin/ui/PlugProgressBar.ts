
const {ccclass, property, executeInEditMode} = cc._decorator;

//todo 格斗游戏中的,缓慢削减血
// 功能不完善，等待处理...

@ccclass
@executeInEditMode
export default class PlugProgressBar extends cc.ProgressBar {

    // LIFE-CYCLE CALLBACKS:

    @property(cc.Node)
    backBarSprite:cc.Node = null;

    @property({
        tooltip:'线性差值'
    })
    lerp:number = 0.1;

    @property({
        type:[cc.Color],
        tooltip:'百分比改变颜色,由上到下改变颜色百分比,progress越少,颜色越少'
    })  
    percentColor:Array<cc.Color> = [cc.color(0,255,0,255),cc.color(255,100,0,255),cc.color(255,255,0,255),cc.color(255,0,0,255)];
    
    private _progress:number = 0;

    checkPercentColor(){
        if(!this.percentColor)return;
        let max = this.percentColor.length;
        let cur = Math.floor( max * (1-this.progress) );
        this.barSprite.node.color = this.percentColor[cur];

    }

    update (dt) {
        //百分比不同，改变颜色
        if(this.progress != this._progress){
            this.checkPercentColor();
        }

        if(CC_EDITOR){
            this.backBarSprite.width = this.backBarSprite.width;
            return;
        }

        //跟随血条移动
        if(this.backBarSprite){
            let total = this.totalLength *   this.progress;
            switch ( this.mode ) {
                case cc.ProgressBar.Mode.HORIZONTAL:         
                    this.backBarSprite.width = cc.misc.lerp(this.backBarSprite.width,total,this.lerp);
                    break;
                case cc.ProgressBar.Mode.VERTICAL:
                    this.backBarSprite.height = cc.misc.lerp(this.backBarSprite.height,total,this.lerp);
                    break;
                case cc.ProgressBar.Mode.FILLED:
                    this.backBarSprite.width = cc.misc.lerp(this.backBarSprite.width,total,this.lerp);
                    this.backBarSprite.height = cc.misc.lerp(this.backBarSprite.height,total,this.lerp);
                    break;
            
                default:
                    break;
            }
        }

        this._progress = this.progress;


    }
}
