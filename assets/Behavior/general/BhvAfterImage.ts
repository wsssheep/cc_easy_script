const { ccclass, property } = cc._decorator;

/**
 * [准备开发]
 * 残影效果（未实现）
 */
@ccclass
export default class BhvAfterImage extends cc.Component {
    @property(cc.Camera)
    camera: cc.Camera = null;

    //表示当前帧的RenderTexture
    @property(cc.Sprite)
    spriteNew: cc.Sprite = null;

    //表示上一帧的RenderTexture
    @property(cc.Sprite)
    spriteOld: cc.Sprite = null;

    texture1: cc.RenderTexture;
    texture2: cc.RenderTexture;

    flag: boolean = true;
    public showAfterImage = false;

    public oldX: number = 0;
    public oldY: number = 0;

    onLoad() {
        //初始化渲染纹理
        this.texture1 = new cc.RenderTexture();
        this.texture1.initWithSize(cc.winSize.width, cc.winSize.height);
        this.texture2 = new cc.RenderTexture();
        this.texture2.initWithSize(cc.winSize.width, cc.winSize.height);
        this.camera = cc.Camera.findCamera(cc.find("Canvas/Cameras"));
    }

    addShadow() {
        if(this.camera==null)return; //未设置相机，不生效
        //设置相机的渲染目标
        if (this.flag) {
            this.camera.targetTexture = this.texture1;
        } else {
            this.camera.targetTexture = this.texture2;
        }
        if (this.flag) {
            //当前渲染目标为t1，则上一帧的缓冲为t2
            let spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(this.texture2);
            //更新残影图片
            this.spriteOld.spriteFrame = spriteFrame;
        } else {
            let spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(this.texture1);
            this.spriteOld.spriteFrame = spriteFrame;
        }
        this.spriteOld.node.setPosition(this.camera.node.getPosition());
        //将摄像机拍摄的图像渲染到渲染纹理内
        this.camera.render(this.node.getParent());

        if (this.flag) {
            //当前渲染目标为t1，则将t1显示到屏幕上
            let spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(this.texture1);
            //更新残影图片
            this.spriteNew.spriteFrame = spriteFrame;
        } else {
            let spriteFrame = new cc.SpriteFrame();
            spriteFrame.setTexture(this.texture2);
            this.spriteNew.spriteFrame = spriteFrame;
        }
        this.flag = !this.flag;
    }

    start() {
        this.schedule(this.addShadow, 0.1, cc.macro.REPEAT_FOREVER, 0);
    }
}
