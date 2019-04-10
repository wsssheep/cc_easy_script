/*
 * @Author: wss 
 * @Date: 2019-04-10 00:32:03 
 * @Last Modified by:   wss 
 * @Last Modified time: 2019-04-10 00:32:03 
 */

import { dataManager } from './../Script/Data/DataManager';

const {ccclass, property} = cc._decorator;

/**
 * 上帝模式窗口，一般用于快速游戏测试一些内容
 */
@ccclass
export default class GodModeMenu extends cc.Component {

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        CC_DEV
    }

    onButtonDown(e,type:string){
        switch (type) {
            case 'init_data':
                dataManager.initUserData();
                break;
            case 'add_diamond':
                dataManager.userData.diamond +=100;
                break;
            case 'add_diamond_max':
                dataManager.userData.diamond +=99999;
                break;
            case 'add_crash':
                dataManager.userData.gold +=1000;
                break;
            case 'add_crash_max':
                dataManager.userData.gold +=999999;
                break;
            case 'car_unlock': // 获得所有车辆
                break;
            case 'car_lock': //移除所有车辆
                break;
            case 'level_unlock': // 获得所有车辆
                break;
            case 'level_lock': //移除所有车辆
                break;
            default:
                break;
        }
    }

    // update (dt) {}
}
