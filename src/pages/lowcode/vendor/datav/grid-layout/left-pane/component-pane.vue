<template>
  <div class="component-pane">
    <div class="left">
      <div class="component-list">
        <div class="active-bg" :style="setStyle"></div>
        <div
          class="component-item"
          :class="{ active: activeIndex === index }"
          v-for="(item, index) in list"
          :key="index"
          @click="tapComponent(item, index)"
        >
          <component size="20" :is="item.icon"></component>
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
  </div>
</template>

<script>
import data from "./components.js";
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
} from "../../icons";
export default {
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
    ExtPage
  },
  computed: {
    setStyle() {
      return `top:${this.activeIndex * 70 + 10}px`;
    },
    current() {
      return this.list[this.activeIndex];
    },
  },
  created() {
    this.getList(this.current);
  },
  data() {
    return {
      list: data.list,
      activeIndex: 0,
      activeSubIndex: 0,
    };
  },
  methods: {
    tapSubType(current, item, index) {
      this.activeSubIndex = index + 1;
      this.getList(current, item);
    },
    tapComponent(item, index) {
      this.activeIndex = index;
      this.activeSubIndex = 0;
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
      const url = `${window.backendIpAddr}/config/select/${item.service}`;
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
        page: { pageNo: 1, rownumber: 10 },
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
        this.$emit(
          "set-list",
          res.data.data.map((ele) => {
            return {
              ...ele,
              com_type: item.value,
              comp_label: ele[item.nameCol],
            };
          })
        );
      } else {
        this.$emit("set-list", []);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.component-pane {
  height: 100%;
  display: flex;

  .left {
    height: 100%;
  }
}

.component-list {
  padding: 10px;
  border-right: 1px solid #eee;
  position: relative;
  display: inline-block;
  height: 100%;

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

.component-item {
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
</style>
