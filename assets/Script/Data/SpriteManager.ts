/*
 * @Author: wss 
 * @Date: 2019-02-01 21:36:53 
 * @Last Modified by: wss
 * @Last Modified time: 2019-02-16 21:00:30
 */

 /** 加载资源的路径,有资源加载需要写在这里 */
let spritePath = {
    /**车辆帧图片 */cars:'pic/car_body/car',
    /**贴纸帧图片 */stickers:'pic/car_sticker/sticker',
    /**赛道主题背景 */themeBG:'pic/theme_bg/bg',
    /**小地图图片 */miniMap:'pic/minimap/map',
}

 /**
  * SpriteFrame 管理器，管理spriteFrame 加载等
  */
class SpriteManager {
    constructor(){

    }
    
    /** 路径 */
    path = spritePath;

    /**
     * 直接设置对应路径资源的sprite资源
     * @param node - 对象
     * @param path - 路径
     * @param name - 名字(可以省略，会直接通过路径查找)
     */
    set(node:cc.Node,path:string = "",name:string|number= ""){
        let stickerFrame = node.getComponent(cc.Sprite);
        cc.loader.loadRes(path+name, (e,img)=>{
            stickerFrame.spriteFrame =  new cc.SpriteFrame(img);
        });
        
    }
}


export let spriteManager = new SpriteManager();
