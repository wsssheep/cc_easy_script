
import Quad, { ORIENTATION_TYPE } from "./Quad";
import { initPoints, setPoints } from "../utils/points";

const ALL_DIR4 = [0, 1, 2, 3];
const ALL_DIR8 = [0, 1, 2, 3, 4, 5, 6, 7];
const HALF_DIR4 = [0, 1];
const HALF_DIR8 = [0, 1, 4, 5];



enum DIR_MODE {
    DIR4 =4,
    DIR8 =8
}

export default class QuadGrid extends Quad implements IBoardGrid {
    constructor(config){
        super(config);
    }

    directions:DIR_MODE = DIR_MODE.DIR4;

    // 获取邻接位置的所有可用方向
    get allDirections() {
        return (this.directions === 4) ? ALL_DIR4 : ALL_DIR8;
    }

    // 棋牌匹配
    get halfDirections() {
        return (this.directions === 4) ? HALF_DIR4 : HALF_DIR8;
    }

    private _savedOriginPos:cc.Vec2 = cc.v2();
    globPoints:cc.Vec2[] = initPoints(4);

    saveOrigin(){
        this._savedOriginPos.x= this.x;
        this._savedOriginPos.y = this.y;
    }

    restoreOrigin(){
        this.x = this._savedOriginPos.x;
        this.y = this._savedOriginPos.y;
    }

    getNeighborTileXY(tileX:number, tileY:number, dir:number){
    
    }
    
    getNeighborTileDirection(srcTileXY:cc.Vec2, neighborTileXY:cc.Vec2){

    }

    getOppositeDirection(tileX, tileY, direction){

    }

    offset(){

    }

    rotate(){

    }

    getDistance(){

    }

    directionBetween(tileA:cc.Vec2, tileB:cc.Vec2){
        var direction;
        switch (this.mode) {
            case 0: // orthogonal
            case 1: // isometric
                if (tileA.y === tileB.y) {
                    direction = (tileB.x >= tileA.x) ? 0 : 2;
                } else if (tileA.x === tileB.x) {
                    direction = (tileB.y >= tileA.y) ? 1 : 3;
                } else {
                    let angle = cc.misc.degreesToRadians(Math.atan2(tileB.y-tileA.y,tileB.x-tileA.x)); // -180~180
                    if (angle < 0) {
                        angle += 360;
                    }
                    direction = angle / 90;
                }
                break;
            case 2: // staggered
                // TODO
                break;
        }

        return direction;
    }

    directionNormalize(direction){
        let min = 0;
        let max =  this.directions;
        let value =  direction;
        let range = max - min;
        return (min + ((((value - min) % range) + range) % range)); //Wrap
    }

    getGridPoints(tileX:number, tileY:number, points:any){
        if (points === undefined) {
            points = initPoints(4);
        } else if (points === true) {
            points = this.globPoints;
        }
    
        if (tileX === undefined) {
            this.globWorldXY.x = 0;
            this.globWorldXY.y = 0;
        } else {
            this.getWorldXY(tileX, tileY, this.globWorldXY);
        }
        var quadType = (this.mode === 0) ? 0 : 1;
        setPoints(this.globWorldXY.x, this.globWorldXY.y, this.width, this.height, quadType, points);
        return points;
    }

    ringToTileXYArray(){

    }


}
