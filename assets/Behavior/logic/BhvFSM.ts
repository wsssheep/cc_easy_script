/*
 * @Author: ws.s
 * @Date: 2019-11-25 13:02:46
 * @LastEditTime: 2019-12-09 14:32:40
 * @LastEditors: wss
 */


const { ccclass, property } = cc._decorator;


/**
 * 状态机行为 [v1.0.0]
 */
@ccclass
export default class BhvFSM extends cc.Component {


    private stateList: string[] = []; //状态机维护的一组状态

    @property
    public debug:boolean = false;

    /**当前状态机的状态 */
    public get currentState(): string {
        return this._currentState;
    }

    public get preState(): string {
        return this._preState;
    }

    @property({
        visible: true
    })
    private _currentState: string = "";
    private _preState: string = "";

    /**当前状态的运行时间 */
    public duration: number = 0;

    public paused:boolean = false;

    /**
     *  给状态机添加指定的状态 
     * @param state 
     */
    public addState(state: string) {
        let _tmpState = this.getState(state);

        if (_tmpState == null) {
            this.stateList.push(state);
            //如果是第一个添加的状态，那就是当前的初始状态
            if (this.stateList.length == 1) {
                this._currentState = state;
            }
        }
        else {
            cc.warn(`FSM：该状态[${state}]已经被添加！`);
        }
    }

    /**
     * 给状态机添加一组状态
     * @param states 
     */
    public addStates(states: object) {
        Object.keys(states).forEach((key) => {
            this.addState(states[key]);
        });

    }

    /**
     * 移除状态机的状态
     * @param state 
     */
    public removeState(state: string) //删除状态
    {
        let _tmpState: string = this.getState(state);
        if (_tmpState != null) {
            this.stateList.splice(this.stateList.indexOf(_tmpState), 1);
        }
        else {
            cc.warn(`FSM：该状态[${state}]不存在,不需要移除！`);
        }
    }

    public getState(state: string): string//获取相应状态
    {
        if (this.stateList.indexOf(state) !== -1) {
            return state;
        } else {
            return null;
        }
    }

    /**
     * 重新启动一次状态(会调用状态入口函数)
     */
    public resetState(){
        this.changeState();
    }

    /**
     * 跳转状态机的状态
     * @param state 
     */
    public changeState(state: string = this._preState) {
        let _tmpState: string = this.getState(state);       //要改变的状态不存在

        if (_tmpState == null) {
            cc.log(`FSM：该状态[${state}]不存在于状态机中！`);
            return;
        }

        if (this._currentState != null) //当前状态不为空
        {
            if (this[`on${this._currentState}Exit`]) {
                this[`on${this._currentState}Exit`](this._currentState,this._preState);
            }
        }

        this._preState = this._currentState; //保存之前状态
        this._currentState = _tmpState; //缓存为当前状态
        this.duration = 0; //状态计时器归零
        if (this[`on${this._currentState}Enter`]) {
            this[`on${this._currentState}Enter`](this._currentState,this._preState);
        }

        if(this.debug)cc.log(`${this._preState}>${this._currentState}`);
    }

    public update(dt) {
        // 更新状态机时间
        if(this.paused || dt ==0 )return

        if (this._currentState != null) {
            this.duration += dt;
            if (this[`on${this._currentState}Update`]) {
                this[`on${this._currentState}Update`](this._currentState,this._preState);
            }
        }
    }

    /**
     *  移除所有状态
     */
    public RemoveAllState() {
        if (this._currentState != null) {
            if (this[`on${this._currentState}Exit`]) {
                this[`on${this._currentState}Exit`](this._currentState,this._preState);
            }
            this._currentState = null;
        }
        this.stateList.length = 0;
    }
}
