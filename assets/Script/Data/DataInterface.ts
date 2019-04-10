


//只存在数据信息的接口
//接口文件，请在该文件夹写入游戏数据接口 



//////////////////////////////////////////////////////////////////////////////////////////
//NOTE:基础数据 (配置数据)
//////////////////////////////////////////////////////////////////////////////////////////

/**车辆属性接口 */
export interface BaseCar {

    /**车辆Id, 识别用 */
    id: number;

    /**车辆信息 */
    info: string;

    /**车辆名字 */
    name: string;

    /** 原始价格 */
    price: number;

    /**购买价格的类型: 钻石 - diamond  / 金币 - gold  */
    priceType: 'diamond'|'gold';

    /**车辆加速力,加到最大速度的恢复时间*/
    accel: number;

    /**车辆减速力,倒车速度(未使用) */
    decel: number;

    /**[速度 属性] 车辆极限速度*/
    speed: number;

    /**[车身 属性] 撞击防御力，越大能抗住的撞击伤害越多*/
    defense: number;

    /**[轮胎 属性] 车轮属性, 车轮的耐久, 越大能驾驶过更难走的路面*/
    wheels: number;

    /**[转弯 属性] 转向速度, 越大转向越灵活*/
    steer: number;

    /**漂移恢复速度, 影响漂移转向恢复速度，越少越飘 */
    driftRecover: number;

    /**摩擦力, 影响车辆抓地力 */
    friction: number;

    /** 待定? 车辆最大经验值 */
    maxExp?: number;

}

/**
 * 关卡基本数据
 */
export interface BaseLevel {
    /**关卡的序号 */
    level: number;
    /** 关卡所属主题 */
    theme:number;
    star: number;
    /**[星级条件]漂移次数限制 */
    steer:number;
    /**[星级条件]受伤次数限制 */
    hurt:number;
    timer: LevelReward;
    collect: LevelReward;
    rank: LevelReward;
}

/**
 * 基础主题数据
 */
export interface BaseTheme {
    id:      number;
    name:    string;
    info:    string;
    viewers: number;
    revenue: number;
    levels?: BaseLevel;
}

/**
 * 基础商店内容
 */
export interface BaseCarShop{
    /** 货物ID */id:        number;
    /** 车辆ID */carId:     number;
    /** 货币数量 */price:     number;
    /** 货币类型 */priceType: 'gold'|'diamond';
}

interface LevelReward {
    need: number;
    reward: number;
    type: "gold"|"diamond";
}

/**
 * 基础车辆贴纸数据
 */
export interface BaseCarSticker {
    /**序号 */
    id:         number;
    /**贴纸功能信息 */
    info:       string;
    /** 价格 */
    price:      number;
    /**价格类型 */
    priceType:  "gold"|"diamond";
    /**特效值 */
    effect:     number;
    /** 特效增幅类型 (未定义) */
    effectType: string;
    
}


//////////////////////////////////////////////////////////////////////////////////////////
//NOTE:存档数据
//////////////////////////////////////////////////////////////////////////////////////////

/** 保存礼物盒子 */
export interface SaveGiftItem {
    id:number;
    type:'car'|'item';
    count:number;
}

/**一个小关卡数据的记录 */
export interface SaveLevel {
    /**关卡的序号 */
    level: number;
    
    /** 关卡所属主题 */
    theme:number;

    /** 关卡评级 SS=6\S=5\A=4\B=3\C=2\D=1\E=0  */
    rank?: number;

    /** 关卡完成度 0 ~ 1 ,100% 即为通关 */
    complete?: number;

    /**关卡最好时间,单位秒 */
    bestTimes?: number;

}

/** 一辆持有车辆的数据 */
export interface SaveCar {
    /**车辆ID */
    id: BaseCar['id'],
    /**剩余车身防御值 的百分比 0~1 */
    defense: BaseCar['defense'],
    /**剩余轮胎耐久 的百分比 0~1*/
    wheels: BaseCar['wheels'],
    /**车辆喷漆涂装 ID */
    sticker: number,
    /** 车辆积累的exp 值 */
    exp?: BaseCar['maxExp']

}

/** 游戏进行记录的信息  */
export interface GamePlayInfo {
    /** 比赛模式 0-练习，1-杯赛 */
    mode:0|1;
    
    /** 比赛进行的时间 */
    timer: number;

    /**比赛最短时间(之前的记录) */
    timerMin: number;

    /**捡到的星星 */
    star?: number;

    /**最大星星数 */
    starMax?: number;

    /**比赛进度完成百分比 */
    percent: 0;

    /**连续漂移次数 */
    steerCount: number;

    /**驾驶事故 [受到伤害次数],轮胎撞击才算 */
    hurtCount: number;

    /**当前的比赛名次(动态)*/
    rank?: number;

    /**赛道的主题ID*/
    theme?: number;

    /**当前赛道的关卡ID */
    level?: number;

    /**入场观众数量 */
    viewerCount?: number;

    /**门票收入 (公式 入场观众数量 * 当前门票单价)*/
    ticketReward?: number;

    /**观众打赏金额 */
    viewerReward?: number;

}

//////////////////////////////////////////////////////////////////////////////////////////
//NOTE:交换数据
//////////////////////////////////////////////////////////////////////////////////////////

/**表演赛 获得结果 */
export interface GameResult {

    /**本次比赛时间 */
    currentTimes: number;

    /** 最佳时间 */
    bestTimes: number;

    /**连续漂移次数 */
    steerCount: number;

    /**驾驶事故 [受到伤害次数] */
    hurtCount: number;

    /**入场观众数量 */
    viewerCount: number;

    /**观众打赏金额 */
    viewerReward: number;

    /**门票收入 (公式 入场观众数量 * 当前门票单价)*/
    ticketReward: number;

    /**本次比赛的收入总额 */
    allReward: number;


}

/**杯赛基本数据 */
export interface GameCupResult {
    /**杯赛排名 */
    rank: 1,

    /**本次比赛时间 */
    currentTimes: number;

    /**连续漂移次数 */
    steerCount: number;

    /**驾驶事故 [受到伤害次数] */
    hurtCount: number;

    /**本次比赛获得的奖金 */
    reward: number;

}


/**一条数据比赛数据 */
export interface BaseGameCupRace {

    /** 查询ID */
    id:number,
    /**杯赛名称 */
    name: string

    /** 比赛状态,-1-倒计时，0-可以开始 1-比赛结束*/
    state?:-1|0|1;

    /**赛道主题 */
    theme: string

    /**难度等级 0- 简单 1- 中级 2-高级 3 -大师 */
    level: number

    /**竞争对手数量 */
    competitorCount: number

    /**奖励,三个等级的奖励,由低到高, 季军，亚军，冠军*/
    award: [number, number, number]

    /**入场需要的条件 */
    cost: number

    /**比赛跳转的地图(旧)*/
    map: string;

}


/**道路属性接口 */
export interface BaseRoad {
    /**道路阶段起始百分比  (用于计算名次 和 统计比赛进度) */
    startPercent: 0,

    /**道路阶段结束百分比 (用于计算名次 和 统计比赛进度) */
    endPercent: 0.15,


}




