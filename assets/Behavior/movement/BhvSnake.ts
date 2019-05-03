

const {ccclass, property} = cc._decorator;

/**
 * 贪吃蛇行为，也可以作为2d游戏序列
 */
@ccclass
export default class BhvSnake extends cc.Component {

    numSegments = 10;
    direction = 'right';
    diff   = 10;
    xStart = 0;
    yStart = 160;
    xCor = [];
    yCor = [];


    start () {
        for (let i = 0; i < this.numSegments; i++) {
          this.xCor.push(this.xStart + i * this.diff);
          this.yCor.push(this.yStart);
        }
    }

    line(x1,y1,x2,y2){

    }

    updateSnakeCoordinates() {
        for (let i = 0; i < this.numSegments - 1; i++) {
          this.xCor[i] = this.xCor[i + 1];
          this.yCor[i] = this.yCor[i + 1];
        }
        switch (this.direction) {
          case 'right':
            this.xCor[this.numSegments - 1] = this.xCor[this.numSegments - 2] + this.diff;
            this.yCor[this.numSegments - 1] = this.yCor[this.numSegments - 2];
            break;
          case 'up':
            this.xCor[this.numSegments - 1] = this.xCor[this.numSegments - 2];
            this.yCor[this.numSegments - 1] = this.yCor[this.numSegments - 2] - this.diff;
            break;
          case 'left':
            this.xCor[this.numSegments - 1] = this.xCor[this.numSegments - 2] - this.diff;
            this.yCor[this.numSegments - 1] = this.yCor[this.numSegments - 2];
            break;
          case 'down':
            this.xCor[this.numSegments - 1] = this.xCor[this.numSegments - 2];
            this.yCor[this.numSegments - 1] = this.yCor[this.numSegments - 2] + this.diff;
            break;
        }
      }

    /**
     * 快速检查自身碰撞（不使用游戏引擎提供的碰撞
     */
    checkSnakeCollision() {
        const snakeHeadX = this.xCor[this.xCor.length - 1];
        const snakeHeadY = this.yCor[this.yCor.length - 1];
        for (let i = 0; i < this.xCor.length - 1; i++) {
        if (this.xCor[i] === snakeHeadX && this.yCor[i] === snakeHeadY) {
            return true;
        }
        }
    }
    
    /**
     * 按钮控制方向
     */
    keyPressed() {
        // switch (keyCode) {
        //     case 74:
        //     if (direction !== 'right') {
        //         direction = 'left';
        //     }
        //     break;
        //     case 76:
        //     if (direction !== 'left') {
        //         direction = 'right';
        //     }
        //     break;
        //     case 73:
        //     if (direction !== 'down') {
        //         direction = 'up';
        //     }
        //     break;
        //     case 75:
        //     if (direction !== 'up') {
        //         direction = 'down';
        //     }
        //     break;
        // }
    }

    
    update(dt) {
  
        for (let i = 0; i < this.numSegments - 1; i++) {
            this.line(this.xCor[i], this.yCor[i], this.xCor[i + 1], this.yCor[i + 1]);
        }
        this.updateSnakeCoordinates();

    }
}










