import BhvFSM from "../../Behavior/logic/BhvFSM";


const { ccclass, property } = cc._decorator;

const STATE = {
    Idle: "Idle",
    Walk: "Walk",
    Run: "Run",
    Stop: "Stop"
}

@ccclass
export default class DemoFSM extends BhvFSM {
    static STATE = STATE;
    
    @property(cc.Label)
    testLabel:cc.Label = null;

    start() {
        this.addStates(STATE);
        this.changeState(STATE.Idle);
    }

    //可以通过函数参数获得状态名，也可以通过 this.currentState 获得
    onIdleEnter(cur: string, pre: string) {
        this.changeState(STATE.Walk);
    }
    onWalkEnter() {
        this.testLabel.string = "开始走路！";
    }
    onWalkUpdate() {
        this.testLabel.string = "走路中！时间:"+Math.floor(this.duration*10)/10+"/1.5 ms";
        if (this.duration >= 1.5) {
            this.changeState(STATE.Run);
        }
    }

    onRunEnter() {
        this.testLabel.string = "跑起来了!";
    }
    onRunUpdate() {
        this.testLabel.string = "狂奔中!时间:"+Math.floor(this.duration*10)/10+" /2ms";
        if (this.duration >= 2.0) {
            this.changeState(STATE.Stop);
        }
    }

    onRunExit() {
        this.testLabel.string = "不跑了!";
    }

    onStopEnter() {
        this.testLabel.string = "精疲力竭!休息一会";
    }

    onStopUpdate(){
        this.testLabel.string = "休息中!时间:"+Math.floor(this.duration*10)/10+"/5 ms";
        if (this.duration >= 5.0) {
            this.testLabel.string = "休息完了!";
            this.changeState(STATE.Walk);
        }  
    }


}