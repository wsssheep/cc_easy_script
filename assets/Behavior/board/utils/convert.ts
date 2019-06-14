import { ORIENTATION_TYPE } from "../Quad";

/**
 *  用于棋盘转换的函数
 */


const OrthogonalMap = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1]
];
const IsometricMap = OrthogonalMap;
const StaggeredMap = [
    [
        [0, 1],
        [-1, 1],
        [-1, -1],
        [0, -1],
        [0, 2],
        [-1, 0],
        [0, -2],
        [1, 0]
    ],
    [
        [1, 1],
        [0, 1],
        [0, -1],
        [1, -1],
        [0, 2],
        [-1, 0],
        [0, -2],
        [1, 0]
    ]
];

//反转地图方向
var ReverseDirMap = function (dirMap) {
    var out = {},
        entry, x, y;
    for (var dir in dirMap) {
        entry = dirMap[dir]; // [x, y]
        x = entry[0];
        y = entry[1];
        if (!out.hasOwnProperty(x)) {
            out[x] = {}
        }
        out[x][y] = parseInt(dir);
    }
    return out;
}

const OrthogonalMapOut = ReverseDirMap(OrthogonalMap);
const IsometricMapOut = OrthogonalMapOut;
const StaggeredMapOut = [
    ReverseDirMap(StaggeredMap[0]),
    ReverseDirMap(StaggeredMap[1])
];

/**
 * 确认当前瓦片到邻接瓦片的朝向
 * @param mode 
 * @param srcTileXY 
 * @param neighborTileXY 
 */
export function neighborTileDirection(mode:ORIENTATION_TYPE,srcTileXY:cc.Vec2, neighborTileXY:cc.Vec2):number {
    var deltaTileXYToDirMap
    switch (this.mode) {
        case 0: // orthogonal
            deltaTileXYToDirMap = OrthogonalMapOut;
            break;
        case 1: // isometric
            deltaTileXYToDirMap = IsometricMapOut;
            break;
        case 2: // staggered
            deltaTileXYToDirMap = StaggeredMapOut[srcTileXY.y & 1];//todo 可能有问题
            break;
    }

    var deltaTileX = neighborTileXY.x - srcTileXY.x;
    var deltaTileY = neighborTileXY.y - srcTileXY.y;    
    if (deltaTileXYToDirMap.hasOwnProperty(deltaTileX)) {
        var xEntry = deltaTileXYToDirMap[deltaTileX]
        if (xEntry.hasOwnProperty(deltaTileY)) {
            return xEntry[deltaTileY];
        }
    }
    return null;
}


/**
 * 获取对应棋子坐标
 * @param mode - 棋盘模式
 * @param titleXY - 棋盘坐标
 * @param dir - 邻接方向
 */
export function neighbor2DeltaTileXY(mode:ORIENTATION_TYPE,titleXY:cc.Vec2,dir:number):cc.Vec2 {
    switch (mode) {
        case 0: // orthogonal
        titleXY.x += OrthogonalMap[dir][0];
        titleXY.y += OrthogonalMap[dir][1];
            break;
        case 1: // isometric
        titleXY.x += IsometricMap[dir][0];
        titleXY.y += IsometricMap[dir][1];
            break;
        case 2: // staggered
        titleXY.x += StaggeredMap[titleXY.y & 1][dir][0];
        titleXY.y += StaggeredMap[titleXY.y & 1][dir][0];
            break;
    }
    return titleXY;
}


/**
 * 棋盘方向方向取反
 * @param tileX 
 * @param tileY 
 * @param direction 
 */
export function oppositeDirection(tileX, tileY, direction){
    const oppositeDirectionMap = {
        0: 2, // Left
        1: 3, // Down
        2: 0, // Right
        3: 1, // Up
        4: 6, // Left-down
        5: 7, // Down-right
        6: 4, // Right-up
        7: 5 // Up-left
    }
    return oppositeDirectionMap[direction];
}

