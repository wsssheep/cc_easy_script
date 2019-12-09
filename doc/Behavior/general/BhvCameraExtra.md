Bhv Camera Extra

### 介绍 

可以拓展cc 相机的基本能力,额外实现相机移动跟随、dead zone、屏幕闪烁、震动、缩放、旋转 功能

### 更新

- 0.1 基本功能实现

### 编辑器

- Debug: 绘制摄像机的位置信息
- Target: 设置摄像机跟随的目标节点
- Follow Type: 跟随的类型,不同跟随类型的 dead zone 不同 dead zone的区域指镜头不会跟随范围。打开debug绘图就可以得知当前的 dead zone区域大小
- ENABLE_ROTATE 是否激活相机的旋转功能, 官方未支持，使用方式为旋转
- Rotate Nodes: [ENABLE_ROTATE]激活后出现，控制需要旋转的节点，进行旋转，通常是游戏图层。尽量保持较少节点旋转，否则特别消耗性能
- ENABLE_FX: 是否激活相机的特效（震动、闪烁）
- Round Px: 保证相机运动的坐标点为整数 像素

### 用法

- 相机移动

  ```typescript
  let camera = this.node.getComponent('BhvCameraExtra');
  camera.x = 15;
  camera.y = 20;
  ```

- 相机跟随

  ```typescript
  //跟随一个对象 
  camera.follow(target,style,lerpX,lerpY);
  //停止跟随对象
  camera.unFollow();
  ```

- 相机聚焦

  ```typescript
  //摄像机焦点移动到某节点上
  camera.focusOn();
  //立即将相机聚焦到某个位置上
  camera.focusOnXY(pos);
  //相机摇晃
  camera.shake(0.05,0.5,true,0,true);
  //相机闪烁
  camera.flash(cc.color(255, 255, 255), 0.5,false,255);
  ```

- 相机摇晃 和闪烁

  ```typescript
  //相机摇晃
  camera.shake(0.05,0.5);//强度，时间
  camera.shake(0.05,0.5,true,0,true);
  //相机闪烁
  camera.flash(cc.color(255, 255, 255), 0.5);//颜色,时间
  camera.flash(cc.color(255, 255, 255), 0.5,false,255);
  ```

- 自由运镜, 自由控制相机变化，可以实现复杂的镜头操作

  支持属性: 移动位置、颜色变化、镜头缩放、镜头旋转(需要挂载旋转layer)、不透明度

  ```typescript
  //使用 cc.Action 动作系统，直接操作相机进行你希望的移动
  let action = new cc.Action(anyAction);
  camera.run(action)
  ```

  

