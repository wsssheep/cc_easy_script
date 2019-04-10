import { SaveCar, BaseLevel, BaseCar, BaseCarShop, BaseTheme, BaseGameCupRace, BaseCarSticker, SaveGiftItem, GamePlayInfo, SaveLevel } from './DataInterface';


//只能进行初始化的操作,不允许写入方法

/**
 * 全局存档数据 (需要存档的数据)
 */
export class UserSaveData {

    /**玩家当前持有的车,数组 */
    cars:Array<SaveCar>;

    /**通过的练习赛信息 */
    passLevels:Array<SaveLevel> = [];

    /**礼物盒子储存，多出放不下的礼物会存放在礼物盒子中 */
    giftBox:Array<SaveGiftItem>;
    
    /**停车位 */
    garageParkCount:number = 3;

    /**最后选择的车辆ID */
    lastSelectCarId:number = 0;

    /**最后选择的赛道关卡和模式(进入时改变) */
    lastSelectPlay = {
        level:0,
        theme:0,
        mode:0
    };

    /** 钻石数量, 商店购买车辆 或者 交易加速 等等 */
    diamond:number = 0 ;

    /** 金币，购买车辆 和 修理车辆 */
    gold:number = 1000;

    /** 记录完成成就的数组 */
    achievement:Array<number> = [0,1,2,3,4,5,6,7,8,9,10];

    /**开放展览时间 */
    openViewStamp = 0;

    /**在兑换金钱界面， */
    freeMoneyTimerStamp = 0;

    /** 每日礼物  */
    dailyGift = {
        /**当前签到 */
        current:0,
        /**签到时间戳 */
        stamp:0
    }

    /** 杯赛数据记录 */
    cupRace = {
        maxCount:5,
        /** 参加次数 */
        playCount:0,
        /** 胜利次数 (越多，越容易刷出困难的杯赛) */
        winCount:0,
        /** 数据列表 */
        list:[
            {id:1,stamp:0,state:-1},
            {id:2,stamp:0,state:0},
            {id:3,stamp:0,state:-1},
            {id:4,stamp:0,state:0},
            {id:5,stamp:0,state:-1},
        ]
    }

    /** 我获得的奖杯 */
    myCup = {
        /**金奖杯 */
        gold:0,
        /** 银奖杯 */
        sliver:0,
        /** 铜奖杯 */
        copper:0
    }

    /** 签到奖励 */
    signGift:{day:number,stamp:number,state:-1|0|1} = {
        /**时间 */
        day:0,
        /**领奖后的时间戳 */
        stamp:0,
        /**今天的签到状态:  0 = 未达成签到 1= 已签到 -1=错过签到时间 */
        state:0
    }

    constructor(){
        this.cars = [];

        let car0:SaveCar = {
            id:1,
            defense:1.0,
            wheels:1.0,
            sticker:0,
            exp:0
        }

        if(_.isEmpty(this.cars)){
            this.cars.push(car0);
        }
    }

}

/**
 * 全局游戏数据 (退出游戏就失效的内存数据)
 */
export class GlobalGameData {
    /**每次比赛记录的内容 */
    game:GamePlayInfo = {
        /** 比赛模式 */
        mode:0,
        /** 比赛进行的时间 */
        timer: 0,
        /**比赛最短时间(之前的记录) */
        timerMin: 0,
        /**捡到的星星 */
        star: 0,
        /**最大星星数 */
        starMax: 0,
        /**比赛进度完成百分比 */
        percent: 0,
        /**连续漂移次数 */
        steerCount: 0,
        /**驾驶事故 [受到伤害次数],轮胎撞击才算 */
        hurtCount: 0,
        /**当前的比赛名次(动态)*/
        rank: 0,
        /**赛道的主题ID*/
        theme: 0,
        /**当前赛道的关卡ID */
        level: 0,
        /**入场观众数量 */
        viewerCount: 0,
        /**门票收入 (公式 入场观众数量 * 当前门票单价)*/
        ticketReward: 0,
        /**观众打赏金额 */
        viewerReward: 0,
    }

    //初始化设置
    constructor(){
    }
}

/**
 * 配置文件数据 (只读数据)
 */
export class ConfigData {

   /**商店信息库 */
   shops:Array<BaseCarShop>;

   /**车辆信息库 */
   cars:Array<BaseCar>;

   /**车辆属性最大值(防止超限) */
   readonly carPropLimit = {
    max:{
        speed:800,
        defense:500,
        wheels:500,
        steer:400,
    },
    min:{
        speed:300,
        defense:0,
        wheels:0,
        steer:100,
    },
   };

   /**关卡信息库 */
   levels:Array<BaseLevel>;

   /** 杯赛信息库 */
   cupRace:Array<BaseGameCupRace>

   /**关卡信息 */
   themes:Array<BaseTheme>;

   /** 基本车辆贴纸信息 */
   carStickers:Array<BaseCarSticker>

   /** 杯赛刷新时间 / 秒 (不同难度时间不同)*/
   readonly cupRaceRefreshTime:Array<number> = [60*60 *1,60*60 *2,60*60 *3,60*60 *4];

   /**开放展览的等待时间 ，单位 秒 */
   readonly openViewWaitTime = 60;

   /**免费钞票等待时间 和 数值 */
   readonly freeMoney = {
    /**免费钱数 */
    value:2000,
    /**免费等待时间数,单位 秒 */
    timer:60*15
   }

   readonly carParkUnlock:Array<{id:number,price:number,priceType:'gold'|'diamond'}> = [
       {id:0,price:0,priceType:'gold'},
       {id:1,price:0,priceType:'gold'},
       {id:2,price:0,priceType:'gold'},
       {id:3,price:500,priceType:'gold'},
       {id:4,price:800,priceType:'gold'},
       {id:5,price:100,priceType:'diamond'},
       {id:6,price:1000,priceType:'gold'},
       {id:7,price:2000,priceType:'gold'},
       {id:8,price:4000,priceType:'gold'},
       {id:9,price:100,priceType:'diamond'},
       {id:10,price:1000,priceType:'gold'},
       {id:11,price:2000,priceType:'gold'},
       {id:12,price:4000,priceType:'gold'},
       {id:13,price:8000,priceType:'gold'},
       {id:14,price:100,priceType:'diamond'},
       {id:15,price:1000,priceType:'gold'},
       {id:16,price:2000,priceType:'gold'},
       {id:17,price:4000,priceType:'gold'},
       {id:18,price:8000,priceType:'gold'},
       {id:19,price:100,priceType:'diamond'},
       {id:20,price:100,priceType:'diamond'},
   ]

   /**7日签到奖励 */
   readonly signGift:Array<{day:number,price:number,priceType:'gold'|'diamond'}> = [
       {day:1,price:1000,priceType:'gold'},
       {day:2,price:20,priceType:'diamond'},
       {day:3,price:5000,priceType:'gold'},
       {day:4,price:50,priceType:'diamond'},
       {day:5,price:9999,priceType:'gold'},
       {day:6,price:80,priceType:'diamond'},
       {day:7,price:100,priceType:'diamond'}
   ];

   /**兑换金钱钻石的比例 */
    readonly exchangeMoneyList:Array<{id:number,name:string,diamond:number,gold:number}>  = [
        {id:0,name:'几张钞票',diamond:10,gold:100},
        {id:1,name:'一踏钞票',diamond:50,gold:550},
        {id:2,name:'一堆钞票',diamond:150,gold:1650},
        {id:3,name:'两大捆钞票',diamond:300,gold:3450},
        {id:4,name:'豪华金猪',diamond:488,gold:5888},
        {id:5,name:'双倍金猪',diamond:8888,gold:10888},
    ];

   //初始设置
    constructor(){
        this.shops = [];
        this.cars = [];
        this.levels = [];
        this.themes = [];
    }

    
}