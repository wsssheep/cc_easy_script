
const {ccclass, property,menu,executionOrder} = cc._decorator;

/**
 * 音频管理器 [v1.0.0]
 * 自动管理音频状态,改进自官方组件，可以控制音量播放, 淡入淡出功能
 */
@ccclass
@menu('其他组件/WSS:AudioSource')
@executionOrder(-1)
export default class BhvAudioSource extends cc.AudioSource {

    // // LIFE-CYCLE CALLBACKS:
    // @property
    // useFadeIn:boolean = true;

    static _TempSources:{source:BhvAudioSource,tag:string}[] = [];
    /**设置指定tag 的 audioSource 的音量 */
    static VolumeTag:any = {};
    /**设置所有默认效果音的音量 */
    static DefaultVolume:number = 1.0;
    static SetTagVolume(tag:string,volume:number =1.0){
        this.VolumeTag[tag] = volume;
        this.UpdateVolume();
    }
    static SetDefaultVolume(volume:number =1.0){
        this.DefaultVolume = volume;
        this.UpdateVolume();
    }
    static GetTagVolume(tag:string){
        if(tag in this.VolumeTag){
            return this.VolumeTag[tag];
        }else{
            return this.DefaultVolume;
        }
    };
    /**手动更新 所有 基于 BhvAudioSource 组件 的音量 */
    static UpdateVolume(){
        this._TempSources.forEach(config=>{
            config.source.volume = this.DefaultVolume;
            if(config.tag in this.VolumeTag){
                config.source.volume = this.VolumeTag[config.tag];
            }
        })
    }
    static GetAudioByTag(tag:string =""):BhvAudioSource[]{
        let result = this._TempSources.filter((config)=>{config.source.tag === tag}).map(value => value.source);
        return result;
    }
    static PauseAll(){
        this._TempSources.forEach(s=>{
            s.source.pause();
        })
    }
    static ResumeAll(){
        this._TempSources.forEach(s=>{
            s.source.resume();
        })
    }

    //原始的音频文件大小
    private _originVolume:number = 1.0;    
    private _isFading:boolean  = false;

    @property({
        tooltip:'识别音乐类型的标签，填写后可以统一通过标签处理'
    })
    private tag:string = ''; //用于识别缓存的组件副本tag

    onLoad () {
        BhvAudioSource._TempSources.push({
            tag:this.tag,
            source:this
        })

        //cc.log(BhvAudioSource._TempSources);
        super.onLoad();
        this._originVolume = this.volume;
        this.volume = BhvAudioSource.GetTagVolume(this.tag) * this._originVolume;


    }

    fadeIn(){

    }

    fadeOut(){
        this.loop = false;
    }

    onEnable(){
        super.onEnable();
        //cc.director.on('BhvAudioSource:Fade',()=>{},this);
    }

    onDisable(){
        super.onDisable();
    }
    
    onDestroy(){
        let index =  BhvAudioSource._TempSources.findIndex(config=>{return config.source === this});
        BhvAudioSource._TempSources.splice(index);
        
        super.onDestroy();
    }

    // update (dt) {
    //     if(this._isFading){

    //     }
    // }
}
