<template>
    <div  @dragover="onDragOver" class="drag-ui-layout"  @dragenter="onDragNew" 
    v-loading="loading"
    :element-loading-text="loadtext"
    element-loading-spinner="el-icon-loading">
        <!-- @dragend="dragend" @dragover="onDragOver" v-on:dragend="onDragStop" -->
        <div  style="height:100%;"  class="layer-layout" >
            <div  class="layer-layout-left" v-if="editType !== 'select'">
                <div v-for="(item,index) in comList" :key="index" draggable="true"
        unselectable="on" v-on:dragend="unchoose($event,item)" >
                    <el-card :key="index" :body-style="{ padding: '0px' }">
                            <img width="100%" lazy fit="contain" :src="getImagePath(item.example)" class="image">
                            <div style="padding: 14px;">
                                <span>{{item.com_type_name}}</span>
                                <div class="bottom clearfix">
                                    <!-- <time class="time">{{ currentDate }}</time> -->
                                    <!-- <el-button type="text" class="button">操作按钮</el-button> -->
                                </div>
                            </div>
                        </el-card>
                </div>
                <!-- <draggable v-model="list" :group="{
                            name:`itxst`,//组名为itxst
                            pull:'clone',//是否允许拖出当前组
                            put:false,//是否允许拖入当前组
                        }" v-for="(item,index) in comList" :key="index"
                        @end="unchoose($event,item)">
                    <transition-group>
                        
                        <div class="grid-content bg-purple" style="padding:10px;border:1px solid #eee;" :key="index">{{item.com_type_name}}</div>
                    </transition-group>
                </draggable> -->
                
                
            </div>
            <div   class="layer-layout-view" :class="inDragView ? 'on-drag-view' : editType == 'select' ? 'view-full' : ''" >
               
                <uiDrag :list="viewComList"

                        ref="uidrag"
                        :key="'uidrag'"
                        @active-updated="activeUpdated"
                        @clones-active="clonesActive"
                        @updated="updatedItem"
                        @delete="deleteItem"
                        @layer-updated="layerUpdate"
                ></uiDrag>
            </div>
            <div  class="layer-layout-right"  v-if="editType !== 'select'">
                <el-tabs v-model="rightActiveTab" type="card" @tab-click="tabHandleClick">
                    <el-tab-pane label="页面信息" name="page">
                        <div class="grid-content bg-purple">
                            {{pageNo ? `页面编号：${pageNo}` : '新页面'}}
                            
                        </div> 
                        <div class="padding">
                            <el-form :model="pageModel" :rules="pageFieldsRules" ref="pageForm" label-width="0px" class="demo-ruleForm">
                                <el-form-item  prop="page_name">
                                    <el-input v-model="pageModel.page_name"></el-input>
                                </el-form-item>
                                <el-form-item  prop="page_title">
                                    <el-input v-model="pageModel.page_title"></el-input>
                                </el-form-item>
                                <el-form-item>
                                    <el-button type="primary" @click="submitForm('pageForm')">保存</el-button>
                                    <el-button @click="review('pageForm')">预览</el-button>
                                </el-form-item>
                            </el-form>
                        </div> 
                    </el-tab-pane>
                    <el-tab-pane label="布局" name="layout">
                        <div class="grid-content bg-purple">
                            {{pageNo ? `页面编号：${pageNo}` : '新页面'}}
                            
                        </div> 
                        <div class="padding">
                            <el-form :model="pageModel" :rules="pageFieldsRules" ref="pageForm" label-width="0px" class="demo-ruleForm">
                                <el-form-item  prop="page_name">
                                    <el-input v-model="pageModel.page_name"></el-input>
                                </el-form-item>
                                <el-form-item  prop="page_title">
                                    <el-input v-model="pageModel.page_title"></el-input>
                                </el-form-item>
                                <el-form-item>
                                    <el-button type="primary" @click="submitForm('pageForm')">保存</el-button>
                                    <el-button @click="review('pageForm')">预览</el-button>
                                </el-form-item>
                            </el-form>
                        </div> 
                    </el-tab-pane>
                    <el-tab-pane :label="active.com_type_name" name="active" v-if="active">
                        <div class="grid-content bg-purple">
                            
                            <!-- <div>{{JSON.stringify(active)}}</div> -->
                            <div v-if="active">{{active.com_name}}</div>
                            
                            <!-- <div v-if="active">
                                <el-button @click="onUp">置顶</el-button>
                                <el-button @click="onDown">置底</el-button>
                            </div> -->
                            
                        </div> 
                        
                    </el-tab-pane>
                </el-tabs>
               
                
            </div>
        </div>
    </div>
        


  </template>
  
  <script>
  
  
  import draggable from 'vuedraggable'
  import uiDrag from './components/uiDrag.vue'
  import pageInit from './utils/page-mixin.js'
  import comlistInit from './utils/comlist-init-mixin.js'
  import { $http } from "@/common/http.js";
  export default {
    components: {draggable,uiDrag},
  
    mixins: [pageInit,comlistInit],
  
    props: {},
  
    data() {
      return {
        active:null,
        rightActiveTab:'page',
        list: [
            {
                key:1,
                text:'测试1',
                gridData:{
                    w:100,
                    h:200,
                },
            },{
                key:2,
                text:'测试2',
                gridData:{
                    w:600,
                    h:100,
                },
            },
            {
                key:3,
                text:'测试3',
                gridData:{
                    w:200,
                    h:600,
                },
            }
           
        ],
        list2:[],
        dragView:null,
        onDragView:false,
        onDragData:null,
        updateGridItem:false
      };
    },
  computed:{
     inDragView(){
        let is = false
        let dragView =  this.dragView ? this.bxDeepClone(this.dragView) :this.dragView
        let onDrag = this.onDragData ? this.bxDeepClone(this.onDragData) :this.onDragData 
        if(onDrag && dragView && onDrag.x > dragView.x  && onDrag.y > dragView.y && onDrag.x < (dragView.x + dragView.width) && onDrag.y < (dragView.y + dragView.height) ){
            is = true
        }
        return is
     },
     zIndexs(){
        let z = {}
        let list = this.bxDeepClone(this.list2)
        for(let item of list){
            if(item.hasOwnProperty('_id')){
                z[item['_id']] = item.gridData.z
            }
        }
        return z
     }
  },
  created: function () {
    this.loading = true
    if(!this.pageInitStatus){
        this.getComList()
    }
  },

  mounted: function () {
    //   this.loading = true
      let isPage = this.$route.params
      if(isPage && isPage.hasOwnProperty('no')){
         this.pageNo = isPage.no
         let path = this.$route.path
         if(path.indexOf('/layer/editor/') !== -1 && isPage.no){
            this.$set(this,'editType','update')
         }else if(path.indexOf('/layer/view/') !== -1 && isPage.no){
            this.$set(this,'editType','select')
         }
         this.reviewPage()
      }else{
         let path = this.$route.path
         this.$set(this,'editType','add')
        //  this.reviewPage()
      }
      this.dragView = this.$refs.uidrag.$el.getBoundingClientRect();
      if(this.dragView){
        this.$set(this,'dragView',{
            bottom: this.dragView.bottom,
            height: this.dragView.height,
            left: this.dragView.left,
            right: this.dragView.right,
            top: this.dragView.top,
            width: this.dragView.width,
            x: this.dragView.x,
            y: this.dragView.y})
      }
      console.log('----',this.$refs.uidrag.$el.getBoundingClientRect())
  },
  
    
  
    methods: {
        // @mousemove="mousemove" @mouseup="mouseup" @mousedown="mousedown"
        onUp(){
            this.updateGridItem = true
            let active = this.bxDeepClone(this.active)
            let list = this.bxDeepClone(this.list2)
            // this.list2 = []
            let oldTop = list.filter(item => item.gridData.z === 999)
            if(oldTop.length > 0){

            }
            if(list.length > 1){
                let onIndex = null
                list = list.map((item,index) => {
                    
                    
                    if(item.hasOwnProperty('_id') && active  && item['_id'] === active['_id']){
                        onIndex = index
                        item.gridData.z = 999
                    }else{
                        if(index > onIndex && item.gridData.z !== 999){
                            item.gridData.z = item.gridData.z - 1
                        }else if(item.gridData.z === 999){
                            item.gridData.z = list.length - 1
                        }
                    }
                    
                    
                    return item
                })
                
                // list = list.sort(function (a, b) {
                //         return a.gridData.z - b.gridData.z; //升序排序
                // });
                this.$nextTick(() => {
                    this.list2 = [].map(item=>item)
                    this.list2 = list.map(item => item)
                    this.updateGridItem = false
                })
            }
            
            
        },
        onDown(){
            this.updateGridItem = true
            let active = this.bxDeepClone(this.active)
            let list = this.bxDeepClone(this.list2)
            // this.list2 = []
            if(list.length > 1){
                let onIndex = null
                list = list.map((item,index) => {
                    
                    
                    if(item.hasOwnProperty('_id') && active  && item['_id'] === active['_id']){
                        onIndex = index
                        item.gridData.z = 0
                    }else{
                        item.gridData.z = item.gridData.z + 1
                    }
                    
                    
                    return item
                })
               
                
                // list = list.sort(function (a, b) {
                //         return a.gridData.z - b.gridData.z; //升序排序
                // });
                this.$nextTick(() => {
                    this.list2 = [].map(item=>item)
                    this.list2 = list.map(item => item)
                    this.updateGridItem = false
                })
            }
        },
        layerUpdate(e){
            let id = e['_id']
            let type = e['type']
            let item = id == this.active['_id'] ? this.active : this.list2.filter(item => item['_id'] == id)[0]
            if(id && item){
               switch (type) {
                case 'up':
                    this.onUp(item)
                    break;
                case 'down':
                        this.onDown(item)
                    break;
               
                default:
                    break;
               }
            }

        },
        deleteItem(e){
            let id = e
            if(id){
                this.list2 = this.list2.filter(item => item['_id'] !== id)
            }
        },
        onMove(e,originalEvent){ 
            console.log(e,originalEvent)
         //不允许停靠
         if (e.relatedContext.element.id == 1) return false;
         //不允许拖拽
         if (e.draggedContext.element.id == 4) return false;
        //  return true;
      },  
      onDragStop(e){ 
            console.log('onDragStop---------------------------------',e)
        //  return true;
      },  
      onDragNew(e){
        console.log('on drag new ----------',e)
      },
      onDragOver(e){
            let x = e.x
            let y = e.y
            
            console.log('onDragOver',x,y)
            this.$set(this,'onDragData',{x,y})
        },
        add(e){
            let oldList = this.bxDeepClone(this.list2)
            oldList = oldList.sort(function (a, b) {
                        return a.gridData.z - b.gridData.z; //升序排序
                });
            if(!e && (!this.dragView || !this.onDragData) && this.list2.length > 199){
                return
            }else if(this.dragView && this.onDragData){
                let newItem = this.bxDeepClone(e)
                //初始化坐标和盒子大小
                let x =  this.onDragData.x - this.dragView.x
                let y =  this.onDragData.y - this.dragView.y
                let w = newItem.gridData ? newItem.gridData.w : 200
                let h = newItem.gridData ? newItem.gridData.h : 100
                let grid = {
                    x:x,
                    y:y,
                    w:w,
                    h:h,
                    z:oldList.length + 1,
                    _dataSource:'store'
                }
                newItem['gridData'] = this.bxDeepClone(grid)
                newItem['_id'] = this.guid()
                oldList.push(newItem)
                this.onDragData = null
                oldList = oldList.map((item,index) => {
                    item.gridData.z = index + 1
                    return item
                })
                this.list2 = oldList.map((item,index) => {return item})
                
            }
            
            
        },
        unchoose(e,item){
            // console.log('unchoose',e)
            // console.log('unchoose',e.item._underlying_vm_,item)
            if(this.inDragView){
                
                this.add(item)
            }
            
        },
        // mousemove(e){
        //     console.log('mousemove',e)
        // },
        // mouseup(e){
        //     console.log('mouseup',e)
        // },
        mousedown(e){
            console.log('mousedown',e)
        },
        // updateMove(e){
        //     console.log('updateMove',e)
        // },
        // sort(e){
        //     console.log('sort',e)
        // },
        activeUpdated(item){ 
            if(item && !this.updateGridItem){
                this.$set(this,'active',item)
            }
        },
        updatedItem(e){
            console.log(e)
            // 本地更新 用户操作修改的数据
            if(e &&  !this.updateGridItem){
                if(e.gridData['_dataSource'] == 'db'){
                    // 如果是已持久化存储数据修改
                    this.loadComList = this.loadComList.map(i => {
                        if(e && i && i['_id'] == e['_id']){
                            i = this.bxDeepClone(e)
                        }
                            
                        return i
                    })
                }else{
                    
                    // 如果是本地内存存储数据修改
                    this.list2 = this.list2.map(i => {
                        if(e && i && i['_id'] == e['_id']){
                            i = this.bxDeepClone(e)
                        }
                            
                        return i
                    })
                }
                
            }
        },
        clonesActive(){
            this.$set(this,'active',null)
        },
        tabHandleClick(e){
            console.log(e)
        }
    },
    watch:{
        "active":{
            deep:true,
            handler:function(nval,oval){
                console.log(nval,oval)
                if(nval){
                    this.$set(this,'rightActiveTab','active')
                }else{
                    this.$set(this,'rightActiveTab','page')
                }
            }
        }
    }
  };
  </script>
  
  
  
  <style lang="scss" scoped>
  
  .drag-ui-layout {
        user-select: none;
    .layer-layout{
        display:flex;
        .layer-layout-left{
            //拖拽左侧模板
            width:10rem;
            padding:5px;
            box-sizing:border-box;
            height:100vh;
            overflow-y:auto;
            &>div{
                margin-bottom:5px;
                &:last{
                    margin-bottom:0;
                }
            }

        }
        .layer-layout-view{
            //拖拽视口区域
            width:calc(100% - 25rem);
            max-width:calc(100vw - 25rem);
            overflow-x:auto;
            
            &.view-full{
                width:100vw;
                max-width:100vw;
            }
        }
        .layer-layout-right{
            // 右侧功能
            width:15rem;

        }
        // cursor:no-drop;
        .on-drag-view{
            background:#c8efc6;
            cursor:cell;
            // cursor:cell;
            .layer-layout-view{
                
            }
        }
    }
    
  }
  
  </style>
  