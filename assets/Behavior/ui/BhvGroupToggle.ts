// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property,executeInEditMode} = cc._decorator;

/**
 * 点击切换 选项卡 的状态行为，可以改变节点属性，或者组件属性
 */
@ccclass
@executeInEditMode
export default class BhvGroupToggle extends cc.Component {

    @property
    private _index : number = 0;
    public get index() : number {
        return this._index;
    }

    @property({
        type:cc.Integer
    })
    public set index(v : number) {
        if (v < 0) v = this.node.childrenCount-1;
        this._index = v % this.node.childrenCount;
        this.setChildrenState(this._index);
    }

    @property
    componentName:string = '';

    @property
    componentProperty:string = '';

    @property
    componentSelectValue:string = '';

    @property
    componentUnSelectValue:string = '';
    

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    public setByName(name:string){
        let index = this.node.children.findIndex(v=>{return v.name == name});
        if(index<0){cc.error('frameIndex 设置了不存在的节点:',name);return;}
        this.index = index||0;
     }

     /**通过事件的方式设置 index （编辑器用) */
    setEventIndex(e,data:string){
        this.index = parseInt(data);
    }

    /**通过事件的方式设置 name （编辑器用) */
    setEventName(e,name:string){
        this.setByName(name);
    }

    public next(){
        this.index++;
    }

    public previous(){
        this.index--;
    }

    private setChildrenState(index:number){
        if(this.componentName ==='' || this.componentProperty === '')return;
        this.node.children.forEach((node,i)=>{

            let selected = index === i; //是否为选中的属性
            if(this.componentName === 'cc.Node'){
                if(this.componentProperty in node){
                    //node[this.componentProperty] = 
                }
            }else{
                let comp = node.getComponent(this.componentName);
                let selectValue:any = selected?this.componentSelectValue:this.componentUnSelectValue;
                if(comp == null || this.componentProperty in comp === false){
                    if(comp){
                        cc.error(this.componentProperty+'is not in'+comp.name);
                    }else{
                        cc.error('cant find comp '+this.componentName+' in '+node.name);
                    }
                    return;
                }
                switch (typeof comp[this.componentProperty]) {
                    case 'boolean':
                        comp[this.componentProperty] = selectValue == true; //模糊等于判断
                        break;
                    case 'number':
                        comp[this.componentProperty] = parseFloat(selectValue);
                        break;
                    case 'string':
                        comp[this.componentProperty] = selectValue ;
                        break;
                
                    default:
                        break;
                }
            }
        })


    }

    // update (dt) {}
}
