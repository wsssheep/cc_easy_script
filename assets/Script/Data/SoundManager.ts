/*
 * @Author: wss 
 * @Date: 2019-02-01 21:37:54 
 * @Last Modified by: wss
 * @Last Modified time: 2019-02-23 22:46:18
 */


 let audioPath = {
     BGM:'audio/bgm/', //背景音路径
     UI:'audio/ui/',    //UI音效路径
     SE:'audio/se/',    //通用音效路径
     VOICE:'audio/voice', //语音音效路径
 }

 /**
  *  声音管理，管理音频播放等问题
  *  区分为 playBgm 和 play 两种播放，
  *  playBgm 只能同时播放一个文件, 而 play 可以自由控制
  */
 class SoundManager {

    /**储存audio tag 标签 */
    private audioTags:Array<{tag:string,id:number,loop:boolean}> =[];
    
    /**默认背景音乐音量 */
    public bgmVolume:number = 1.0;

    /**默认音效音量 */
    public defaultVolume:number = 1.0;

    /**唯一bgm ID */
    private bgmAudioId:number = -1;

    /** 语音音量 */
    //public voiceVolume:number = 1.0;



    constructor(){

    }
 
    path = audioPath;

    preload(path:string,name:string,callback:Function){
        cc.audioEngine.preload(path+name,callback);
    }

    /**
     * 
     * @param path - 音频文件路径
     * @param name - 音频文件名字
     * @param tag -  tag 可以重复标记audio，这样你可以同时控制多个音效的播放
     * @param loop - 是否循环播放
     */
    play(path:string,name:string,tag?:string,loop:boolean = false,volume?:number){
        cc.loader.loadRes(path+name,cc.AudioClip, (e,clip)=>{
            let vol = this.getDefaultVolume(path,volume); //计算实际声音
            let audioId =  cc.audioEngine.play(clip,loop,vol);
            if(tag){
                this.audioTags.push({tag:tag,id:audioId,loop:loop});
            }
        });
    }

    /**
     * 播放背景音乐 (游戏中只能存在一个背景音乐)
     * @param path - 路径
     * @param name - 名称
     * @param volume - 音效
     */
    playBgm(path:string,name:string,volume?:number){
        cc.loader.loadRes(path+name,cc.AudioClip, (e,clip)=>{
            let vol = this.getDefaultVolume(path,volume); //计算实际声音
           this.bgmAudioId = cc.audioEngine.playMusic(clip,true);
           cc.audioEngine.setMusicVolume(vol);
        });
    }

    /**
     * 设置背景音乐 声音大小
     * @param volume 音量大小
     */
    setBgmVolume(volume:number){
        cc.audioEngine.setMusicVolume(volume);
    }

    pauseBgm(){
        cc.audioEngine.pauseMusic();
    }

    resumeBgm(){
        cc.audioEngine.resumeMusic();
    }

    /**
     * 停止播放背景音乐
     */
    stopBgm(){
        cc.audioEngine.stopMusic();
        this.bgmAudioId = -1;
    }

    /**快速播放UI文件夹音效 */
    playUI(name:string,volume?:number){
        this.play(soundManager.path.UI,name,null,false,volume);
    }

    /**快速播放SE文件夹音效 */
    playSE(name:string,volume?:number){
        this.play(soundManager.path.SE,name,null,false,volume);
    }

    /**
     * 恢复所有含有 tag 的音效
     * @param tag - 音乐标签
     */
    pause(tag:string){
        this.audioTags.forEach((obj,index,arr)=>{
            if(obj.tag === tag){
                cc.audioEngine.pause(obj.id);   
            }
        })
    }

    /**暂停所有音效 */
    pauseAll(){
        cc.audioEngine.pauseAll();
    }

    /** 恢复所有音效 */
    resumeAll(){
        cc.audioEngine.resumeAll();
    }

    /**
     * 获得对应标签音乐的当前播放进度 (只能找到第一个)
     * @param tag - 音乐标签
     */
    getCurrentTime(tag:string):number{
       return cc.audioEngine.getCurrentTime(this.getAudioId(tag));
    }
    /**
     * 设置当前 tag 的音频播放时间(只能找到第一个)
     * @param tag - 音乐标签
     * @param sec - 秒
     */
    setCurrentTime(tag:string,sec:number){
        cc.audioEngine.setCurrentTime(this.getAudioId(tag),sec);
    }

    /**
     * 获得对应标签音效的长度 (只能找到第一个)
     * @param tag - 音乐标签
     */
    getDuration(tag:string){
        return cc.audioEngine.getDuration(this.getAudioId(tag));
    }

    /**
     * 获取音乐应当播放的实际音量
     * @param path - 分类路径
     * @param volume - 音量
     */
    private getDefaultVolume(path:string,volume:number):number{
        if(path === audioPath.BGM){
            if(volume==null){
                return this.bgmVolume;
            }else{
                return volume * this.bgmVolume;
            }
        }else{
            if(volume==null){
                return this.defaultVolume;
            }else{
                return this.defaultVolume * volume;
            }
        }

    }
    
    /**
     * 停止含有该 tag 的音效
     * @param tag - 音乐标签
     */
    stop(tag:string){
        for (let i = 0; i < this.audioTags.length; i++) {
            const obj = this.audioTags[i];
            if(obj.tag === tag){
                cc.audioEngine.stop(obj.id);
                this.audioTags.splice(i, 1);  
                i = i - 1; //从i位置开始删除1个
            }

        }

    }


    /**
     * 获取游戏当前 tag 音乐的音量
     * @param tag 
     * @param volume 
     */
    setVolume(tag:string,volume:number){
        this.audioTags.forEach((obj,index,arr)=>{
            if(obj.tag === tag){
                cc.audioEngine.setVolume(obj.id, volume); 
            }
        })
    }

    getVolume(tag:string):number{
        return cc.audioEngine.getVolume(this.getAudioId(tag));
    }

    getAudioId(tag:string):number{
        for (let i = 0; i < this.audioTags.length; i++) {
            const obj = this.audioTags[i];
            if(obj.tag === tag){
                return obj.id;
            }
        }
    }


 }


 export let soundManager  = new SoundManager();