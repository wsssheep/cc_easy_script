/*
 * @Author: wss 
 * @Date: 2019-03-08 17:30:56 
 * @Last Modified by: wss
 * @Last Modified time: 2019-03-15 19:58:53
 */

    let SCENE_NAME = {
        HOME:'Home', //背景音路径
        LEVEL:'Level',    //UI音效路径
        DEMO:'DemoScene'
    }
    
    const LOAD_PREFAB_PATH = "prefab/WindowPreload"; 

  /**
  *  场景管理，管理场景的切换和预加载
  */
 class SceneManager  {

    private targetScene:string = null;
    private isAutoStart:boolean = false;
    private isLoading:boolean = false;
    public SCENES = SCENE_NAME;

    preloadScene(name:string,autoStart:boolean = false){

        //TODO 优化加载界面结构.....
        if(this.isLoading)return;
        
        this.isLoading = true;
        cc.loader.loadRes(LOAD_PREFAB_PATH,cc.Prefab,(e,res:cc.Prefab)=>{
            let canvas = cc.find('Canvas');
            let node = cc.instantiate(res);
            canvas.addChild(node);

            let progressBar = node.getChildByName('content').getChildByName('progressBar');
            let progress = progressBar.getComponent(cc.ProgressBar);
            let number   = node.getChildByName('content').getChildByName('number');
            let progressLabel = number.getComponent(cc.Label);
  
            //cc.director.loadScene("MyScene",this.onSceneLaunched)
            this.targetScene = name;
            this.isAutoStart = autoStart;
            //预加载场景
            cc.director.preloadScene(name,(completedCount: number, totalCount: number, item: any)=>{
                //进度条
                progress.progress = completedCount/totalCount;
                progressLabel.string = Math.floor(completedCount/totalCount *100).toString();

            },(e)=>{
                progress.progress = 1;
                progressLabel.string = "100";
                this.isLoading = false;
                this.onPreloadFinish(e)
            });

        });


    }
    
    loadScene(name:string){
        //切换场景
       cc.director.loadScene(name,this.onSceneLaunched)
    }

    onPreloadFinish(e){
        console.log("Next scene preloaded:");
        //加载完成，读取新场景
        if(this.isAutoStart){
            this.loadScene(this.targetScene);
        }
    }

    onSceneLaunched(){
       
    }



    // update (dt) {}
}

export let sceneManager = new SceneManager();
