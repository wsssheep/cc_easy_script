Bhv FSM

### 介绍 

简单实现的状态机组件，通过继承方式使用。添加状态后，需要手动切换状态。该组件会调用自身的 进入、更新、离开 三个函数，以提供基础的状态机功能。

### 更新

- 0.1 - 更新基本状态机的功能

### 属性

- debug​:​ 显示打印状态机的调试信息
- currentState: 状态机的初始状态名
- preState: 上一个状态
- duration: 状态机的运行时间，状态切换后都会重置，可用于判断当前状态持续时间。
- paused: 状态机是否暂停运行逻辑

### 绑定逻辑

1. 声明 类  MyFSM 继承自 BhvFSM  组件
2. 在 start 生命周期函数添加状态。
3. 在MyFSM类中声明不同的状态对应的触发函数: onXXXEnter / onXXXUpdate / onXXExit 
4. 对应函数会在同名的状态切换的对应时机触发。比如onWalkEnter，是在 Walk 状态进入后触发的。
5. 在不同的状态触发函数中，自己控制逻辑操作和对应条件的状态。
6. 将 MyFSM 组件 挂在对应的对象身上

### 脚本方法

- addState(state: string) - 添加一个状态

  ```typescript
  let fsm = this.node.getComponent('BhvFSM');
  fsm.addState("Walk");
  ```

- addStates(states: object) - 添加一组状态

  ```typescript
  let fsm = this.node.getComponent('BhvFSM');
  fsm.addState("Walk");
  //添加一组状态机的键名
  let states = {
      WALK:"Walk",
      RUN:"Run",
      STOP:"Stop"
  }
  
  fsm.addStates(states);
  
  ```

- removeState(state: string) - 移除一个状态

  ```typescript
  let fsm = this.node.getComponent('BhvFSM');
  //移除状态
  fsm.removeState("Walk");
  ```

- getState(state: string): string  - 获取一个状态

  ```typescript
  let fsm = this.node.getComponent('BhvFSM');
  let res = this.getState("Start");
  if(res == null){
  	//状态不存在
  }
  ```

- changeState(*state*: *string* )  - 改变一个状态

  ```typescript
  let fsm = this.node.getComponent('BhvFSM');
  let res = this.getState("Start");
  if(res == null){
  	//状态不存在
  }
  ```

- removeAllStates(): string  -  移除所有的 states, 如果当前处于该状态会强制触发离开

- resetState(); //重启状态， 此方法会重启状态，重新调用状态的入口函数

### 完整例子

- 可以参考以下方式建立自己的FSM

  ```typescript
  const STATE = {
          Idle:"Idle"
      	WALK:"Walk",
      	RUN:"Run",
      	STOP:"Stop"
  }
  
  @ccclass
  export default class MyFSM extends BhvFSM {
      static STATE = STATE;
  	start(){
          this.addStates(STATE);
          this.changeState(STATE.Idel);
      }
      
      //可以通过函数参数获得状态名，也可以通过 this.currentState 获得
      onIdleEnter(cur:string,pre:string){
          this.changeState(STATE.Walk);
      }
      onWalkEnter(){
          cc.log("开始走路！");
      }
      onWalkUpdate(){
          cc.log("走路！");
          if(this.duration>=0.5){
  		this.changeState(STATE.Run);
          }       
      }
      
      onRunEnter(){
          cc.log("跑起来了！");
      }
      onRunUpdate(){
          cc.log("狂奔！"); //update会持续刷新
          if(this.duration>=1.0){
  			this.changeState(STATE.Stop);
          }
      }
      
      onRunExit(){
            cc.log("不跑了！");
  	}
      
      onStopEnter(){
          cc.log("筋疲力尽！");
      }
      
      
  }
  
  
  ```



