import { IBoard, IBoardGrid } from './utils/interface';
import BoardData from "./BoardData";
import QuadGrid from "./quad/QuadGrid";
import { HexagonGrid } from "./hexagon/HexagonGrid";
import BhvChess from './BhvChess';
import ChessBank from './ChessBank';


const {ccclass, property} = cc._decorator;


const Wrap = function (value, min, max)
{
    let range = max - min;
    return (min + ((((value - min) % range) + range) % range));
};

enum GRID_TYPE {
    QUAD,
    HEXAGON
}

@ccclass
export default class Board extends cc.Component{

    boardData:BoardData = new  BoardData();

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    /**棋子库存 */
    bank:ChessBank;

    /**棋盘布局 */
    grid:IBoardGrid;
    
    /**棋盘类型 */
    gridType:GRID_TYPE;
    
    /** 循环模式 */
    wrapMode:boolean = false;

    /** 无限模式 */
    infinityMode:boolean = false;

    /**棋盘宽度 */
    width:number =0;

    /**棋盘高度 */
    height:number = 0;

    private globWorldXY =cc.v2();
    private globTileXY = cc.v2();

    initGrid(grid) {
     
        let config = grid;
        let gridType = config.gridType||0;
        if(gridType==0){
            this.grid = new QuadGrid({}); //todo 直角棋盘
        }else{
            this.grid = new HexagonGrid({}); //todo 斜角棋盘
        }

        this.bank = new ChessBank();

    }

    setBoardSize(width, height) {
        this.setBoardWidth(width);
        this.setBoardHeight(height);
    }

    exists(gameObject) {
        // game object or uid
        return this.boardData.exists(this.getChessUID(gameObject));
    }

    get chessCount() {
        return this.boardData.chessCount;
    }

    //获取棋子组件(数据)
    getChessData(node:cc.Node){
        let comp = node.getComponentInChildren(BhvChess);
           if(comp==null){
            comp =  node.addComponent(BhvChess);
           }
         return comp;
    }

    //获取棋子UID (通过组件获取)
    getChessUID(node:cc.Node){
        let comp = node.getComponentInChildren(BhvChess);
        return comp?comp.uid:null;
    }


    setBoardWidth(width:number){
        if (this.infinityMode)return;
        if ((this.width === undefined) || (this.width <= width)) {
            this.width = width;
            return this;
        }
    
        // this.width > width : collapse
        let tileX, tileY, tileZ, tileZToUIDs;
        for (tileX = width; tileX < this.width; tileX++) {
            for (tileY = 0; tileY < this.height; tileY++) {
                tileZToUIDs = this.boardData.getUID(tileX, tileY);
                for (tileZ in tileZToUIDs) {
                    this.removeChess(null, tileX, tileY, tileZ);
                }
            }
        }
    
        this.width = width;
    }

    setBoardHeight(height:number){
        if ((this.height === undefined) || (this.height <= height)) {
            this.height = height;
            return this;
        }
    
        // this.height > height : collapse
        let tileX, tileY, tileZ, tileZToUIDs;
        for (tileY = height; tileY < this.height; tileY++) {
            for (tileX = 0; tileX < this.width; tileX++) {
                tileZToUIDs = this.boardData.getUID(tileX, tileY);
                for (tileZ in tileZToUIDs) {
                    this.removeChess(null, tileX, tileY, tileZ);
                }
            }
        }
    
        this.height = height;
    }

    ///////////////////////////////////////////////////////////////////////////
    //////*   基本属性
    ///////////////////////////////////////////////////////////////////////////

    //坐标转换
    tileXYToWorldXY(tileX:number, tileY:number, out?:any){
        return this.grid.getWorldXY(tileX, tileY, out);
    }

    worldXYToTileXY(worldX:number, worldY:number, out?:any){
        return this.grid.getTileXY(worldX, worldY, out);
    }

    worldXYSnapToGrid(worldX, worldY, out){
        if (out === undefined) {
            out = cc.v2();
        } else if (out === true) {
            out = this.globWorldXY;
        }
    
        this.worldXYToTileXY(worldX, worldY, out);
        this.tileXYToWorldXY(out.x, out.y, out);
        return out;
    }

    angleBetween(tileA:cc.Vec2, tileB:cc.Vec2){
        let out = this.tileXYToWorldXY(tileA.x, tileA.y, true);
        let x0 = out.x;
        let y0 = out.y;
        out = this.tileXYToWorldXY(tileB.x, tileB.y, true);
        let x1 = out.x;
        let y1 = out.y;
        return  Math.atan2(y1-y0,x1-x0); // -PI
    }

    angleToward(tileXY:cc.Vec2, direction){
        // Save wrapMode, infinityMode and clear them
        let wrapModeSave = this.wrapMode;
        let infinityModeSave = this.infinityMode;
        this.wrapMode = false;
        this.infinityMode = true;

        // Get neighborTileXY
        let neighborTileXY = this.getNeighborTileXY(tileXY, direction, true);

        // Restore wrapMode, infinityMode and clear them
        this.wrapMode = wrapModeSave;
        this.infinityMode = infinityModeSave;
        return this.angleBetween(tileXY, neighborTileXY);
    }

    isOverlappingPoint(worldX:number, worldY:number, tileZ:number){
        if (this.infinityMode && (tileZ === undefined)) {
            return true;
        }
    
        let out = this.worldXYToTileXY(worldX, worldY, true);
        return this.contains(out.x, out.y, tileZ);
    }

    gridAlign(node, tileX?, tileY?){

        if (node === undefined) {
            let chess = this.getAllChess();
            for (let i = 0, cnt = chess.length; i < cnt; i++) {
                this.gridAlign(chess[i]);
            }
        } else {
            let comp = node.getComponentInChildren(BhvChess);
            if (typeof(node) === "string" || typeof(node)=== "number") {
                comp = this.uidToChess(node);
            }
            if (tileX === undefined) {
                let tileXYZ:cc.Vec3 = this.chessToTileXYZ(node);
                tileX = tileXYZ.x;
                tileY = tileXYZ.y;
            }
    
            this.tileXYToWorldXY(tileX, tileY, comp);
        }

    }

    //使用两点间的直线来匹配棋盘上的棋子
    lineToTileXYArray(startPos:cc.Vec2, endPos:cc.Vec2, out?:cc.Vec2[]){
        if (out === undefined) {
            out = [];
        }

        const Linear = (p0,p1,t)=>{(p1 - p0) * t + p0;};
    
        let totalDistance = startPos.sub(endPos).mag();
        let gridSize = Math.min(this.grid.cellWidth, this.grid.cellHeight);
        let quantity = Math.ceil(totalDistance / (gridSize / 4)),
            t;
        let worldX, worldY;
        let preTileXY:cc.Vec2, tileXY:cc.Vec2;
        for (let i = 0; i <= quantity; i++) {
            t = i / quantity;
            worldX = Linear(startPos.x, endPos.x, t);  
            worldY = Linear(startPos.y, endPos.y, t);
            tileXY = this.worldXYToTileXY(worldX, worldY);
            if (!this.contains(tileXY.x, tileXY.y)) {
                continue;
            }

            if (preTileXY &&  preTileXY.equals(tileXY)) {
                continue;
            }
    
            out.push(tileXY);
            preTileXY = tileXY;
        }
        return out;
    }

    ///////////////////////////////////////////////////////////////////////////
    //////*   棋子管理
    ///////////////////////////////////////////////////////////////////////////


    uidToChess(uid:number|string):cc.Node{
        if (uid == null) {
            return null;
        } else {
            // single uid
            if (!this.boardData.exists(uid)) {
                return null;
            }
            return this.bank.get(uid);
        }
    }

    /** 添加棋子到某个位置 (可以选择是否对齐棋盘) */
    addChess(node:cc.Node, tileX:number, tileY:number, tileZ?:number, align:boolean = true){
        if (!this.contains(tileX, tileY))return;
    
        let curTileXYZ = this.chessToTileXYZ(node);
        if (tileZ === null) {
            if (curTileXYZ) {
                tileZ = curTileXYZ.z;
            } else {
                tileZ = 0;
            }
        }

        if (curTileXYZ &&(curTileXYZ.x === tileX) && (curTileXYZ.y === tileY) && (curTileXYZ.z === tileZ)) {
            // Move to current position
            return;
        }

        let occupiedChess = this.tileXYZToChess(tileX, tileY, tileZ);
        if (occupiedChess) {
            this.node.emit('board-kick-out', node, occupiedChess, curTileXYZ);
            // 发送消息通知处理
        }
    
        this.removeChess(node);

        if (occupiedChess) {
            this.removeChess(occupiedChess, tileX, tileY, tileZ);
        }
        this.boardData.addUID(this.getChessUID(node), tileX, tileY, tileZ);
        this.getChessData(node).setBoard(this);
    
        if (align) {
            this.gridAlign(node, tileX, tileY);
        }

    }

    /** 移除棋子，可以按node 移除，也可以按棋盘位置移除 */
    removeChess(node?:cc.Node, tileX:number =0, tileY:number =0, tileZ:number = 0, destroy:boolean = false, fromBoardRemove:boolean = false):cc.Node{
        if (node) {
            let tileXYZ = this.chessToTileXYZ(node);
            if (tileXYZ) {
                tileX = tileXYZ.x;
                tileY = tileXYZ.y;
                tileZ = tileXYZ.z;
            } else {
                // chess is not in this board
                return;
            }
        } else {
            node = this.tileXYZToChess(tileX, tileY, tileZ);
             // chess is not in this board
            if (!node)return;
        }
    
        if (!fromBoardRemove) {
            this.boardData.removeUID(tileX, tileY, tileZ);
        }
        this.getChessData(node).setBoard(null);
    
        if (destroy) {
            node.destroy();
            return null;
        }else{
            return node;
        }
    
    }

    /** 移除所有棋子 */
    removeAllChess(destroy:boolean = false, fromBoardRemove:boolean = false){
        let chess = this.getAllChess();
        for (let i = 0, cnt = chess.length; i < cnt; i++) {
            this.removeChess(chess[i], null, null, null, destroy, fromBoardRemove);
        }
    }

    /** 交换棋子 */
    swapChess(nodeA:cc.Node, nodeB:cc.Node, align:boolean = true){  
        let tileXYZA = this.chessToTileXYZ(nodeA);
        let tileXYZB = this.chessToTileXYZ(nodeB);
        if ((tileXYZA == null) || (tileXYZB == null))return;
        this.removeChess(nodeA);
        this.removeChess(nodeB);
        this.addChess(nodeA, tileXYZB.x, tileXYZB.y, tileXYZB.z, align);
        this.addChess(nodeB, tileXYZA.x, tileXYZA.y, tileXYZA.z, align);
    }

    /** 移动棋子 */
    moveChess(node:cc.Node, tileX:number, tileY:number, tileZ?:number, align:boolean = true){
        this.addChess(node,tileX,tileY,tileZ,align);
    }

    /**查询所有棋子 */
    getAllChess(out:cc.Node[] = []):cc.Node[]{
        let uids = this.boardData.UIDToXYZ;
        for (let uid in uids) {
            out.push(this.uidToChess(uid));
        }
        return out;
    }


    ///////////////////////////////////////////////////////////////////////////
    //////*   坐标转换
    ///////////////////////////////////////////////////////////////////////////

    /**包含在棋盘范围内吗? */
    contains(tileX:number, tileY:number, tileZ?:number){
        let result;
        if (this.infinityMode) {
            result = true;
        } else {
            result = (tileX >= 0) && (tileX < this.width) && (tileY >= 0) && (tileY < this.height);
        }

        if (result && (tileZ !== null&& tileZ !== undefined)) {
            result = this.boardData.contains(tileX, tileY, tileZ);
        }

        return result;
    }

    /**
     * 遍历棋盘内的每一个瓦片
     * @param callback 
     * @param order - 0-(-x+,y+)  1-( x-,y+) 2-( y+,x+)
     */
    forEachTileXY(callback:(tile:cc.Vec2,BOARD:Board)=>void, order:number = 0){
        switch (order) {
            case 0: // x+,y+
                for (let tileY = 0; tileY < this.height; tileY++) {
                    for (let tileX = 0; tileX < this.width; tileX++) {
                        this.globTileXY.x = tileX;
                        this.globTileXY.y = tileY;
                         callback(this.globTileXY, this);
                    }
                }
                break;
            case 1: // x-,y+
                for (let tileY = 0; tileY < this.height; tileY++) {
                    for (let tileX = this.width - 1; tileX >= 0; tileX--) {
                        this.globTileXY.x = tileX;
                        this.globTileXY.y = tileY;
                        callback(this.globTileXY, this);
                    }
                }
                break;
            case 2: // y+,x+
                for (let tileX = 0; tileX < this.width; tileX++) {
                    for (let tileY = 0; tileY < this.height; tileY++) {
                        this.globTileXY.x = tileX;
                        this.globTileXY.y = tileY;
                        callback(this.globTileXY, this);
                    }
                }
                break;
            case 3: // y-,x+
                for (let tileX = 0; tileX < this.width; tileX++) {
                    for (let tileY = this.height - 1; tileY >= 0; tileY--) {
                        this.globTileXY.x = tileX;
                        this.globTileXY.y = tileY;
                        callback(this.globTileXY, this);
                    }
                }
        }
    }

    /**
     * 得到 wrap 后的 tile x 坐标
     * @param tileX 
     */
    getWrapTileX(tileX):number{
        if (this.wrapMode) {
            tileX = Wrap(tileX, 0, this.width);
        } else if ((!this.infinityMode) && ((tileX < 0) || (tileX >= this.width))) {
            tileX = null;
        }
        return tileX;
    }

    /**
     * 得到wrap 后 的 title y 坐标
     * @param tileY 
     */
    getWrapTileY(tileY):number{
        if (this.wrapMode) {
            tileY = Wrap(tileY, 0, this.height);
        } else if ((!this.infinityMode) &&
            ((tileY < 0) || (tileY >= this.height))) {
            tileY = null;
        }
        return tileY;
    }

    /** 找到对应棋盘 XYZ 的 节点*/
    tileXYZToChess(tileX:number, tileY:number, tileZ:number):cc.Node{
        let uid = this.boardData.getUID(tileX, tileY, tileZ);
        return this.uidToChess(uid);
    }

    /** 找到对应棋盘XY 的所有节点(Z层不同) */
    tileXYToChessArray(tileX:number, tileY:number, out:cc.Node[] =[]):cc.Node[]{
        let tileZToUIDs = this.boardData.getUID(tileX, tileY);
        if (tileZToUIDs == null) {
            return out;
        }
    
        for (let tileZ in tileZToUIDs) {
            out.push(this.uidToChess(tileZToUIDs[tileZ]));
        }
        return out;
    }

    /** 找到一个 Z 层级的所有棋子 */
    tileZToChessArray(tileXYArray, tileZ, out:cc.Node[] = []):cc.Node[]{
        if (Array.isArray(tileZ)) {
            out = tileZ;
            tileZ = undefined;
        }
        if (out === undefined) {
            out = [];
        }
        var tileZMode = (tileZ != null);
        var tileXY;
        for (var i = 0, cnt = tileXYArray.length; i < cnt; i++) {
            tileXY = tileXYArray[i];
            if (tileZMode) {
                out.push(this.tileXYZToChess(tileXY.x, tileXY.y, tileZ));
            } else {
                this.tileXYToChessArray(tileXY.x, tileXY.y, out);
            }
        }
        return out;
    }

    tileXYArrayToChess(){

    }


    chessToTileXYZ(node):cc.Vec3{
        return new cc.Vec3();
    }

    offset(){

    }

    rotate(){

    }

    getOppositeDirection(){

    }

    getDistance(){

    }

    directionBetween(){

    }

    fit(){

    }


    ///////////////////////////////////////////////////////////////////////////
    //////*    图块获取
    ///////////////////////////////////////////////////////////////////////////
    getEmptyTileXYArray(){

    }
    getRandomEmptyTileXY(){

    }

    getNeighborTileXY():cc.Vec2{
        return cc.v2();
    }

    getNeighborChess(){

    }

    getNeighborTileDirection(){

    }

    getNeighborChessDirection(){

    }

    areNeighbors(){

    }

    ringToTileXYArray(){

    }

    hasBlocker(){

    }

    hasEdgeBlocker(){

    }

    setInteractive(){

    }

    getGridPoints(){

    }


    
}
