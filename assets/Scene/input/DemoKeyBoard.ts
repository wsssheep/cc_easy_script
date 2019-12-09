import BhvKeyboard from "../../Behavior/input/BhvKeyboard";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class DemoKeyBoard extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onEnable(){
        BhvKeyboard.AddMultKeys({
            'z':{
                'up':()=>{
                    cc.find('sprite_z',this.node).scale =0.8;
                },
                'down':()=>{
                    cc.find('sprite_z',this.node).scale = 1.1;
                }
            },
            //可以获取按键的时间
            'x':(duration:number)=>{
                let scale = duration/1;
                if(scale>2)scale=2;
                cc.find('sprite_x',this.node).runAction(cc.sequence([
                    cc.scaleTo(0.1,1+scale*0.5,1),
                    cc.scaleTo(0.1,1).easing(cc.easeBackOut())
                ]))
            },
 
        },this)
    }

    onDisable(){
        BhvKeyboard.RemoveAllKeys(this);
    }

    start () {

    }

    update (dt) {
        //获取上一次按下的按键是哪一个
        this.label.string = BhvKeyboard.GetLastKeyName()+'('+  BhvKeyboard.GetLastKey()+')';
    }
}
