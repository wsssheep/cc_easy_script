
/**
 *  用于棋盘转换的函数
 */


export const OrthogonalMap = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1]
];
export const IsometricMap = OrthogonalMap;
export const StaggeredMap = [
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
const ReverseDirMap = function (dirMap) {
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

export const OrthogonalMapOut = ReverseDirMap(OrthogonalMap);
export const IsometricMapOut = OrthogonalMapOut;
export const StaggeredMapOut = [
    ReverseDirMap(StaggeredMap[0]),
    ReverseDirMap(StaggeredMap[1])
];

/**
 * 棋盘的方向
 */
export enum BOARD_DIRECTION {
    LEFT,
    DOWN,
    RIGHT,
    UP,
    LEFT_DOWN,
    DOWN_RIGHT,
    Right_UP,
    UP_LEFT
}


export enum ORIENTATION_TYPE {
    /**正交类型 */
    ORTHOGONAL,
    /**斜角类型 */
    ISOMETRIC,
    /**交错类型 */
    STAGGERED
};