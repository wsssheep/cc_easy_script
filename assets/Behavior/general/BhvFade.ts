/*
 * @Author: wss 
 * @Date: 2019-04-10 00:31:33 
 * @Last Modified by:   wss 
 * @Last Modified time: 2019-04-10 00:31:33 
 */

const {ccclass, property,menu,disallowMultiple} = cc._decorator;


@ccclass
@menu("添加特殊行为/General/Fade (渐隐渐显)")
@disallowMultiple
export default class BhvFade extends cc.Component {    

    @property({
        tooltip: "会在 start 时触发 fade 效果",
    })
    activeAtStart:boolean = true;

    @property({
        tooltip: "渐入时间",
    })
    fadeInTime:number = 0;

    @property({
        tooltip: "等待时间",
    })
    waitTime:number = 0;

    @property({
        tooltip:'淡出时间'
    })
    fadeOutTime:number = 1;

    @property({
        tooltip:'完成后是否destroy该节点'
    })
    autoDestroy:boolean = true;

    // LIFE-CYCLE CALLBACKS:

   onLoad(){
    if(this.fadeInTime>0)  this.node.opacity = 0; //如果有 fade in 设置，那么初始透明度0
   }

    start () {
        if(this.activeAtStart)this.startFade();
    }

    /**开始fade,按照默认配置的参数 */
    startFade(){
        var inTimer = this.fadeInTime||0;
        var waitTime = this.waitTime||0;
        var outTimer= this.fadeOutTime||0;
        this.fade(inTimer,waitTime,outTimer);
    }

    fade(from:number,wait:number,to:number){
        var actList:Array<cc.ActionInstant|cc.ActionInterval> = [];
        if(from>0)this.node.opacity = 0;

        if(from>0)actList.push(cc.fadeIn(from));
        if(wait>0)actList.push(cc.delayTime(wait));
        if(to>0)actList.push(cc.fadeOut(to));
        if(to>0 && this.autoDestroy){
            actList.push(cc.callFunc(this.destroy,this)); //完成动作自动销毁
        }

        var act:cc.Action = cc.sequence(actList);
        this.node.runAction(act);
        

    }

 
}
