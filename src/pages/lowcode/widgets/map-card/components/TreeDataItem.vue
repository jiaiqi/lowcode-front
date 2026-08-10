<template>
  <div class="tree-data-item-child-item">
    <div
      class="tree-data-item-child-item-name"
      :class="{
        active: selected && item.id && selected.id === item.id,
      }"
      :style="{ paddingLeft: `${(level + 1) * 20}px` }"
      @click.stop="onTap(item)"
    >
      <i
        v-if="(item.children && item.children.length) || item.is_leaf !== '是'"
        class="tree-data-item-name-icon el-icon-caret-right"
        :class="{ expanded: expanded }"
        :style="{ left: `${(level + 1) * 10}px` }"
        @click.stop="toggleExpand"
      ></i>
      <span class="tree-data-item-name-text">
        {{ item.name || item.area_name }}
      </span>
    </div>
    <transition name="tree-expand">
      <div class="tree-data-item-child" v-show="expanded">
        <tree-data-item
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :selected="selected"
          :level="level + 1"
          :set-children-func="setChildrenFunc"
          @select="onTap"
        />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "TreeDataItem",
};
</script>

<script setup>
import { ref, defineEmits } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  selected: {
    type: Object,
    default: () => ({}),
  },
  level: {
    type: Number,
    default: 0,
  },
  setChildrenFunc: {
    type: Function,
    default: () => {},
  },
});

const expanded = ref(false);

function toggleExpand() {
  expanded.value = !expanded.value;
  if (
    expanded.value &&
    props.setChildrenFunc &&
    typeof props.setChildrenFunc === "function"
  ) {
    props.setChildrenFunc(props.item);
  }
}

const emit = defineEmits(["select"]);
function onTap(data) {
  if (!expanded.value) {
    toggleExpand();
  }
  emit("select", data || props.item);
}
</script>

<style lang="scss" scoped>
.tree-data-item-child-item {
  .tree-data-item-child-item-name {
    display: flex;
    align-items: center;
    position: relative;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-bottom: 1px solid #e5e5e5;
    background-color: #f8f8f8;
    line-height: 40px;

    &:last-child {
      border-bottom: none;
    }

    .tree-data-item-name-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translate(0, -50%);
      font-size: 16px;
      transition: transform 0.3s ease;
      cursor: pointer;

      &.expanded {
        transform: translate(0, -50%) rotate(90deg);
      }
    }

    .tree-data-item-name-text {
      flex: 1;
      text-align: left;
      cursor: pointer;
    }

    &.active {
      // background: linear-gradient(
      //   151.99deg,
      //   rgba(0, 122, 255, 1) 29.59%,
      //   rgba(4, 71, 171, 1) 294.82%
      // );
      border-left: 3px solid #007aff;
      background-color: #fff;
      // color: #fff;
    }
  }
}

.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
