

/**
 * 棋盘 Grid接口
 */
export interface IBoardGrid {

    cellWidth:number;
    cellHeight:number;
    setDirectionMode?();
    allDirections:number[];
    halfDirections:number[];
    saveOrigin();
    restoreOrigin();
    getNeighborTileXY(tileX:number, tileY:number, dir:number);
    getNeighborTileDirection(srcTileXY:cc.Vec2, neighborTileXY:cc.Vec2);
    getOppositeDirection(tileX, tileY, direction);
    offset();
    rotate();
    getDistance();
    directionBetween(tileA:cc.Vec2, tileB:cc.Vec2);
    directionNormalize(direction);
    getGridPoints(tileX:number, tileY:number, points:any);
    ringToTileXYArray();
    getWorldXY(tileX:number, tileY:number, out);
    getTileXY(worldX:number, worldY:number, out);

}

/**
 * 棋盘Board 接口
 */
export interface IBoard {
    getChessData()
    getChessUID()

    setBoardWidth()
    setBoardHeight()


    tileXYToWorldXY()
    worldXYToTileXY()

    worldXYSnapToGrid()
    angleBetween()
    angleToward()
    isOverlappingPoint()
    gridAlign()
    lineToTileXYArray()

    uidToChess()
    addChess()
    removeChess()
    removeAllChess()
    swapChess()
    moveChess()
    getAllChess()

    contains()
    forEachTileXY()
    getWrapTileX()
    getWrapTileY()
    tileXYZToChess()
    tileXYToChessArray()
    tileZToChessArray()
    tileXYArrayToChess()
    chessToTileXYZ()
    offset()
    rotate()
    getOppositeDirection()
    getDistance()
    directionBetween()
    fit()

    getEmptyTileXYArray()
    getRandomEmptyTileXY()
    getNeighborTileXY()
    getNeighborChess()
    getNeighborTileDirection()
    getNeighborChessDirection()
    areNeighbors()

    ringToTileXYArray()

    hasBlocker()
    hasEdgeBlocker()

    setInteractive()

    getGridPoints()
}