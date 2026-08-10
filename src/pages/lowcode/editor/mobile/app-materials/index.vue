<template>
  <div class="materia-warp">
    <!-- 移除旧的折叠按钮 -->
    <div class="left">
      <div class="type-list">
        <div class="active-bg" :style="setStyle"></div>
        <div
            class="type-item"
            :class="{ active: activeIndex === index }"
            v-for="(item, index) in materialsTree"
            :key="index"
            @click="tapComponent(item, index)"
        >
          <Icon
              v-if="item.icon && item.icon.startsWith('ri-')"
              :icon="item.icon"
              style="font-size: 20px"
          ></Icon>
          <component
              size="20"
              :is="item.icon"
              v-else-if="item.icon"
          ></component>
          <span class="label">{{ item.label }}</span>
        </div>
      </div>
    </div>
    <div
        class="sub-type"
        v-if="current && current.children && current.children.length"
    >
      <div
          class="sub-type-item"
          :class="{ active: activeSubIndex === 0 }"
          @click="(activeSubIndex = 0), (activeSubIndex = 0), getList(current)"
      >
        所有
      </div>
      <div
          class="sub-type-item"
          v-for="(item, index) in current.children"
          :key="index"
          @click="tapSubType(current, item, index)"
          :class="{ active: activeSubIndex && activeSubIndex - 1 === index }"
      >
        {{ item.label }}
      </div>
    </div>
    <div
        class="component-list"
        v-if="current && current.comList && current.comList.length"
    >
      <div
          v-for="item in current.comList"
          :key="item.value"
          :id="item.value"
          class="com-item margin component cursor-move"
          :class="[`type-${item.type}`, { 'only-text': !item.preview }]"
          @dragstart="handleDragStart($event, item)"
          draggable="true"
          unselectable="on"
      >
        <img
            :src="getImagePath(item.preview)"
            alt=""
            class="example"
            v-if="item.preview"
        />

        <div class="label">{{ item.label }}</div>
        <div class="icon" v-if="item.icon">
          <Icon :icon="item.icon"></Icon>
        </div>
      </div>
    </div>
    <div class="component-list" v-if="comList && comList.length">
      <div
          v-for="item in comList"
          :key="item.id"
          :id="item.id"
          class="com-item margin component cursor-move"
          :class="[
          `type-${item.type}`,
          { 'only-text': !item.icon && !item.preview },
        ]"
          @dragstart="handleDragStart($event, item)"
          draggable="true"
          unselectable="on"
      >
        <img
            :src="getImagePath(item.preview)"
            alt=""
            class="example"
            v-if="item.preview"
        />
        <div class="label">{{ item.comp_label }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import cloneDeep from "lodash/cloneDeep";
import dragStore from "./store/dragStore"
import { materialsTree } from "./materials";
import { pageCompCols } from "./property/columns";
import { Icon } from "@iconify/vue2";
import {
  Card,
  Chart,
  Form,
  Grid,
  List,
  Map,
  Notice,
  Pic,
  Tag,
  Text,
  Video,
  NavBar,
  ExtPage,
  Layout,
  Avatar,
} from "@/components/icons";
export default {
  name: "lowcode-materials",
  components: {
    Card,
    Chart,
    Form,
    Grid,
    List,
    Map,
    Notice,
    Pic,
    Tag,
    IconText: Text,
    Video,
    NavBar,
    ExtPage,
    Layout,
    Avatar,
    Icon,
  },
  data() {
    return {
      // 移除 unfold 属性，由父组件控制
      // 物料列表
      activeIndex: 0,
      activeSubIndex: 0,
      materialsTree: materialsTree.filter(item => item.value !== 'layout'),
      comList: [],
      //
      list: [
        {
          id: "1", // 组件ID，唯一标识
          type: "button", // 组件类型，用于区分组件
          component: "el-button", // 组件类型，用于区分组件
          name: "按钮", // 组件名称，用于显示在编辑器中
        },
        {
          id: "2",
          type: "input",
          component: "el-input",
          name: "输入框",
        },
        {
          id: "3",
          type: "select",
          component: "el-select",
          name: "下拉选择",
        },
        {
          id: "4",
          type: "layout",
          component: "lc-block",
          subType: "layout-1-2",
          name: "两列布局",
        },
        {
          id: "5",
          type: "layout",
          component: "lc-block",
          subType: "layout-1-3",
          name: "三列布局",
        },
        {
          id: "6",
          type: "container",
          component: "lc-container",
          name: "容器",
        },
        // 新增布局类型
        {
          id: "7",
          type: "layout",
          component: "lc-block",
          subType: "layout-1-4",
          name: "四列布局",
        },
        {
          id: "8",
          type: "layout",
          component: "lc-block",
          subType: "layout-2-2-3070",
          name: "两列布局(3:7)",
        },
        {
          id: "9",
          type: "layout",
          component: "lc-block",
          subType: "layout-2-2-7030",
          name: "两列布局(7:3)",
        },
      ],
    };
  },
  computed: {
    setStyle() {
      return `top:${this.activeIndex * 70 + 10}px`;
    },
    current() {
      return this.materialsTree[this.activeIndex];
    },
  },
  created() {
    this.getList(this.current);
  },
  mounted() {
    // 添加全局拖拽结束事件监听
    document.addEventListener("dragend", this.handleGlobalDragEnd);
  },

  beforeDestroy() {
    // 移除全局事件监听
    document.removeEventListener("dragend", this.handleGlobalDragEnd);
  },
  methods: {
    tapSubType(current, item, index) {
      this.activeSubIndex = index + 1;
      this.getList(current, item);
    },
    clearComponent() {
      this.activeIndex = -1;
      this.activeSubIndex = 0;
      this.comList = [];
      this.$emit("set-list", []);
    },
    tapComponent(item, index) {
      // 点击物料列表项
      if (this.activeIndex === index) return this.clearComponent();
      this.activeIndex = index;
      this.activeSubIndex = 0;
      if (!item.service) {
        // 内置组件,不需要从服务端查
        if (item.value === "others" || item.value === "cardPart") {
          this.comList = [];
          return;
        }
      }
      if (!item.children?.length) {
        this.getList(item);
      } else {
        this.getList(item);
      }
    },
    async getList(item, subType) {
      if (!item) {
        return;
      }
      const url = `/config/select/${item.service}`;
      const req = {
        serviceName: item.service,
        colNames: ["*"],
        condition: [
          {
            colName: "sys_option",
            ruleType: "like",
            value: "模板",
          },
        ],
        page: { pageNo: 1, rownumber: 50 },
        use_type: "list",
        query_source: "list_page",
      };
      if (subType?.value) {
        req.condition = [
          ...req.condition,
          {
            colName: item.cond_col,
            ruleType: "eq",
            value: subType.value,
          },
        ];
      }
      const res = await this.$http.post(url, req);
      if (res?.data?.state === "SUCCESS") {
        const list = res.data.data.map((ele) => {
          let obj = {
            ...ele,
            com_type: item.value,
            component: item.value,
            comp_label: ele[item.nameCol],
          };
          if (item.value === "layout") {
            if (ele[item.nameCol] === "页面容器") {
              obj.type = "container";
              obj.component = "lc-container";
              obj.layout_party = "页面";
              obj.com_name = ele[item.nameCol] || "页面容器";
            } else if (ele[item.nameCol]?.indexOf("布局容器") === 0) {
              obj.type = "layout";
              obj.component = "lc-block";
              obj.layout_party = "布局";
              obj.com_name = ele[item.nameCol] || "布局容器";
            }
          } else {
            obj.type = "component";
            obj._type = "component";
            obj.component = "page-item";
            if (ele.com_option?.includes("悬浮可拖动")) {
              obj.component = "float-component";
            }
            obj.data = this.initComCfg(obj.com_type, obj);
            if (obj.data.srv_req_type) {
              obj.srv_req_type = obj.data.srv_req_type;
              obj.mock_srv_data_json = JSON.stringify(
                  obj.data.mock_srv_data_json
              );
            }
          }

          return obj;
        });
        this.$emit("set-list", list);
        this.comList = list;
      } else {
        this.$emit("set-list", []);
      }
    },
    initComCfg(type, config) {
      // 初始化组件配置
      config = cloneDeep(config);
      switch (type) {
        case "chart":
          if (config.row_json) {
            config.chart_json = JSON.parse(config.row_json);
          }
          break;
        case "cardGroup":
          if (config.row_json) {
            const cfg = JSON.parse(config.row_json);
            config.card_group_json = cfg;
          }
          break;
        case "list":
          if (config.list_json) {
            const cfg = JSON.parse(config.list_json);
            config.list_json = cfg;
            if (cfg.mock_data_json) {
              config.mock_srv_data_json = cfg.mock_data_json;
              config.srv_req_type = "模拟数据";
            }
            if (cfg.list_type === "卡片") {
              config.card_group_json = {
                card_unit_json: cfg.card_unit_json,
                card_layout_json: cfg.layout_json,
                interface_json: cfg.interface_json,
              };
            }
            if (cfg?.default_srv_req_json) {
              config.srv_req_json = cfg?.default_srv_req_json;
            }
          }
          break;
        case "widget":
        case "控件":
          if (config.row_json) {
            config.widget_json = JSON.parse(config.row_json);
          }
          break;
        case "swiper":
          if (config.figure_row_json) {
            try {
              config.swiper_json = JSON.parse(config.figure_row_json);
            } catch (error) {}
          }
          break;
        case "map":
          if (config.row_json) {
            config.map_json = JSON.parse(config.row_json);
            if (config.map_json?.srv_req_json) {
              config.srv_req_json = config.map_json?.srv_req_json;
            }
            if (config.map_json?.cols_map_json) {
              config.cols_map_json = config.map_json?.cols_map_json;
            }
            if (config.map_json?.interface_json) {
              config.interface_json = config.map_json?.interface_json;
            }
          }
          break;
        case "tabs":
          if (config.row_json) {
            config.tabs_json = JSON.parse(config.row_json);
          }
          break;
        case "form":
          if (config.row_json) {
            config.form_json = JSON.parse(config.row_json);
          }
          break;
        case "noticeBar":
          if (config.row_json) {
            config.notice_bar_json = JSON.parse(config.row_json);
          }
          break;
      }
      Object.keys(config).forEach((key) => {
        if (!pageCompCols.includes(key)) {
          delete config.key;
        }
        if (
            key &&
            config[key] &&
            key?.includes("_json") &&
            key.lastIndexOf("_json") === key.length - 5
        ) {
          try {
            if(typeof config[key] ==='string'){
              config[`${key}_data`] = JSON.parse(config[key]);
            }else {
              config[`${key}_data`]=config[key]
            }
          } catch (e) {
            //TODO handle the exception
            console.error("解析JSON数据失败:", e);
          }
        }
      });

      // 去掉没用的属性
      const keys = ["component", "type", "_type", "id"];
      keys.forEach((key) => {
        if (config[key]) {
          delete config[key];
        }
      });
      return JSON.parse(JSON.stringify(config));
    },
    //
    onEnd(val) {
      console.log("end", val);
    },
    handleDragStart(e, item) {
      // 设置拖拽数据
      const dragData = {
        type: item.type || 'component',
        component: item.component || 'page-item',
        com_type: item.com_type || item.type,
        comp_label: item.comp_label || item.label || item.name,
        layout_width: item.layout_width || 200,
        layout_height: item.layout_height || 100,
        data: item.data || {}
      }

      console.log('Drag data:', dragData) // 添加日志

      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));

      // 设置组件类型到全局状态
      dragStore.setDragType(item.type || 'component');
      // 设置拖拽元素数据
      dragStore.setDraggingElement(dragData);

      // 设置拖拽效果
      e.dataTransfer.effectAllowed = "copy";
      // 创建自定义拖拽图像（可选）
      const dragIcon = document.createElement("div");
      dragIcon.innerHTML = item.name || item.label || item.comp_label;
      dragIcon.className = "drag-icon";
      document.body.appendChild(dragIcon);
      e.dataTransfer.setDragImage(dragIcon, 0, 0);
      this.$emit("drag-start", item);
      // 延迟移除拖拽图像
      setTimeout(() => {
        document.body.removeChild(dragIcon);
      }, 0);
    },

    // 全局拖拽结束处理
    handleGlobalDragEnd() {
      // 清除拖拽状态
      dragStore.clearDragType();
      // 清除所有拖拽样式
      document
          .querySelectorAll(
              ".editor-drag-over, .editor-drag-not-allowed, .drag-over, .drag-not-allowed"
          )
          .forEach((el) => {
            el.classList.remove("editor-drag-over");
            el.classList.remove("editor-drag-not-allowed");
            el.classList.remove("drag-over");
            el.classList.remove("drag-not-allowed");
          });
      this.$emit("drag-end");
    },
  },
};
</script>

<style scoped lang="scss">
.materia-warp {
  height: 100%;
  display: flex;
  position: relative;
  width: 100%;

  // 移除旧的折叠相关样式
  .left {
    height: 100%;
    overflow: hidden;
  }
}

.type-list {
  padding: 10px;
  border-right: 1px solid #eee;
  position: relative;
  display: inline-block;
  height: 100%;
  overflow-y: auto;
  // 优化滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
    cursor: move;
  }
  .active-bg {
    position: absolute;
    left: 10px;
    width: 60px;
    height: 60px;
    background-color: #e6f7ff;
    border-radius: 6px;
    top: 0;
    transition: top 0.3s ease-in-out;
    z-index: -1;
  }
}

.type-item {
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  border-radius: 5px;
  z-index: 1;
  margin-bottom: 10px;
  cursor: pointer;

  .label {
    margin-top: 5px;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    // background-color: #e6f7ff;
    &:hover {
      background-color: unset;
    }

    color: #007aff;
  }
}

.sub-type {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-right: 1px solid #f5f5f5;
  &-item {
    font-size: 14px;
    padding: 3px 5px;
    text-align: center;
    margin: 5px 0;
    cursor: pointer;
    border-radius: 6px;
    width: 70px;

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      background-color: #e6f7ff;
      color: #007aff;
    }
  }
}
.component-list {
  // display: flex;
  // flex-direction: column;
  padding: 5px;
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #fff;
  width: 200px;
  height: 100%;

  // 移除旧的折叠相关样式

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .com-item {
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    margin: 5px 0;
    min-height: 130px;
    border-radius: 8px;
    border: none;
    overflow: hidden;
    cursor: unset;
    // box-shadow:0 2px 6px 0 rgba(0,0,0,.2);
    border: 1px solid #ccc;
    background-color: #f1f1f1;
    cursor: move;
    &.only-text {
      height: 50px;
      min-height: 50px;
      display: flex;
      justify-content: space-between;
      flex-direction: row;
      align-items: center;
      padding: 0 10px;
    }
    &[class^="type-"] {
      border: none;
      border-left: 3px solid #17d57e;
      border-radius: 0;
    }
    &.type-container {
      border: none;
      border-left: 3px solid #ff740e;
      border-radius: 0;
    }

    &.type-layout {
      border: none;
      border-left: 3px solid #2c48ff;
      border-radius: 0;
    }

    .example {
      flex: 1;
      background-color: #ccc;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      transition: scale 0.3s ease-in-out;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 36px;
      &:hover {
        scale: 1.1;
      }
    }

    .label {
      width: calc(100% - 0px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 5px;
    }
  }
}
.public-component {
  width: 100px;
}
</style>
