/*
 * @Author: wss 
 * @Date: 2019-04-17 16:33:34 
 * @Last Modified by: wss
 * @Last Modified time: 2019-05-17 21:25:20
 */

const {ccclass, property, menu} = cc._decorator;

enum VALUE_TYPE {
    /**整数模式,只会以整数处理 */
    INTEGER,
    /**两位小数模式,最终结果保留两位小数 0.00 */
    FIXED_2,
    /**计时器模式,以计时器格式变动 00:00 */
    TIMER,
    /**百分比模式 (百分比结果 基于小数,因此初始值必须为小数)*/
    PERCENTAGE,
    /*缩写单位模式KMBT */
    KMBT_FIXED2,
    /**以千单位的分隔符 */
    THOUSAND_SEPARATOR,
    /**自定义模式 (通过传入的函数,进行自定义) */
    CUSTOMER
}

/**模板字符串使用的替换字符 */
const REPLACE_STRING = '{{0}}';

/**
 * [滚动数字] ver 0.5.0
 * 将会使用 lerp 自动滚动数字到目标数值
 */
@ccclass
@menu("添加特殊行为/UI/Roll Number (滚动数字)")
export default class BhvRollNumber extends cc.Component {

    @property({
        type:cc.Label,
        tooltip:'需要滚动的 Label 组件,如果不进行设置，就会从自己的节点自动查找'
    })
    label:cc.Label = null;

    @property({
        tooltip:'当前的滚动值(开始的滚动值)'
    })
    value:number = 0;

    @property({
        tooltip:'是否显示正负符号'
    })
    showPlusSymbol:boolean = false;

    @property({
        tooltip:'滚动的目标值'
    })
    public get targetValue() : number {
        return this._targetValue;
    }
    public set targetValue(v : number) {
        this._targetValue = v;
        this.scroll();//数据变动了就开始滚动
    }
    @property
    private _targetValue : number = 100;
    
    
    /** 滚动的线性差值 0 ~ 1 */
    @property({
        tooltip:'滚动的线性差值',
        step:0.01,
        max:1,
        min:0
    })
    lerp = 0.1;	  

    @property({
        tooltip:'是否在开始时就播放'
    })
    private playAtStart:boolean = true;

    @property({
        tooltip:'在滚动之前会等待几秒',
        step:0.1,
        max:1,
        min:0
    })
    private runWaitTimer:number = 0;

    @property({
        tooltip:"x {{0}}"
    })
    private formatTemplate:string = REPLACE_STRING;

    @property({
        type:cc.Enum(VALUE_TYPE),
        tooltip:'是否在开始时就播放'
    })
    private valueType:VALUE_TYPE = VALUE_TYPE.INTEGER;


    /**
     * scrollEvents
     * 参数1, label
     * 参数2, current Value
     * 参数3, target Value
     */
    @property({
        type:cc.Component.EventHandler,
        visible:function(){return this.valueType == VALUE_TYPE.CUSTOMER}
    })
    private scrollEvent:cc.Component.EventHandler = new cc.Component.EventHandler();

    private isScrolling:boolean = false;   


    //BhvRollNumber

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if(this.label == undefined){
            this.label = this.node.getComponent(cc.Label);
        }

        if(this.playAtStart){
            this.updateLabel();
            this.scroll();
        }
    }


    /**开始滚动数字 */
    scroll(){
        if(this.isScrolling)return;//已经在滚动了就返回
        if(this.runWaitTimer>0){
            this.scheduleOnce(()=>{
                this.isScrolling = true;
            },this.runWaitTimer);
        }else{
            this.isScrolling = true;
        }
       
    }

    /**停止滚动数字 */
    stop(){
        this.value = this.targetValue;
        this.isScrolling = false;
        this.updateLabel();
    }

    /**初始化数值,不填写则全部按默认值处理 */
    init(value?:number,target?:number,lerp?:number){
        this.targetValue = target||0;
        this.value = value||0;
        this.lerp = lerp||0.1;
    }

    /**滚动到指定数字 */
    scrollTo(target?:number){
        if(target === null || target === undefined)return;
        this.targetValue = target;
    }

    /**
     * 格式化类型
     */
    static VALUE_TYPE = VALUE_TYPE;

    /**格式化数值类型 */
    static Format(value:number,type:VALUE_TYPE){
        let string = '';
        switch (type) {
            case VALUE_TYPE.INTEGER://最终显示整数类型
                string = Math.round(value) + '';
                break;
            case VALUE_TYPE.FIXED_2://最终显示两位小数类型
                string = value.toFixed(2);
                break;
            case VALUE_TYPE.TIMER: //最终显示 计时器类型
                string = parseTimer(value);
                break;
            case VALUE_TYPE.PERCENTAGE: //最终显示 百分比
                string = Math.round(value*100) +'%';
                break;
            case VALUE_TYPE.KMBT_FIXED2: //长单位缩放,只计算到 KMBT
                if(value>=Number.MAX_VALUE){
                    string = 'MAX';
                }else if(value > 1000000000000){
                    string =  (value/1000000000000).toFixed(2)+'T';
                }else if(value >1000000000){
                    string =  (value/1000000000).toFixed(2)+'B';
                }else if(value >1000000){
                    string =  (value/1000000).toFixed(2)+'M';
                }else if(value >1000){
                    string =  (value/1000).toFixed(2)+"K";
                }else{
                    string = Math.round(value).toString();
                }
                break;
            case VALUE_TYPE.THOUSAND_SEPARATOR:
                let num = Math.round(value).toString();
    
                string = num.replace(new RegExp('(\\d)(?=(\\d{3})+$)', 'ig'), "$1,");
                break;
            default:
                break;
        }

        //显示正负符号
        return string;
    }

    /** 更新文本 */
    updateLabel(){
        let value  = this.value;
        let string = BhvRollNumber.Format(value,this.valueType);

        //替换字符 {{0}}
        if(this.formatTemplate.includes(REPLACE_STRING)){
            string = this.formatTemplate.replace(REPLACE_STRING,string);
        }

        //显示正负符号
        if(this.showPlusSymbol){
            if(value>=0){
                string ='+'+string;
            }else if(value<0){
                string ='-'+string;
            }
        }
       
        if(this.label && this.valueType !== VALUE_TYPE.CUSTOMER){
            if(string === this.label.string)return; //保证效率,如果上次赋值过,就不重复赋值
            this.label.string = string;
        }else{
            this.scrollEvent.emit([this.label,this.value,this.targetValue,this.scrollEvent.customEventData]);
        }
    }

    update (dt) {
        if(this.isScrolling == false)return;
        let scale = (dt / (1 / 60));
        this.value = cc.misc.lerp(this.value,this.targetValue,this.lerp*scale);
        this.updateLabel();
        if(Math.abs(this.value - this.targetValue)<=0.0001){
            this.value = this.targetValue;
            this.isScrolling =  false;
            //this.node.emit('roll-hit-target');//滚动数字击中了目标
            return;
        }
    }
    
}

/** 时间格式转换 */
function parseTimer(timer:number =0,isFullTimer:boolean = true){
    let t:number = Math.floor(timer);
    let hours:number = Math.floor( t/3600);
    let mins:number =  Math.floor( (t%3600)/60);
    let secs:number =  t%60;
    let m = ''+mins;
    let s = ''+secs;
    if(secs<10)s = '0'+secs;
    
    //full timer 按小时算,无论有没有小时
    if(isFullTimer){
        if(mins<10) m = '0' + mins;
        return  hours+':'+m+':'+s;
    }else{
        m = ''+ (mins +hours*60);
        if(mins<10) m = '0' + mins;
        return m+':'+s;
    }
}