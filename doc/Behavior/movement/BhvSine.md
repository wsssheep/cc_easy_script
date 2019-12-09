Bhv Sine

### 介绍 

自主进行循环往复的三角函数运动，适合任何循环运动或者表现。

### 更新

- 0.1  - 支持 2D Sine 功能
- todo1 -  支持3D节点的属性

### 编辑器

- Movement -  以何种属性进行sine周期运动

  ```typescript
  enum MOVEMENT {
      horizontal,//垂直(x坐标)
      vertical,//水平(y坐标)
      scale,//缩放值
      scaleX,
      scaleY,
      rotation, 
      opacity,
      skewX,
      skewY,
      forward,
      value, //自定义的值
  }
  ```

- Wave  - 函数的波形

  ```typescript
  enum  WAVE {
      sine, //sine 函数图像，适合来回平滑摇摆
      triangle,//三角形的函数波形，线性
      sawtooth, //从一个值平滑过渡到另外一个值，适合单向循环
      reverseSawtooth, //sawtooth的反向运动
      square	//方型图像，从一个值快速切换到另外一个值，中间没有过渡
  }
  ```

- Period - 函数周期，周期越短函数运行速度越快，代表了多少秒能完成一个周期性的运动

- PeriodRandom - 周期随机，启动时使Period 随机增加减少，使不同对象表现不同

- PeriodOffset- 周期偏移，运行前使得函数图像位置发生偏移，可以做出队列依次运动的结果

- PeriodOffsetRandom - 周期偏移随机值，使周期偏移值 随机增加或者减少

- Magnitude - 波动数值范围，选择了以何种属性进行sine周期运动，Magnitude就是改变的值的范围

- MagnitudeRandom - 波动数值范围随机，使得波动值随机增加或者减少

### 用法

- 编辑器用法: 中直接挂在需要 sine 运动的节点上，改变不同的参数，会进行对应的运动。

- 自定义属性用法: Movement  选择 value模式后，可以通过以下方式获取sine运行的值

  ```typescript
  let value = this.node.getComponent(BhvSine).value;
  this.node.opacity = value * 50 + 150; //透明度以sine 函数变化
  ```

  