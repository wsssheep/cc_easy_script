
const ENTER_EVENT:string = 'enter';
const TRANSITION_COMPLETE_EVENT:string = 'transition_complete';
const TRANSITION_DENIED_EVENT:string = 'transition_denied';

//TODO 分层状态机的 功能测试 (分层测试...)

const emitter = new cc.EventTarget();
/*
* Creates a generic StateMachine. Available states can be set with addState and initial state can
* be set using initialState setter.
* This sample creates a state machine for a player model with 3 states (Playing, paused and stopped)
* <pre>
*  var playerSM = new StateMachine();
*
*  playerSM.addState("playing",{ enter: this.onPlayingEnter, exit: this.onPlayingExit, from:["paused","stopped"] });
*  playerSM.addState("paused",{ enter: this.onPausedEnter, from:"playing"});
*  playerSM.addState("stopped",{ enter: this.onStoppedEnter, from:"*"});
*
*  playerSM.on('transition_denied', this.handleTransitionDenied);
*  playerSM.on('transition_complete', this.handleTransitionComplete);
*
*  playerSM.initialState = "stopped";
* </pre>
*
* It's also possible to create hierarchical state machines using the argument "parent" in the addState method
* This example shows the creation of a hierarchical state machine for the monster of a game

* (Its a simplified version of the state machine used to control the AI in the original Quake game)
*  <pre>
*   var monsterSM = new StateMachine()
*   monsterSM.add("idle",{enter:this.onIdle, from:["smash", "punch", "missle attack"]})
*   monsterSM.add("attack",{enter:this.onAttack, from:"idle"})
*   monsterSM.add("melee attack",{parent:"attack", enter:this.onMeleeAttack, from:"attack"})
*   monsterSM.add("smash",{parent:"melee attack", enter:this.onSmash})
*   monsterSM.add("punch",{parent:"melee attack", enter:this.onPunch})
*   monsterSM.add("missle attack",{parent:"attack", enter:this.onMissle})
*   monsterSM.add("die",{enter:this.onDead, from:["smash", "punch", "missle attack"]})
*
*   monsterSM.initialState = "idle"
*  </pre>
*/

/**
 * 分层状态机对象，
 * 可以创建一个分层的状态机，控制对象状态
 */
export default class StateMachine {
  private _state:string;
  private _states:Object;
  parentState:State;
  parentStates:Array<State>;
  path:Array<number>;

  constructor(){
    this._states = {};
    this.parentStates = [];
    this.path = [];
  }

  private emit(type:string,arg1?:any,arg2?:any,arg3?:any,arg4?:any,arg5?:any){
    emitter.emit(type,arg1,arg2,arg3,arg4,arg5);
  }

  on(type:string,callback:Function,target:any){
    emitter.on(type,callback,target);
  }

  off(type:string,callback:Function,target:any){
    emitter.off(type,callback,target);
  }

  hasState(stateName:string):boolean {
    return Object.keys(this._states).indexOf(stateName) !== -1;
  }

  /**
   * 添加新状态
   * stateName新国家的名称
   * stateData——一个包含状态进入和退出回调以及允许状态从
   * from"属性可以是具有状态名称的字符串或数组，或者*以允许任何转换
  */
  addState(stateName:string, stateData:{from?:string|Array<string>,enter?:Function,exit?:Function,parent?:string} ={}):void {
    if(this.hasState(stateName)){
      console.log("[StateMachine] 覆盖已存在的状态: " + stateName);
    }

    this._states[stateName] = new State(stateName, stateData.from, stateData.enter, stateData.exit, this._states[stateData.parent]);
  }

  /**
   * 设置初始状态,回调会调用，并且会发送 TRANSITION_COMPLETE 事件
   * 只会发生在没有添加状态的情况
  */
  set initialState(stateName:string) {

    if (this._state === undefined && this.hasState(stateName)) {
      this._state = stateName;

      //从我们要转换到的状态的root 的父状态向下调用所有父状态的 enter 回调函数

      if(typeof this._states[this._state].root !== "undefined" && this._states[this._state].root !== null){
        let parentStates:Array<State> = this._states[this._state].parents;

   
        for (let parentState of parentStates) {

          if(parentState.enter !== null && typeof parentState.enter === "function"){
            parentState.enter.call(this, {toState: stateName});
          }
        };
      }

      // Invoke the enter callback of the state we're transitioning into
      if(this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function"){
        this._states[this._state].enter.call(this, {currentState: this._state});
      }

      this.emit(TRANSITION_COMPLETE_EVENT, {toState:stateName});
    }

  }

  /**
  *  从 _states 字典里取出 当前的state
  */
  get state():string {
    return this._states[this._state];
  }

  get states():Object {
    return this._states;
  }

  /**
   * 通过名字获取状态对象
   */
  getStateByName(name:string):State|null  {
    for (let key in this._states) {
      let state:State = this._states[key];
      if(state.name === name){
        return state;
      }
    }
    return null;
  }

  /**
    * 验证是否可以进行从当前状态到作为参数传递的状态的转换。
    * stateName国家名称
  */
  canChangeStateTo(stateName:string):boolean {
    return (stateName !== this._state && ( this._states[stateName].from.indexOf(this._state)!== -1) || this._states[stateName].from === '*' );
  }

  /**
    *发现两个状态之间有多少个“入口”以及有多少个“出口”。
    *给定状态并返回具有这两个整数的数组
    *stateFrom 是要离开的状态
    *stateTo 是要进入的状态
  */
  findPath(stateFrom:string, stateTo:string):Array<number> {
    // 验证状态是否位于同一个“分支”或具有共同的 parent
    let fromState:State = this._states[stateFrom];
    let c:number = 0;
    let d:number = 0;
    while (fromState)
    {
      d=0;
      let toState:State = this._states[stateTo];
      while (toState)
      {
        if(fromState == toState)
        {
          // 它们属于同一“分支”，或者具有共同的 parent
          return [c,d];
        }
        d++;
        toState = toState.parent;
      }
      c++;
      fromState = fromState.parent;
    }
    //没有直接路径，没有通用父路径：exit 直到 root，然后输入结果.
    return [c,d];
  }

  /**
   * 改变当前状态
   * 只有当预期状态允许从当前状态转换时，才会这样做
   * 改变状态将调用退出状态的 出口 回调函数,并且触发进入状态的 入口 回调函数
   * stateTo要转换为
  */
  changeState(stateTo:string):void {
    // 如果没有这样的状态
    if (!this.hasState(stateTo)){
      console.warn("[StateMachine] 不能切换状态, "+ stateTo +"未找到");
      return;
    }

    // 如果当前状态不允许进行此转换
    if(!this.canChangeStateTo(stateTo))
    {
      console.warn("[StateMachine] 切换状态 "+ stateTo +" 被拒绝");
      this.emit(TRANSITION_DENIED_EVENT, {
        from:this._state,
        to:stateTo,
        allowed: this._states[stateTo].from
      });
      return;
    }

    // 调用exit 和 enter 回调（如果切换了状态）
    let path:Array<number> = this.findPath(this._state,stateTo);
    if(path[0]>0){
      if(this._states[this._state].exit !== null && typeof this._states[this._state].exit === "function"){
        this._states[this._state].exit.call(null,{currentState: this._state});
      };

      let parentState:State = this._states[this._state];

      for(let i:number=0; i<path[0]-1; i++)
      {
        parentState = parentState.parent;
        if(parentState.exit !== null && typeof parentState.exit === "function"){
          parentState.exit.call(null,{currentState: parentState.name});
        }
      }
    }
    let oldState:String = this._state;
    this._state = stateTo;
    if(path[1]>0)
    {
      if(typeof this._states[stateTo].root !== "undefined" && this._states[stateTo].root !== null){
        let parentStates:Array<State> = this._states[stateTo].parents;
        for(var k:number = path[1]-2; k>=0; k--){
          if(typeof parentStates[k] !== "undefined" &&
          parentStates[k] !== null &&
          parentStates[k].enter !== null &&
          typeof parentStates[k].enter === "function"){
            parentStates[k].enter.call(null,{currentState: parentStates[k].name});
          }
        }
      }
      if(this._states[this._state].enter !== null && typeof this._states[this._state].enter === "function"){
        this._states[this._state].enter.call(null,{currentState: this._state});
      }
    }
    console.log("[StateMachine] 状态切换至" + this._state);

    // Transition is complete. dispatch TRANSITION_COMPLETE
    this.emit(TRANSITION_COMPLETE_EVENT, {fromState:oldState, toState:stateTo});
  }


  destroy(){
    this._states = null;
    this.parentStates = null;
    this.path = null;
    this.parentState = null;
  }

}

/**
 * 一个状态类
 */
class State {
    /**状态名 */
    name: string;
    /** 来源 */
    from: any;
    /** 进入状态的函数 */
    enter: Function;
    /** 离开状态的函数 */
    exit: Function;
    /** 状态的孩子 */
    children: Array<State>;
    /**状态的父母 */
    private _parent: State;
  
    constructor(name:string, from:any, enter:Function, exit:Function, parent:State) {
      this.name = name;
      this.from = from || "*";
      this.enter = enter;
      this.exit = exit;
      this.children = [];
      if ((typeof parent !== "undefined" && parent !== null)) {
        this._parent = parent;
        this._parent.children.push(this);
      }
    }
  
    set parent(parent:State){
      this._parent = parent;
      this._parent.children.push(this);
    }
  
    get parent():State {
      return this._parent;
    }
  
    get root():State {
      let parentState:State = this._parent;
      if ((typeof parentState !== "undefined" && parentState !== null)) {
        while (parentState.parent)
        {
          parentState = parentState.parent;
        }
      }
      return parentState;
    }
  
    get parents():Array<State> {
      let parentList:Array<State> = [];
      let parentState:State = this._parent;
      if ((typeof parentState !== "undefined" && parentState !== null)) {
        parentList.push(parentState);
        while (parentState.parent)
        {
          parentState = parentState.parent;
          parentList.push(parentState);
        }
      }
      return parentList;
    }
  }
  



