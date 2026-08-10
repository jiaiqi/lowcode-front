<template>
 <div class="app_pre">
   <div class="app_pre_content">
     <render-page :components="components" :isPreview="true"/>
   </div>
 </div>
</template>
<script>
import RenderPage from "@/pages/low-app/editor-home/render-page.vue";
import {$selectList, $selectOne} from "@/common/http";
import {pageCompCols} from "@/pages/lowcode/components/property/columns";
export default {
  name: "preview-page",
  components: {
    RenderPage
  },
  data(){
    return {
      components:[],
      pageNo:'',
    }
  },
  created(){
    this.pageNo = this.$route.query.pageNo || this.$route.params.pageNo;
    if (this.pageNo) {
      this.initPage();
    }
  },
  methods:{
    //初始化界面信息
    async initPage() {
      console.log("initPage");
      const url = `/config/select/srvpage_cfg_page_guest_select`;
      const req = {
        serviceName: "srvpage_cfg_page_guest_select",
        // colNames: ["*"],
        colNames: [
          "page_title",
          "page_name",
          "id",
          "page_style_no",
          "srv_req_no",
          "preview",
          "page_no",
          "page_options",
          "tmpl_page_no",
          "page_style_json",
        ],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: this.pageNo,
          },
        ],
      };
      const { data, ok, msg } = await $selectOne(url, req);
      if (ok) {
        let newData = this.initPageConfig(data);
        // this.initComponents(newData);
        // this.getPageComponents().then((list) => {
        //   if(Array.isArray(list)){
        //     this.initComponents(list);
        //   }
        // });
        await this.initComponents(newData);
        this.pageRefreshKey = new Date().getTime();
      } else if (msg) {
        this.$message.error(msg);
      } else {
        this.$message.info("无数据！");
      }
    },

    async initComponents(data) {
      const list = await this.getPageComponents();
      const component_json = list?.map((item) => {
        item.visible = item.display !== "否";
        if(item.com_type!=='layout'){
          item.component = "page-item";
          if (item.com_option?.includes("悬浮可拖动")) {
            item.component = "float-component";
          }
        }
        item.data = {};
        pageCompCols.forEach((col) => {
          if (item[col]) {
            item.data[col] = item[col];
          }
        });
        if (item.id) {
          item.data.id = item.id;
        }
        const keys = ["component", "type", "_type"];
        keys.forEach((key) => {
          if (item.data[key]) {
            delete item.data[key];
          }
        });
        return item;
      });
      if (!Array.isArray(component_json)) {
        this.components = [];
        return;
      }else {
        this.components = component_json.filter(item => item.com_type !== 'layout');
      }
      console.log('---获取到的界面信息',this.components)
    },
    //获取界面组件信息
    async getPageComponents() {
      const url = `/config/select/srvpage_cfg_page_component_select`;
      const req = {
        serviceName: "srvpage_cfg_page_component_select",
        colNames: ["*"],
        condition: [
          {
            colName: "page_no",
            ruleType: "eq",
            value: this.pageNo,
          },
        ],
      };
      const { data, ok, msg } = await $selectList(url, req);
      if (ok) {
        if (Array.isArray(data) && data.length) {
          let list = [];
          console.log("getPageComponents:", data);

          data.forEach((item) => {
            if (typeof item.com_json === "string") {
              try {
                const json = JSON.parse(item.com_json);
                list.push({
                  _raw_data: item,
                  ...json,
                });
              } catch (e) {
                console.error(e);
              }
            }
          });
          console.log("getPageComponents", list);
          return list;
        }
      } else if (msg) {
        this.$message.error(msg);
      } else {
        this.$message.info("无数据！");
      }
    },
    //初始化界面配置详情
    initPageConfig(data) {
      Object.keys(data).forEach((key) => {
        if (key && data[key] && key.indexOf("_json") !== -1) {
          try {
            data[`${key}_data`] = JSON.parse(data[key]);
          } catch (e) {
            console.error(e);
          }
        }
      });
      this.pageConfig = data;
      // 使用Vuex初始化主题
      if (data?.app_json_data) {
        let currentTheme = data.app_json_data.current_theme;
        if (
            localStorage.currentTheme &&
            localStorage.getItem("currentTheme") !== currentTheme
        ) {
          currentTheme = localStorage.getItem("currentTheme");
        }
        if (!currentTheme && data?.app_json_data?.theme_list) {
          currentTheme = data.app_json_data.theme_list[0].name;
        }
        // this.initTheme({
        //   currentTheme: currentTheme,
        //   themeList: data.app_json_data.theme_list || [],
        // });
      }

      return data;
    },
  }
}
</script>



<style scoped lang="scss">
.app_pre{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.app_pre_content{
  width:27.1875rem;
  height:95%;
  background: #000;
  border-radius:0.9375rem;
  margin:0.9375rem auto;
  overflow: auto;
}
</style>