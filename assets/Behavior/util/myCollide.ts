//
//思路: 
//1.先调整矩形碰撞完善，
//2. 再调整 圆和矩形碰撞 完善
//3. 再调整 圆圆碰撞完善
//4. 再调整 旋转矩形 和 旋转矩形 碰撞完善
//5. 再调整 旋转矩形 和 圆 碰撞完善

//不要管多边形碰撞，只去管好你的矩形/圆 之间的 碰撞即可
export default class UtilCollide {

    /**将两个节点推开.. */
    pushOut(other:any,self:any,dist:number = 100){
        //获取碰撞前 的 AABB 和圆半径
        let otherAabb:cc.Rect = other.world.aabb;
        let otherPreAabb:cc.Rect = other.world.preAabb.clone();
        let otherRadius:number = other.world.radius;
        //let otherOffset:cc.Vec2 = other.offset;
        
        let selfAabb:cc.Rect = self.world.aabb;
        let selfPreAabb:cc.Rect = self.world.preAabb.clone();
        let selfRadius:number = other.world.radius;
      


        /**最大push out 距离，超过后就无法push */
        let max_dist:number = dist;
		let oldX:number = selfPreAabb.x
		let oldY:number = selfPreAabb.y;
		let dir:number = 0;
		let dx:number = 0, dy:number = 0;
	
		while (dist <= max_dist)
		{
			switch (dir) {
			case 0:		dx = 0; dy = 1; dist++; break;
			case 1:		dx = 1; dy = 1; break;
			case 2:		dx = 1; dy = 0; break;
			case 3:		dx = 1; dy = -1; break;
			case 4:		dx = 0; dy = -1; break;
			case 5:		dx = -1; dy = -1; break;
			case 6:		dx = -1; dy = 0; break;
			case 7:		dx = -1; dy = 1; break;
			}
			dir = (dir + 1) % 8;
			selfPreAabb.x = Math.floor(oldX + (dx * dist));
            selfPreAabb.y = Math.floor(oldY + (dy * dist));
            
            //正常矩形求解
            if(!cc.Intersection.rectRect(selfPreAabb, otherPreAabb)){
                return true;
            }
		}
    }

    /**检查碰撞 组件的类型*/
    checkType(collider:cc.Collider){
        
    }

    /**两个矩形发生碰撞的处理 */
    rectRect(){

    }

    /**矩形 和 圆碰撞的结果 */
    rectCircle(){

    }

    /**圆和圆 碰撞的结果 */
    circleCircle(){

    }

    /**旋转矩形之间的碰撞 */
    rectRectRotate(){

    }

    /**旋转矩形 和 圆 之间的碰撞*/
    rectCircleRotate(){

    }





}
