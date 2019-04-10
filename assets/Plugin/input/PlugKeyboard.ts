
const {ccclass, property, menu} = cc._decorator;

/**当前发送的信号 */
let SIGNAL = {
    /**按下按钮，返回按键 keyCode  和上次放开时间 (keyCode,duration)=>{} */
    KEY_DOWN:'Keyboard:Down',
    /**松开按钮，返回 按键 keyCode 和 上次按下按键时间 (keyCode,duration)=>{} */
    KEY_UP:'Keyboard:Up',
}

/**
 * 键盘插件
 */
@ccclass
@menu("添加全局插件/Input/PlugKeyboard")
export default class PlugKeyboard extends cc.Component {

    @property({
        tooltip:'调试按键信息'
    })
    debug:boolean = false;
    
    static SIGNAL = SIGNAL;
    events = new cc.EventTarget();
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
    
    start () {
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

        this.keyTimes.set(keyCode, this._timer);

        this.triggerKey = keyCode;

        this.events.emit(SIGNAL.KEY_DOWN,keyCode,duration);

        if(this.debug)console.log('按下:',this.getKeyName(keyCode),duration);
    }

    private _keyUp(keyCode:number){
        this.keyMap.set(keyCode,false);
        this.keyTimes.set(keyCode, this._timer);
        let duration = Math.floor(this._timer - this.keyTimes.get(keyCode) *1000)/1000;
        this.triggerKey = keyCode;
        this.events.emit(SIGNAL.KEY_UP ,keyCode,duration);
        if(this.debug)console.log('释放:',this.getKeyName(keyCode),duration);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        let keyCode:number = event.keyCode;
        let key = cc.macro.KEY;
    
		// 在 frames 中阻止某些键按下，因为这会导致页面滚动。
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


    /**
     * 按键按下的持续时间
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    getKeyDuration(key:cc.macro.KEY){
        if(!this.keyMap.get(key))return 0;

        let start =  this.keyTimes.get(key);
        if(start == undefined || start > this._timer)return 0;

        let duration = this._timer - start;
        duration = Math.floor(duration*1000)/1000;

        return duration;
    }

    /**
     * 按键是否按下
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    IsKeyDown(key:cc.macro.KEY){
		return this.keyMap.get(key);
    };

    /**
     * 最后一次按的按键
     */
    get lastKey(){
        return  this.triggerKey;
    }

    /**
     * 最后一次按的按键名
     */
    get lastKeyName(){
        return this.getKeyName(this.triggerKey);
    }

    /**
     * 获取键位名字 (设置键位时 使用, 或者调试时使用)
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    getKeyName(key:cc.macro.KEY){
        return fixedStringFromCharCode(key);
    }

    /**
     * 模拟键位操作，松开按键
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    simKeyUp(key:cc.macro.KEY){
		if (this.keyMap.get(key)) return;
        this.keyMap.set(key,true);
        this.triggerKey = key;
        this._keyUp(key);
    }

    /**
     * 模拟键位操作，按下按键
     * @param key - cc.macro.KEY 或者 直接输入 code 值
     */
    simKeyDown(key:cc.macro.KEY){
		this.keyMap.set(key,false);
        this.triggerKey = key;
        this._keyDown(key);
	
    }

    update(dt){
        this._timer +=dt;
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