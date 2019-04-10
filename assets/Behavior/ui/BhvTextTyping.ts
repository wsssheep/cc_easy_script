// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

enum TYPE_MODE {
    left2right,
    right2left,
    middle2sides,
    sides2middle 
}


/**转换文本 或数组类型 到文本 */
let transferText = function (text: any): string {
    if (Array.isArray(text)) {
        text = text.join('\n');
    } else if (typeof (text) === 'number') {
        text = text.toString();
    }
    return text;
}

@ccclass
@menu("添加特殊行为/UI/Text Typing (打字机)")
@disallowMultiple
export default class BhvTextTyping extends cc.Component {

    @property({
        type: cc.Enum(TYPE_MODE),
        tooltip: '打字模式'
    })
    typeMode:TYPE_MODE = TYPE_MODE.left2right;

    @property({
        tooltip: '打字速度'
    })
    speed: number = 0.1;

    @property({
        tooltip: '是否开始时就打印字体'
    })
    autoStart: boolean = true;


    get isLastChar() {
        return (this.typingIdx === this.textLen);
    }

    insertIdx:number;
    textLen: number;
    typingIdx: number;
    fLabel: cc.Label;
    text: string;
    /**是否正在打字 */
    isTyping: boolean;
    /**暂停打字状态 */
    paused: boolean;


    start() {
        let label = this.node.getComponent(cc.Label);
        if (!label) return;
        this.isTyping = false;
        this.paused = false;
        this.fLabel = label;
        if(this.autoStart)this.text = label.string;
        label.string = '';
        if (this.autoStart) this.run(this.text, this.speed);
    }


    /**
     * 开始打字状态
     * @param text  打字文本内容
     * @param speed 打字速度 0.5 单位 秒
     * @param startIdx 开始打字时的文字位置
     */
    run(text?: string, speed?: number, startIdx?: number) {
        if (text !== undefined) {
            this.setTypingContent(text);
        }
        if (speed !== undefined) {
            this.speed = speed;
        }
        if (startIdx === undefined) {
            startIdx = 0;
        }

        this.typingIdx = startIdx + 1;
        if (this.speed === 0) {
            this.stop(true);
        } else {
            this.startTimer();
        }


    }

    /**停止打字状态 */
    stop(showAllText:boolean = false) {

        if (showAllText) {
            this.typingIdx = this.textLen;
            this.setText(this.text);
            //this.node.emit('type');//打字完成信号
            //this.node.emit('complete');//打字完成信号
        }

        this.unschedule(this.onTyping);//释放计时器


    }

    /**暂停打字状态 */
    pause() {
        this.paused = true;
    }

    /**恢复打字状态 */
    resume() {
        this.paused = false;
    }

    /*打字追加文本 */
    appendText(text:string) {
        let newText:string = this.text.concat(transferText(text));
        if (this.isTyping) {
            this.setTypingContent(newText);
        } else {
            this.run(newText, undefined, this.textLen);
        }

    }

    private setTypingContent(text) {
        this.text = transferText(text);
        this.textLen = this.getTextLength(this.text);

    }


    private onTyping() {
        if (this.paused == true) return;//暂停时,不打字
        let newText:string = this.getTypingString(this.text, this.typingIdx, this.textLen, this.typeMode);
        //console.log(this.text, this.typingIdx, this.textLen, this.typeMode);
        this.setText(newText);
        //this.node.emit('type');

        if (this.isLastChar) {
            this.isTyping = false; //停止打印
            this.unschedule(this.onTyping); //释放计时器
            //this.node.emit('complete');
        } else {
            this.isTyping = true; //正在打印
            this.typingIdx++;
        }
    }

    private getTypingString(text:string, typeIdx:number, textLen:number, typeMode:TYPE_MODE) {
        let result:string,startIdx:number,endIdx:number,midIdx:number;
        if (typeMode === TYPE_MODE.left2right) { 
            startIdx = 0;
            endIdx = typeIdx;
            this.insertIdx = endIdx;
            result = this.getSubString(text, startIdx, endIdx);

        } else if (typeMode === TYPE_MODE.right2left) { 
            endIdx = textLen;
            startIdx = endIdx - typeIdx;
            this.insertIdx = 0;
            result = this.getSubString(text, startIdx, endIdx);

        } else if (typeMode === TYPE_MODE.middle2sides) { 
            midIdx = textLen / 2;
            startIdx = Math.floor(midIdx - (typeIdx / 2));
            endIdx = startIdx + typeIdx;
            this.insertIdx = (typeIdx % 2) ? typeIdx : 0;
            result = this.getSubString(text, startIdx, endIdx);

        } else if (typeMode === TYPE_MODE.sides2middle) { 
            let lowerLen:number = Math.floor(typeIdx / 2);
            let lowerResult:string;
            if (lowerLen > 0) {
                endIdx = textLen;
                startIdx = endIdx - lowerLen;
                lowerResult = this.getSubString(text, startIdx, endIdx);
            } else {
                lowerResult = "";
            }

            let upperLen:number = typeIdx - lowerLen;
            let upperResult:string;
            if (upperLen > 0) {
                startIdx = 0;
                endIdx = startIdx + upperLen;
                this.insertIdx = endIdx;
                upperResult = this.getSubString(text, startIdx, endIdx);
            } else {
                upperResult = "";
                this.insertIdx = 0;
            }
            result = upperResult + lowerResult;
        }

        return result;
    }


    private startTimer(delay?: number) {

        this.unschedule(this.onTyping);//卸载计时器
        delay = delay || this.speed;
        //startAt
        //this.schedule(this.onTyping,this,0.5,cc.macro.REPEAT_FOREVER,delay);

        this.schedule(this.onTyping, this.speed, cc.macro.REPEAT_FOREVER, 0.5);//播放计时器

    }

    private setText(text) {

        //this.node.emit('textTypeCallback',this.setTextCallbackScope, text, this.isLastChar, this.insertIdx);

        if (this.fLabel && text) {
            this.fLabel.string = text;
        }

    }

    private getTextLength(text:string):number {
        let len = text.length;
        return len;
    }

    private getSubString(text:string, startIdx:number, endIdx:number):string{
        let result = text.slice(startIdx, endIdx);
        return result;
    }




    // LIFE-CYCLE CALLBACKS:


}
