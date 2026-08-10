<template>
  <!-- 在线地图容器 -->
  <div class="online-map-view">
    <!-- 地图显示容器 -->
    <div :id="mapId" class="map-container"></div>

    <!-- 地图图例 -->
    <div class="map-legend" v-if="iconJson.length > 0">
      <div
        v-for="item in iconJson"
        :key="item.legend_label"
        class="legend-wrap"
      >
        <img loading="lazy" :src="getImagePath(item.icon)" class="legend-icon" />
        <span class="legend-text">{{ item.legend_label || "" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 在线地图组件 - 支持腾讯地图、百度地图等在线地图服务
 *
 * @component OnlineMapView
 * @description
 * 在线地图展示组件，支持以下特性：
 *
 * @features
 * - 🗺️ 多种在线地图底图支持（腾讯地图、百度地图等）
 * - 📍 标记点展示和交互
 * - 🎨 自定义图例和样式
 * - 📱 响应式设计
 * - 🔧 动态配置支持
 *
 * @example
 * <online-map-view
 *   :page-item="pageItemConfig"
 *   @select="handleMapSelect"
 * />
 */

import { onMounted, ref, computed, onUnmounted } from "vue";
import { getImagePath } from "@/common/http"; // 图片路径处理工具
import {
  initMapData,
  generateMapID,
  initMap,
} from "@/pages/lowcode/vendor/datav/common/functions/mapUtils.js"; // 地图工具函数

/**
 * 组件 Props 定义
 */
const props = defineProps({
  pageItem: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  comNo: {
    type: String,
    required: true,
    default: "",
  },
  mapJson: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(['select']);

const mapBaseSupplier = computed(() => {
  return mapJson.value.map_base_supplier || "";
});

/**
 * 地图相关状态变量
 */
const mapInstance = ref(null); // 地图实例对象
const mapId = ref(""); // 地图容器 ID
const iconJson = ref([]); // 地图图例配置数组
const markerInfo = ref({}); // 标记点信息对象

/**
 * 初始化腾讯地图
 * 动态加载腾讯地图 API 脚本并初始化地图实例
 *
 * @function initTencentMap
 * @description
 * - 动态创建并加载腾讯地图 API 脚本
 * - 生成唯一的地图容器 ID
 * - 延迟初始化地图实例和数据
 * - 处理地图标记点和图例数据
 */
const initTencentMap = () => {
  // 检查是否已经加载过腾讯地图 API
  if (window.TMap) {
    // 如果已经加载，直接初始化地图
    initMapInstance();
    return;
  }

  // 动态加载腾讯地图 API 脚本
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://map.qq.com/api/gljs?v=1.exp&key=G3VBZ-CKMKB-4CFUZ-JZLSE-676K6-J4FWP";
  
  // 脚本加载完成后初始化地图
  script.onload = () => {
    initMapInstance();
  };
  
  script.onerror = () => {
    console.error("腾讯地图 API 加载失败");
  };
  
  document.head.appendChild(script);
};

/**
 * 初始化地图实例
 * 创建地图实例并加载相关数据
 */
const initMapInstance = () => {
  // 生成唯一的地图容器 ID
  mapId.value = generateMapID(props.comNo, "online-map-container");

  // 延迟初始化，确保 DOM 已渲染
  setTimeout(() => {
    try {
      // 初始化地图实例
      mapInstance.value = initMap(mapId.value, props.pageItem);
      
      // 初始化地图数据
      initMapData(mapInstance.value, props.pageItem).then((markerData) => {
        markerInfo.value = markerData;
        
        if (markerData.iconJson) {
          iconJson.value = markerData.iconJson; // 设置图例数据
        }
        
        // 处理标记点选择事件
        if (markerData?.markers) {
          // 为标记点添加点击事件监听
          markerData.markers.forEach(marker => {
            marker.on('click', (event) => {
              handleMarkerSelect(marker.getData());
            });
          });
        }
        
        console.log("在线地图初始化完成");
      }).catch(error => {
        console.error("地图数据初始化失败:", error);
      });
    } catch (error) {
      console.error("地图实例初始化失败:", error);
    }
  }, 100);
};

/**
 * 初始化百度地图
 * 动态加载百度地图 API 脚本并初始化地图实例
 */
const initBaiduMap = () => {
  // 检查是否已经加载过百度地图 API
  if (window.BMap) {
    initBaiduMapInstance();
    return;
  }

  // 动态加载百度地图 API 脚本
  const script = document.createElement("script");
  script.type = "text/javascript";
  const baiduAk = window.APP_CONFIG && (window.APP_CONFIG.appKey || window.APP_CONFIG.RouteAK);
  if (!baiduAk) {
    console.error("百度地图 AK 未配置");
    return;
  }
  script.src = `https://api.map.baidu.com/api?v=3.0&ak=${baiduAk}`;
  
  script.onload = () => {
    initBaiduMapInstance();
  };
  
  script.onerror = () => {
    console.error("百度地图 API 加载失败");
  };
  
  document.head.appendChild(script);
};

/**
 * 初始化百度地图实例
 */
const initBaiduMapInstance = () => {
  mapId.value = generateMapID(props.pageItem?.com_no, "baidu-map-container");
  
  setTimeout(() => {
    try {
      // 创建百度地图实例
      const map = new BMap.Map(mapId.value);
      const point = new BMap.Point(
        mapJson.value.map_center_lng || 116.404,
        mapJson.value.map_center_lat || 39.915
      );
      
      map.centerAndZoom(point, mapJson.value.map_zoom || 11);
      map.enableScrollWheelZoom(true);
      
      mapInstance.value = map;
      console.log("百度地图初始化完成");
    } catch (error) {
      console.error("百度地图实例初始化失败:", error);
    }
  }, 100);
};

/**
 * 处理标记点选择事件
 * @param {Object} markerData - 标记点数据
 */
const handleMarkerSelect = (markerData) => {
  console.log("标记点被选中:", markerData);
  emit('select', markerData);
};

/**
 * 根据地图供应商初始化对应的地图
 */
const initOnlineMap = () => {
  switch (mapBaseSupplier.value) {
    case "腾讯地图":
      initTencentMap();
      break;
    case "百度地图":
      initBaiduMap();
      break;
    default:
      console.warn("不支持的地图供应商:", mapBaseSupplier.value);
  }
};

/**
 * 清理地图资源
 */
const cleanupMap = () => {
  if (mapInstance.value) {
    try {
      // 清理地图实例
      if (typeof mapInstance.value.destroy === 'function') {
        mapInstance.value.destroy();
      }
      mapInstance.value = null;
    } catch (error) {
      console.error("清理地图资源失败:", error);
    }
  }
};

/**
 * 组件挂载时初始化地图
 */
onMounted(() => {
  initOnlineMap();
});

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  cleanupMap();
});
</script>

<style lang="scss" scoped>
.online-map-view {
  width: 100%;
  height: 100%;
  position: relative;
  
  .map-container {
    width: 100%;
    height: 100%;
  }

  .map-legend {
    position: absolute;
    right: 10px;
    bottom: 10px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 200px;
    
    .legend-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .legend-icon {
      width: 24px;
      height: 24px;
      margin-right: 8px;
      object-fit: contain;
    }

    .legend-text {
      color: #333;
      font-size: 12px;
      line-height: 1.4;
      flex: 1;
    }
  }
}
</style>
