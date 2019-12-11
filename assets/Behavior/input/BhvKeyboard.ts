/*
 * @Author: wss 
 * @Date: 2019-06-08 21:10:49 
 * @Last Modified by: wss
 * @Last Modified time: 2019-11-10 22:24:34
 */



const {ccclass, property, menu,executionOrder} = cc._decorator;

/**自定义键位模式 (注意不识别大小写) */
const CUSTOM_KEY = {
    'up':cc.macro.KEY.up,
    'down':cc.macro.KEY.down,
    'left':cc.macro.KEY.left,
    'right':cc.macro.KEY.right,
    'attack':cc.macro.KEY.z,
    'attack2':cc.macro.KEY.x,
    'attack3':cc.macro.KEY.c,
}

/** 暂存默认配置文件，方便恢复数据 */
const DEFAULT_CUSTOM_KEY = JSON.parse(JSON.stringify(CUSTOM_KEY));

/**当前发送的信号 */
let SIGNAL = {
    /**按下按钮，返回按键 keyCode  和上次放开时间 (keyCode,duration)=>{} */
    KEY_DOWN:'down',
    /**松开按钮，返回 按键 keyCode 和 上次按下按键时间 (keyCode,duration)=>{} */
    KEY_UP:'up',
}

/**
 * 全局键盘插件 [v0.2.0]
 * ver 0.1 将大部分方法修改为静态方法
 * ver 0.1.1 修改 释放按键间隔错误
 * ver 0.2.0 增加自定义按钮功能
 * todo 增加新的功能： 按钮队列（便于输入绝技）
 */
@ccclass
@menu("添加全局插件/Input/BhvKeyboard")
@executionOrder(-1)
export default class BhvKeyboard extends cc.Component {

    @property({
        tooltip:'调试按键信息'
    })
    debug:boolean = false;
    
    /** 键枚举值 = cc.macro.KEY */
    static KEY = cc.macro.KEY;

    /**自定义按键类型 */
    static CUSTOM = CUSTOM_KEY;


    /**键盘唯一实例 */
    static _Instance:BhvKeyboard = null;

    /**查找键盘唯一实例 */
    static GetInstance(){
        if(!this._Instance){
            let canvas = cc.Canvas.instance;
            let comp = canvas.getComponent(BhvKeyboard);
            if(comp==null){
                comp = canvas.addComponent(BhvKeyboard);
            }
            this._Instance= comp;
         }
        return this._Instance;
    }

    /**事件目标 */
    private events = new cc.EventTarget();

    private _onBlurCallback = null;
    /** 储存按键的 按下 放开状态 */
    private keyMap:Map<any,any> = new Map();
    /** 储存按键 按下 到放开的间隔时间  (放手时触发) */
    private keyTimes:Map<any,any> = new Map();	
    /** 最后触发的按键 */
    private triggerKey:number = 0;
    private _timer:number = 0;
 
    //在嵌入 iframe 的页面，这些按键都会造成页面的移动，需要屏蔽掉
    private keysToBlockWhenFramed = [32, 33, 34, 35, 36, 37, 38, 39, 40, 44];

    onLoad () {
        this._timer =0;
    }

    onEnable(){
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        //切后台或隐藏时，按键停止
        cc.game.on(cc.game.EVENT_HIDE, this.onWindowBlur, this);

        //兼容浏览器，丢失焦点后，把输入事件强制关闭
        if (cc.sys.isBrowser) {
            this._onBlurCallback = null;
            this._onBlurCallback = () => {
                this.onWindowBlur()
            };
            cc.game.canvas.addEventListener('blur', this._onBlurCallback);
        }   
    }

    onDisable(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        if (this._onBlurCallback && cc.sys.isBrowser) cc.game.canvas.removeEventListener('blur', this._onBlurCallback);
    }

    //失去窗口焦点的处理
    private onWindowBlur(){
        // Fire "On key up" for any keys held down, to prevent stuck keys
        this.keyMap.forEach((value,key)=>{
            if (!value)return;
            this.keyMap.set(key,false);
            this.keyTimes.delete(key);
            this.triggerKey = key;
        })

    }

    private sendEvent(name){
        let event = new cc.Event.EventCustom(name,true);
        this.node.dispatchEvent(event);
    }


    private _keyDown(keyCode:number){
		// 如果按下已经是按下的，就忽略
        if (this.keyMap.get(keyCode)) return;
        
        this.keyMap.set(keyCode,true);

        let duration;
        if(this.keyTimes.get(keyCode)){
            duration = Math.floor( (this._timer - this.keyTimes.get(keyCode))*1000 )/1000;
        }

        this.triggerKey = keyCode;
        this.events.emit(SIGNAL.KEY_DOWN + keyCode,duration);
        this.keyTimes.set(keyCode, this._timer);

        if(this.debug)cc.log('按下:',BhvKeyboard.GetKeyName(keyCode),duration);
    }

    private _keyUp(keyCode:number){
        this.keyMap.set(keyCode,false);

        let duration = Math.floor((this._timer - this.keyTimes.get(keyCode))*1000 )/1000;

        this.triggerKey = keyCode;
        this.events.emit(SIGNAL.KEY_UP + keyCode,duration);
        this.keyTimes.set(keyCode, this._timer);

        if(this.debug)cc.log('释放:',BhvKeyboard.GetKeyName(keyCode),duration);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let keyCode:number = event.keyCode;
        let key = cc.macro.KEY;
    
		// 在 frames 中阻止某些按键冒泡，因为这会导致页面滚动。
		if (window != window.top && this.keysToBlockWhenFramed.indexOf(keyCode) > -1){
            event.stopPropagation();
		}
        
        this._keyDown(keyCode);

    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        let keyCode: number = event.keyCode;
        let key = cc.macro.KEY;
        this._keyUp(keyCode)
    }

    /**增加一个键位抬起监听 */
    static AddKeyUp(key:cc.macro.KEY|string, callback:(duration?:number)=>void, target?: any, useCapture?: boolean){
        key = this.ToMacroKey(key);
        this.GetInstance().events.on(SIGNAL.KEY_UP + key,callback,target,useCapture);
    }

    /**增加一个键位按下监听 */
    static AddKeyDown(key:cc.macro.KEY|string, callback:(duration?:number)=>void, target?: any, useCapture?: boolean){
        key = this.ToMacroKey(key);
        this.GetInstance().events.on(SIGNAL.KEY_DOWN + key,callback,target,useCapture);
    }
    
    /**按键松开，绑定只触发一次的回调 */
    static AddKeyUpOnce(key:cc.macro.KEY|string, callback:(duration?:number)=>void, target?: any){
        key = this.ToMacroKey(key);
        this.GetInstance().events.once(SIGNAL.KEY_UP + key,callback,target);
    }
    /**按键按下，绑定只触发一次的回调 */
    static AddKeyDownOnce(key:cc.macro.KEY|string, callback:(duration?:number)=>void, target?: any){
        key = this.ToMacroKey(key);
        this.GetInstance().events.once(SIGNAL.KEY_DOWN + key,callback,target);
    }

    /**移除一个键位监听,只传递 key 将注销所有有关 key 的回调事件 */
    static RemoveKey(key:cc.macro.KEY|string, callback:Function, target?: any){
        key = this.ToMacroKey(key);
        this.GetInstance().events.off(SIGNAL.KEY_DOWN +key,callback,target);
        this.GetInstance().events.off(SIGNAL.KEY_UP +key,callback,target);
    }

    /**
     * 一口气绑定所有键位的回调事件,移除监听时得 使用 RemoveAllKeys
     * @param keys 批量添加键位监听,可以在键位监听区分 up 或者 down，如果不区分则默认为 up，支持自定义按键名，可以在 CUSTOM_KEY 设置映射
     * @param context  回调函数环境
     */
    static AddMultKeys(keys:object,context:any){
        for (const key in keys) {
            const element = keys[key];
            if(typeof element === 'function'){
                this.AddKeyUp(key,element,context);
            }else if(typeof element === 'object'){
                if(typeof element['up']  === 'function'){
                    this.AddKeyUp(key,element['up'],context);
                }
                if(typeof element['down']  === 'function'){
                    this.AddKeyDown(key,element['down'],context); 
                }

            }
        }

    }

    /**移除目标上的所有键位监听*/
    static RemoveAllKeys(target:any){
        //移除一个 key
        this.GetInstance().events.targetOff(target);
    }


    /**
     * 按键按下的持续时间
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    static GetKeyDuration(key:cc.macro.KEY|string){
        key = BhvKeyboard.ToMacroKey(key);
        if(!this.GetInstance().keyMap.get(key))return 0;

        let start =  this.GetInstance().keyTimes.get(key);
        if(start == undefined || start > this.GetInstance()._timer)return 0;

        let duration = this.GetInstance()._timer - start;
        duration = Math.floor(duration*1000)/1000;

        return duration;
    }

    /**
     * 最后一次按的按键
     */
    static GetLastKey():cc.macro.KEY{
        return  this.GetInstance().triggerKey;
    }

    /**
     * 最后一次按的按键名
     */
    static GetLastKeyName():string{
        return this.GetKeyName(this.GetInstance().triggerKey);
    }

    /**
     * 获取键位名字 (设置键位时 使用, 或者调试时使用)
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    static GetKeyName(key:cc.macro.KEY){
        key = this.ToMacroKey(key);
        return fixedStringFromCharCode(key);
    }

    /**
     * 模拟键位操作，松开按键
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    static SimKeyUp(key:cc.macro.KEY|string){
        key = this.ToMacroKey(key);
		if (this.GetInstance().keyMap.get(key)) return;
        this.GetInstance().keyMap.set(key,true);
        this.GetInstance().triggerKey = key;
        this.GetInstance()._keyUp(key);
    }

    /**
     * 模拟键位操作，按下按键
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    static SimKeyDown(key:cc.macro.KEY|string){
        key = this.ToMacroKey(key);
		this.GetInstance().keyMap.set(key,false);
        this.GetInstance().triggerKey = key;
        this.GetInstance()._keyDown(key);
	
    }

    /**判断一个按键是否被按下 */
    static GetKey(key:cc.macro.KEY|string):boolean{
        key = this.ToMacroKey(key);
        return this.GetInstance().keyMap.get(key);
    }


    static LoadCustomKey(){
        
    }

    static SaveCustomKey(){
        
    }

    /**复制自定义键位的配置文件（方便控制) */
    static CopyCustomKeys(){
        return JSON.parse(JSON.stringify(BhvKeyboard.CUSTOM));
    }

    /** 配置设置KEY */
    static SetCustomKeys(config:object){
        for (const key in BhvKeyboard.CUSTOM) {
            if (BhvKeyboard.CUSTOM.hasOwnProperty(key)) {
                if(key in config){
                    BhvKeyboard.CUSTOM[key] = config[key];
                }
                
            }
        }
    }

    static SetCustomKeyDefault(){
        BhvKeyboard.SetCustomKeys(DEFAULT_CUSTOM_KEY);
    }

    /** 将输入的 key, 自定义key, 全部转换为 cc.macro.KEY 的 枚举整数值 */
    static ToMacroKey(key:cc.macro.KEY|string):cc.macro.KEY{
        if(typeof key === 'string'){
            key = key.toLowerCase();
            if(key in BhvKeyboard.CUSTOM){
                return BhvKeyboard.CUSTOM[key];
            }else{
                return cc.macro.KEY[key];
            }
        }else{
            return key;
        }
    }

    update(dt){
        this._timer +=dt;
    }

    onDestroy(){
        BhvKeyboard._Instance = null;
    }


}


/**转换字符 */
function fixedStringFromCharCode(kc)
{
    kc = Math.floor(kc);
    
    // Alphanumerics work with fromCharCode, so just special case every other key
    switch (kc) {
    case 8:		return "backspace";
    case 9:		return "tab";
    case 13:	return "enter";
    case 16:	return "shift";
    case 17:	return "control";
    case 18:	return "alt";
    case 19:	return "pause";
    case 20:	return "capslock";
    case 27:	return "esc";
    case 33:	return "pageup";
    case 34:	return "pagedown";
    case 35:	return "end";
    case 36:	return "home";
    case 37:	return "←";
    case 38:	return "↑";
    case 39:	return "→";
    case 40:	return "↓";
    case 45:	return "insert";
    case 46:	return "del";
    case 91:	return "left window key";
    case 92:	return "right window key";
    case 93:	return "select";
    case 96:	return "numpad 0";
    case 97:	return "numpad 1";
    case 98:	return "numpad 2";
    case 99:	return "numpad 3";
    case 100:	return "numpad 4";
    case 101:	return "numpad 5";
    case 102:	return "numpad 6";
    case 103:	return "numpad 7";
    case 104:	return "numpad 8";
    case 105:	return "numpad 9";
    case 106:	return "numpad *";
    case 107:	return "numpad +";
    case 109:	return "numpad -";
    case 110:	return "numpad .";
    case 111:	return "numpad /";
    case 112:	return "F1";
    case 113:	return "F2";
    case 114:	return "F3";
    case 115:	return "F4";
    case 116:	return "F5";
    case 117:	return "F6";
    case 118:	return "F7";
    case 119:	return "F8";
    case 120:	return "F9";
    case 121:	return "F10";
    case 122:	return "F11";
    case 123:	return "F12";
    case 144:	return "numlock";
    case 145:	return "scroll lock";
    case 186:	return ";";
    case 187:	return "=";
    case 188:	return ",";
    case 189:	return "-";
    case 190:	return ".";
    case 191:	return "/";
    case 192:	return "'";
    case 219:	return "[";
    case 220:	return "\\";
    case 221:	return "]";
    case 222:	return "#";
    case 223:	return "`";
    case 1005:  return "DPadCenter";
    case 1004:  return "DPadDown";
    case 1000:  return "DPadLeft";
    case 1001:  return "DPadRight";
    case 1003:  return "DPadUp";
  
    default:	return String.fromCharCode(kc);
    }
};


