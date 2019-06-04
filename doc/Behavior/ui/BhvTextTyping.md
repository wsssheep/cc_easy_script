Bhv Text Typing

### 介绍 

文本打字机功能。可以自己拓展。暂不支持富文本，只支持普通label组件

### 更新

- 0.1.0 - 基本打字的功能实现
- 0.2.0 - todo 富文本打字功能
- 0.3.0 - todo 支持打字转义符号 

### 编辑器

- todo

### 用法

- run(text, time,startIndex)

  ```typescript
  let textTyping =  this.node.getComponent(BhvTextTyping);
  textTyping.run('需要打字的文本',0.1);
  textTyping.run('文本打字文本打字文本打字',0.1,3);//startIndex，从第3个字符开始打字跳过前面的
  ```

  