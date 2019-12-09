
const { ccclass, property,menu,executeInEditMode } = cc._decorator;

const COMP_ARRAY_CHECK = [
    ['cc.Slider', 'progress', false],
    ['cc.ProgressBar', 'progress', false],
    ['BhvProgressLimit', 'progress', false],
]

/**
 * 处理数值的变化，和 BhvRollNumber 差不多的组件，不过这个组件泛用性更强，
 * 可以处理任意组件的lerp 问题
 */
@ccclass
@executeInEditMode
@menu("添加特殊行为/UI/Roll Custom (滚动组件属性)")
export default class BhvRollCustom extends cc.Component {

    @property({
        tooltip: '需要绑定的组件名称'
    })
    componentName: string = '';

    @property({
        tooltip: '需要绑定的组件属性名'
    })
    componentProperty: string = '';

    @property({
        tooltip: '当前的滚动值(开始的滚动值)'
    })
    value: number = 0;

    @property({
        tooltip: '滚动的目标值'
    })
    public get targetValue(): number {
        return this._targetValue;
    }
    public set targetValue(v: number) {
        this._targetValue = v;
        this.scroll();//数据变动了就开始滚动
    }
    @property
    private _targetValue: number = 100;


    /** 滚动的线性差值 0 ~ 1 */
    @property({
        tooltip: '滚动的线性差值',
        step: 0.01,
        max: 1,
        min: 0
    })
    lerp = 0.1;

    @property({
        tooltip: '是否在开始时就播放'
    })
    private playAtStart: boolean = true;

    @property({
        tooltip: '在滚动之前会等待几秒',
        step: 0.1,
        max: 1,
        min: 0
    })
    private runWaitTimer: number = 0;

    private isScrolling: boolean = false;

    private _watchComponent = null;


    //BhvRollNumber

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        
        //编辑器检查,自动附着属性
        this.checkEditorComponent();

        //绑定组件
        this._watchComponent = this.node.getComponent(this.componentName);

        if(CC_EDITOR)return;

        this._watchComponent = this.node.getComponent(this.componentName);
        this.checkComponentState();

        if (this.playAtStart) {
            this.updateComponent();
            this.scroll();
        }
    }


    /**开始滚动数字 */
    scroll() {
        if (this.isScrolling) return;//已经在滚动了就返回
        if (this.runWaitTimer > 0) {
            this.scheduleOnce(() => {
                this.isScrolling = true;
            }, this.runWaitTimer);
        } else {
            this.isScrolling = true;
        }

    }

    /**停止滚动数字 */
    stop() {
        this.value = this.targetValue;
        this.isScrolling = false;
        this.updateComponent();
    }

    /**初始化数值,不填写则全部按默认值处理 */
    init(value?: number, target?: number, lerp?: number) {
        this.targetValue = target || 0;
        this.value = value || 0;
        this.lerp = lerp || 0.1;
    }

    /**滚动到指定数字 */
    scrollTo(target?: number) {
        if (target === null || target === undefined) return;
        this.targetValue = target;
    }

    update(dt) {
        if(CC_EDITOR)return;
        if (this.isScrolling == false) return;
        let scale = (dt / (1 / 60));
        this.value = cc.misc.lerp(this.value, this.targetValue, this.lerp*scale);
        this.updateComponent();
        if (Math.abs(this.value - this.targetValue) <= 0.0001) {
            this.value = this.targetValue;
            this.updateComponent();
            this.isScrolling = false;
            //this.node.emit('roll-hit-target');//滚动数字击中了目标
            return;
        }
    }

    /** 更新组件 */
    updateComponent() {
        //属性或者组件不存在
        if (this._watchComponent == null || this.componentProperty in this._watchComponent === false) return;
        this._watchComponent[this.componentProperty] = this.value;
    }

    //挂在对应节点后，自动获取组件属性和名字
    checkEditorComponent() {
        if (CC_EDITOR) {
            let checkArray = COMP_ARRAY_CHECK;
            for (let i = 0; i < checkArray.length; i++) {
                const params = checkArray[i];
                let comp = this.node.getComponent(params[0] as string);
                if (comp) {
                    if (this.componentName == '') this.componentName = params[0] as string;
                    if (this.componentProperty == '') this.componentProperty = params[1] as string;
                    break;
                }

            }
        }


    }

    checkComponentState() {
        if (!this._watchComponent) { console.error('未设置需要监听的组件'); return; }
        if (!this.componentProperty) { console.error('未设置需要监听的组件 的属性'); return; }
        if (this.componentProperty in this._watchComponent === false) { console.error('需要监听的组件的属性不存在'); return; }
    }


}
