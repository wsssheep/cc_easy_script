

const {ccclass, property} = cc._decorator;

/**
 * 处理加载条的泛用脚本
 */
@ccclass
export default class PlugPreloader extends cc.Component {

    @property(cc.Label)
    progressLabel: cc.Label = null;

    @property(cc.ProgressBar)
    progressBar:cc.ProgressBar = null;

    @property(cc.Label)
    loadingLabel:cc.Label = null;

    @property
    directorEvent:string = 'Preloader:Progress';

    @property({
        tooltip:'加载条完成是否自动关闭？'
    })
    finishedClose:boolean = true;

    onLoad(){

    }

    onEnable(){
        cc.director.on(this.directorEvent,this.onProgress,this);
    }
    
    onDisable(){
        cc.director.off(this.directorEvent,this.onProgress,this);

    }

    onProgress(cur,total,finished){
            if(finished===true){
                this.destroy();
            }

            if(this.progressLabel)this.progressLabel.string =  Math.floor(cur/total *100).toString()+'%';
            if(this.progressBar)this.progressBar.progress = finished?1:(cur/total);
    }



    // update (dt) {}
}
