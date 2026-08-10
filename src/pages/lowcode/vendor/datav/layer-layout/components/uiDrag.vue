<template>
    <div :style="`background:#000;height:${pageLayout.h}px;width:${pageLayout.w}px;position: relative;`">
        <vue-drag-resize  :parentLimitation="true" v-if="gridData.length > 0" v-for="(item,index) in gridData" :key="index" 
            :class="active && item['_id'] == active['_id'] ? 'active-grid' : ''"
            :gridX="10"
            :gridY="10"
            :snapToGrid="true"
            :isActive="active && item['_id'] == active['_id']"
            :z="item.gridData.z" 
            :x="item.gridData.x" 
            :y="item.gridData.y" 
            :w="item.gridData.w" 
            :h="item.gridData.h"
            @clicked="onActivated($event,item)"
            @deactivated="onDeactivated"
            @dragstop="onDragstop($event,item)"
            @resizestop="onResizestop($event,item)">
            <div class="grid-item-tool-layout tool-top-layout" v-if="active && item['_id'] == active['_id']">
                <div class="grid-item-tool-layout-item grid-item-tool-layout-item-title" style="">
                    {{item.com_name}}
                </div>
                <div class="grid-item-tool-layout-item" style="">
                    <i class="el-icon-close" @click="deleteItem(item)"></i>
                </div>
            </div>
            <div>
                <el-card :key="index" :body-style="{ padding: '0px' }" v-if="!item._layout">
                    <img width="100%" lazy fit="contain" :src="getImagePath(item.example)" class="image">
                    <div style="padding: 14px;">
                        <span>({{item.gridData.z}})</span>
                    {{item.com_type_name}}
                    <span>{{item._id}}</span>
                        <!-- <span>{{item.com_type_name}}</span> -->
                        <div class="bottom clearfix">
                            <!-- <time class="time">{{ currentDate }}</time> -->
                            <!-- <el-button type="text" class="button">操作按钮</el-button> -->
                        </div>
                    </div>
                </el-card>
                <page-item
                    v-if="item._layout"
                    ref="pageItem"
                    :page-item="item"
                    :layout="item._layout"
                    @click.stop=""
                ></page-item>
            </div>

            
            <div class="grid-item-tool-layout tool-bottom-layout" v-if="active && item['_id'] == active['_id']">
                
                <div class="grid-item-tool-layout-item" style="" @click="onUp(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-bar-up" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M3.646 11.854a.5.5 0 0 0 .708 0L8 8.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708zM2.4 5.2c0 .22.18.4.4.4h10.4a.4.4 0 0 0 0-.8H2.8a.4.4 0 0 0-.4.4z"/>
</svg>
                </div>
                <div class="grid-item-tool-layout-item" style="" @click="onDown(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-bar-down" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M3.646 4.146a.5.5 0 0 1 .708 0L8 7.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zM1 11.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5z"/>
</svg>
                </div>
            </div>
            
            <!-- <div style="padding:10;background:#fff;border:1px solid #eee;height:100%;" >
                <span>({{item.gridData.z}})</span>
                {{item.text}}
                <span>{{item._id}}</span>
            </div> -->
            <!-- :w="item.gridData.w"
            @mousemove="drag"
            @dragging="onDragging" :h="item.gridData.h" -->
        </vue-drag-resize>
    </div>
</template>

<script>




import PageItem from "../../component/page-item/page-item.vue";
  import VueDragResize from 'vue-drag-resize';
export default {
    name:'ui-drag',
  components: {VueDragResize,PageItem},

  mixins: [],

  props: {
    list:{
        type:Array,
        default(){
            return []
        }
    },
    pageLayout:{
        type:Object,
        default(){
            return {
                "x":0,
                "y": 0,
                "w": "1920",
                "h": "1080",
            }
        }
    }
  },
  computed:{
     zIndexs(){
        let z = {}
        let list = this.bxDeepClone(this.list)
        for(let item of list){
            if(item.hasOwnProperty('_id')){
                z[item['_id']] = item.gridData.z
            }
        }
        return z
     }
  },
  data() {
    return {
        gridData:[],
        active:null
    };
  },

    created: function () {
    },

    mounted: function () {
        window.addEventListener('mousedown', this.mousedown)//监听鼠标按下
        // window.addEventListener('mousemove', this.mousemove)//监听鼠标按下

    window.addEventListener('mouseup', this.mouseup)//监听鼠标抬起
        // let list = this.bxDeepClone(this.list)
        // if(Array.isArray(list) && list.length > 0){
        //     this.gridData = list.map((item) => {
        //         item['gridData'] = {
        //             x:0,
        //             y:0,
        //             w:0,
        //             h:0,
        //             z:999
        //         }
        //         return item
        //     })
        // }
    },
  methods: {
    deleteItem(e){
        if(e && this.active && e['_id'] == this.active['_id']){
            this.$emit('delete',e['_id'])
        }
    },
    onUp(e){
        if(e && this.active && e['_id'] == this.active['_id']){
            this.$emit('layer-updated',{_id:e['_id'],type:'up'})
        }
    },
    onDown(e){
        if(e && this.active && e['_id'] == this.active['_id']){
            this.$emit('layer-updated',{_id:e['_id'],type:'down'})
        }
    },
    onDragging(e){
        console.log('onDragging',e)
    },
    drag(e){
        console.log(e)
    },
    onActivated(e,item){
        //点击内部
        console.log('onActivated',e,item)
        this.$emit("active-updated",this.bxDeepClone(item))
        this.$set(this,'active',this.bxDeepClone(item))

    },
    onDeactivated(e){
        //点击外部
        console.log('onDeactivated',e)
        // this.$emit("clones-active",null)
    },
    onDragstop(e,item){
        //拖放结束
        console.log('onDragstop',e,item)
        this.$set(item.gridData,'x',e.left)
        this.$set(item.gridData,'y',e.top)
        // item.gridData.x = e.left
        // item.gridData.y = e.top
        this.$emit("updated",item)
        
    },
    onResizestop(e,item){
        //缩放结束
        console.log('onResizestop',e,item)
        this.$set(item.gridData,'x',e.left)
        this.$set(item.gridData,'y',e.top)
        this.$set(item.gridData,'w',e.width)
        this.$set(item.gridData,'h',e.height)
        this.$emit("updated",item)
    },
    mousedown(e){
        console.log('mousedown',e)
    },
    mouseup(e){
        console.log('mouseup',e)
    }
  },
  watch:{
    "list":{
        deep:true,
        handler:function(nval,oval){
            console.log(nval,oval)
            if(Array.isArray(nval)){
                this.gridData = nval.map((item) => {
                    let obj = this.bxDeepClone(item)
                    // obj['gridData'] = {
                    //     x:0,
                    //     y:0,
                    //     w:0,
                    //     h:0,
                    //     z:999
                    // }
                    return obj
                })
            }
        }
    }
  }
};
</script>



<style lang="scss" scoped>
.active-grid{
    border:1px solid #c8efc6;
    box-shadow: 0 2px 12px 0 rgb(61 221 21 / 52%);
    .grid-item-tool-layout{
        padding:2px;
        box-sizing:border-box;
        display:flex;
        .grid-item-tool-layout-item{
            width:1.5rem;
            height:1.5rem;
            font-size:1rem;
            text-align:center;
            line-height:1.5rem;
            border-radius:2px;
            color: #ffffff70;
            background-color: #00000042;
            &:hover{
                color: #ffffffbd;
                background-color: #267df9a3;
            }
            &.grid-item-tool-layout-item-title{
                min-width:2rem;
                width:auto;
            }
        }
        &.tool-top-layout{
            position:absolute;
            right:0;
            top:-1.5rem;
        }
        &.tool-bottom-layout{
            position:relative;
            right:0;
            bottom:0;

        }
    }
}


</style>
