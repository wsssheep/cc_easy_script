import { SaveCar, GameResult, GamePlayInfo, BaseLevel, BaseCar, BaseTheme, BaseCarShop, SaveGiftItem, SaveLevel } from './DataInterface';
import { UserSaveData,GlobalGameData, ConfigData} from "./UserSaveData";

const saveVersion = '_car_test';
const dataPath = {
    level:'data/level_data',
    car:'data/car_data',
    theme:'data/theme_data',
    carShop:'data/shop_car_data',
    cupRace:'data/cup_race_data',
    carSticker:'data/car_sticker_data'
}

/**数据管理者 */
class DataManager{

    /**全局用户数据 (存档在本地的数据) */
    userData:UserSaveData;

    /**全局游戏数据 (储存内存中的数据)*/
    global:GlobalGameData;

    /**配置文件 */
    config:ConfigData;

    
    constructor() {
        
       //初始化数据
       this.userData = new UserSaveData();
       this.global = new GlobalGameData();
       this.config = new ConfigData();

       //加载存档数据
       this.loadUserData();
    }

    private _saveTag = saveVersion;

    /**
     * 加载Json 数据
     * @param path - resources 文件内的 地址 
     * @param callback - 加载成功的回调，如果失败，则不会调用
     */
    public loadJson(path:string,callback:(res:object)=>void){

        cc.loader.loadRes(path, cc.JsonAsset,function (err, object) {
            if (err) {
                console.error(err);
               return ;
            } 
            callback(object.json);
        });


    }

    /**初始化用户数据 */
    public initUserData(){
        this.userData = new UserSaveData();
    }

    /**从 localStorage 加载本地数据 到内存中 */
    public loadUserData(){
        for(let key in this.userData){
            let value = this.get(key);
            // 自动过滤不合规范的值
            if(value === null||typeof value == 'undefined')continue;
            this.userData[key] = value;
            //console.log('检查数据:',key,this.userData[key]);
        }
    }

    /**保存数据到 localStorage 中 */
    public saveUserData(){
        for(let key in this.userData){
            let value = this.userData[key];
            // 自动过滤不合规范的值
            if(value === null||typeof value == 'undefined')continue;
            this.set(key,value);
            //console.log('保存数据:',key,this.userData[key]);
        }
    }

    /** 获取要保存的用户数据 */
    public getUserData(){
        return this.userData;
    }

    /** 获取保存的全局数据 */
    public getGlobal(){
        return this.global;
    }

    /**存档在 localStorage */
    public set(key:string,value:any){
        cc.sys.localStorage.setItem(key+this._saveTag,JSON.stringify(value));
    }

    /**获取 localStorage 的记录 */
    public get(key:string,defaultValue?:any){
        let data = cc.sys.localStorage.getItem(key+this._saveTag);
        let res = JSON.parse(data);
        if(res == '{}' ||res=="")res = defaultValue; //为空对象时使用默认值
        return res;
    }

    /**移除 localStorage 记录 */
    public remove(key:string){
        cc.sys.localStorage.removeItem(key+this._saveTag);
    }

    /**
     * 将数字转换为时间格式显示,如 00:00:00:00 
     * @param timer 秒级
     * @param isFullTimer 是否显示完整的计时器(显示hour值),否则只会显示 分/秒 值 
     */
    public parseTimer(timer:number =0,isFullTimer:boolean = true){
        let t:number = Math.floor(timer);
        let hours:number = Math.floor( t/3600);
        let mins:number =  Math.floor( (t%3600)/60);
        let secs:number =  t%60;
        let m = ''+mins;
        let s = ''+secs;
        if(secs<10)s = '0'+secs;
        
        //full timer 按小时算,无论有没有小时
        if(isFullTimer){
            if(mins<10) m = '0' + mins;
            return  hours+':'+m+':'+s;
        }else{
            m = ''+ (mins +hours*60);
            if(mins<10) m = '0' + mins;
            return m+':'+s;
        }
    }


    /**
     * 判断两个时间戳日期差距多少天,哪怕只差1小时，只要日期不同也会算作第二天
     * @param sDate1 - 需要比较的时间戳
     * @param sDate2 - 当前时间戳
     * @returns 返回差值天数
     */
    public datedDifference(sDate1, sDate2):number {    
        //时间戳计算
        let preTimer = new Date(sDate1); 
        let curTimer = new Date(sDate2);

        let offsetTimers = curTimer.getTime()- preTimer.getTime();
        let offsetDay = Math.floor(offsetTimers/ (1000 * 60*60*24));

        //年月日是否一致
        if( preTimer.getDate() === curTimer.getDate() && 
            preTimer.getMonth() === curTimer.getMonth() &&
            preTimer.getFullYear() === curTimer.getFullYear() ){
            return 0;       
        }else{
            if(offsetDay<=0)offsetDay =1;
            return offsetDay;
        }
    };
    
}


/**游戏中的数据处理函数 (游戏专用...) */
class MyDataManager extends DataManager {

    constructor(){
       super()

       setTimeout(() => {
           //数据初始化 
           this.init();
       }, 100);

    }

    /**
     * 初始化数据,加载配置游戏数据进入游戏中
     */
    init(){

        this.loadJson(dataPath.car,(res:[])=>{
            this.config.cars =  res;
        });

        this.loadJson(dataPath.theme,(res:[])=>{
            this.config.themes = res;
        });

        this.loadJson(dataPath.level,(res:[])=>{
            this.config.levels = res;
        });

        this.loadJson(dataPath.carShop,(res:[])=>{
            this.config.shops = res;
        });

        this.loadJson(dataPath.cupRace,(res:[])=>{
            this.config.cupRace = res;
        });

        this.loadJson(dataPath.carSticker,(res:[])=>{
            this.config.carStickers = res;
        });

    }


    /**
     * [自定义] 数据计算, 根据车辆耐久的损耗，得出需要花费的修理费用
     * @param save - 车辆耐久信息对象
     * @returns 返回修理需要的价格
     */
    public getFixedCost(save:SaveCar):{defence:number,wheels:number} {

        let defence:number = 0;
        let wheels:number = 0;
        let carId:number = save.id;
        let carInfo:BaseCar = _.find(this.config.cars,{id:carId});
        let base:number = Math.floor(carInfo.price * 0.1); //基础花费 10 金币 (需要获取车辆原价的10%)
        
        defence = Math.floor(save.defense  *base);
        wheels  = Math.floor(save.wheels  * base);

        return {
            defence:defence,
            wheels:wheels
        }

    }

    /**
     * [自定义] 根据战斗数据传入战斗结果
     * @param input - GamePlayInfo, 一局游戏中的 相关信息
     * @returns 返回本次表演赛的结果
     */
    public getGameResult(input:GamePlayInfo):GameResult{
        let result:GameResult = {
            currentTimes:0,
            bestTimes:0,
            steerCount:0,
            hurtCount:0,
            viewerCount:0,
            viewerReward:0,
            ticketReward:0,
            allReward:0,
        }

        return result;
    }

    /**
     * [自定义] 获取对应ID car 的 属性百分比 
     * @param carId - 车辆编号
     * @returns 百分比属性
     */
    public getCarPropByPercentage (carId:number):{defense:number,speed:number,wheels:number,steer:number}{
        let carLimit = this.config.carPropLimit;
        let carInfo = _.find(this.config.cars,{id:carId});
        
        let defense = (carInfo.defense - carLimit.min.defense  )  /(carLimit.max.defense- carLimit.min.defense);//车身
        let speed = (carInfo.speed   - carLimit.min.speed  )/(carLimit.max.speed- carLimit.min.speed);//速度
        let wheels = (carInfo.wheels  - carLimit.min.wheels  )/(carLimit.max.wheels- carLimit.min.wheels); //轮胎
        let steer = (carInfo.steer   - carLimit.min.steer  )/(carLimit.max.steer- carLimit.min.steer);  //转向

        return {
            defense:defense,
            speed:speed,
            wheels:wheels,
            steer:steer,
        };
    }

    /**
     * [自定义] 获取参观停车位游客的门票收入(估算值)
     */
    public getParkingVisitPrice(){
        const myCup = this.userData.myCup;
        const cars = this.userData.cars;
        const carData = this.config.cars;

        //*铜杯 +1 银杯+3 金杯 +5
        let cupPoint = (myCup.copper*1+myCup.sliver*3+myCup.gold*5);
        let carPoint = 0;
        cars.forEach((car,index,arr)=>{
          let carInfo = _.find(carData,{id:car.id});
          let point = 0;
          //* 1000 元的车, 增加 门票价格 1
          if(carInfo.priceType === "gold"){
            point = carInfo.price /1000;
          }else{
            point = carInfo.price /10;
          }
          carPoint += Math.ceil(point);
        });

        return (cupPoint+carPoint)*10;


    }

    /**
     * [自定义] 添加一辆车到存档中
     */
    public addCar(id:number):boolean{
        let cars = this.userData.cars;
        let include = _.includes(cars,{id:id});
        if(include)return false;

        let newData:SaveCar = {
            id:id,
            defense:1,
            wheels:1,
            sticker:0,
            exp:0
        }

        cars.push(newData);
        return true;
        
    }

    /**
     * [自定义] 移除一辆在存档中的车俩
     */
    public removeCar(id:number){
        let cars = this.userData.cars;
        let left = _.remove(cars,{id:id}); 
        return left?true:false;

    }

    /**
     * [自定义] 暂时保存礼物的礼物箱子
     * @param gift 
     */
    public sendToGiftBox(gift:SaveGiftItem){
        let giftBox = this.userData.giftBox;
        giftBox.push(gift);
    }


    /**
     * [自定义] 更新关卡存档数据
     * @param theme - 当前主题
     * @param levelId 关卡ID
     * @param data - 需要更新的关卡结果数据
     * @returns 返回结果,可以判断哪些数据更新了，或者是第一次通关
     */
    public setLevelData(theme:number,levelId:number,data:SaveLevel){
        let save = _.find(this.userData.passLevels,{level:levelId,theme:theme});
        let result = {
            first:false,
            bestTimes:false,
            complete:false,
            rank:false
        };

        if(_.isNil(save)){
            //第一次玩的数据，直接放入
            this.userData.passLevels.push(data);
            result.first = true;
        }else{
            //最短时间记录
            if(save.bestTimes < data.bestTimes || data.bestTimes ==0){
                save.bestTimes = data.bestTimes;
                result.bestTimes = true;
            }

            //完成进度记录
            if(save.complete > data.complete){
                save.complete = data.complete;
                result.complete = true;
            }

            //评价等级记录
            if(save.rank > data.rank){
                save.rank = data.rank;
                result.rank = true;
            }
        }

        return result;
    }

    /**
     * [自定义] 初始化世界数据 (关卡数据初始化)
     */
    public initGlobalGameData(){
        let init =  new GlobalGameData().game;
        this.global.game = JSON.parse(JSON.stringify(init));
        let game = this.global.game;

        let select = this.userData.lastSelectPlay;
        let saveData = _.find(this.userData.passLevels,{theme:select.theme,level:select.level});
        let levelData = _.find(this.config.levels,{level:select.level,theme:select.theme});

        game.mode = select.mode as 0;//模式
        game.theme = select.theme;//主题
        game.level = select.level;//关卡
        game.starMax = levelData.star; //星星

        //关卡最短时间
        if(saveData){
            game.timerMin = saveData.bestTimes;
        }
        
    }

}



/** 数据管理 */
export let dataManager = new MyDataManager();

