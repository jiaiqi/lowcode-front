import { $http, getImagePath, isValidResponse } from "@/common/http.js";

import coordtransform from "../coordtransform.js";

/**
 * 生成地图id
 * @param {string} id -默认id
 * @param {string} prefix -前缀
 * @returns {string} -生成的id
 */
export function generateMapID(id, prefix) {
  let mapId = "";
  if (id) {
    mapId += `${prefix}-${id}`;
  } else {
    mapId += `${prefix}-${new Date().getTime()}`;
  }
  return mapId;
}

/**
 * 初始化腾讯地图
 * @param {string} id 地图容器id
 * @param {object} pageItem
 * @returns {object} -腾讯地图实例
 */
export function initMap(id, pageItem) {
  let mapInstance = null;
  //定义地图中心点坐标
  const centerPoint = [
    pageItem?.map_json.center_lat || 34.21544,
    pageItem?.map_json.center_lon || 108.912218,
  ];
  const center = new TMap.LatLng(...centerPoint);

  //定义map变量，调用 TMap.Map() 构造函数创建地图
  mapInstance = new TMap.Map(document.getElementById(id), {
    center: center, //设置地图中心点坐标
    zoom: 17.2, //设置地图缩放级别
    pitch: 43.5, //设置俯仰角
    rotation: 45, //设置地图旋转角度
    mapStyleId: "2", //设置地图样式id
  });
  return mapInstance;
}

/**
 *
 * @param {*} p -后台配置的请求参数
 * @param {*} data_coordinate -地图使用的坐标系
 * @param {*} sn -车辆定位sn
 * @param {*} start_time 轨迹开始时间
 * @param {*} end_time 轨迹结束时间
 * @returns
 */
export async function getMapTravelData(
  p,
  data_coordinate,
  sn,
  start_time,
  end_time
) {
  if (!p.serviceName || !p.mapp) return;
  const url = `/${p.mapp}/select/${p.serviceName}`;
  let req = {
    serviceName: p.serviceName,
    colNames: p.colNames,
  };
  if (p.page) {
    req.page = p.page;
  }
  if (p.order) {
    req.order = p.order;
  }
  if (sn) {
    req.condition = [
      {
        colName: "sn",
        ruleType: "eq",
        value: sn,
      },
    ];
  } else {
    req.condition = p.condition || [];
  }

  if (start_time && end_time) {
    req.condition = [
      ...req.condition,
      {
        colName: "occur_date",
        ruleType: "ge",
        value: start_time,
      },
      {
        colName: "occur_date",
        ruleType: "le",
        value: end_time,
      },
    ];
  }
  const res = await $http.post(url, req);
  if (isValidResponse(res)) {
    // 轨迹图
    const data = res.data.data.reverse();
    let points = [];
    data.map((item, index) => {
      if (data_coordinate === "地球WGS84") {
        // 转换坐标系
        const [lng, lat] = coordtransform.wgs84togcj02(item.lng, item.lat);

        item.lng = lng;
        item.lat = lat;
      }
      if (item.lat && item.lng) {
        let obj = {
          ...item,
          width: 35,
          height: 35,
          id: new Date().getTime() + index,
        };
        obj.latitude = item.lat;
        obj.longitude = item.lng;
        points.push(obj);
      }
    });

    // 起始点
    let start = points[0];
    start.id = 1;
    start.width = 35;
    start.height = 35;
    // start.iconPath = "../../static/icon_position.png";
    start.customCallout = {
      anchorY: 0,
      anchorX: 0,
      display: "BYCLICK",
    };

    // 结束点
    let end = points[points.length - 1];
    end.id = 3;
    end.width = 35;
    end.height = 35;
    // end.iconPath = "../../static/icon_position.png";
    end.customCallout = {
      anchorY: 0,
      anchorX: 0,
      display: "BYCLICK",
    };

    return {
      points,
      start,
      end,
    };
  }
}

/**
 * 查找标记点列表
 * @param {object} p - 请求参数
 * @param { object} pageItem -配置数据
 * @returns {object}
 */
export const getMarkerList = async (pageItem) => {
  const p = pageItem?.srv_req_json;

  if (!p.serviceName || !p.mapp) return;
  const url = `/${p.mapp}/select/${p.serviceName}`;
  const req = {
    serviceName: p.serviceName,
    colNames: p.colNames,
  };
  // 图标数据
  const iconJson = pageItem?.map_json.icon_json || [];

  const res = await $http.post(url, req);

  if (isValidResponse(res, true)) {
    // 地图标记
    const data = res.data.data;
    const markers = data
      .filter((e) => e.last_lat && e.last_lon)
      .map((item, index) => {
        if (item.last_lat && item.last_lon) {
          const obj = {};
          obj.id = index + 1 + "" + new Date().getTime();
          obj.latitude = item.last_lat;
          obj.longitude = item.last_lon;
          obj.iconPath = getImagePath(pageItem.map_json.icon_default);
          if (iconJson.length > 0) {
            iconJson.forEach((subItem) => {
              if (subItem.col_val === item.trans_status) {
                obj.iconPath = getImagePath(subItem.icon);
              }
            });
          }
          obj.width = 48;
          obj.height = 50;
          obj.customCallout = {
            anchorY: 0,
            anchorX: 0,
            display: "BYCLICK",
          };
          const newObj = Object.assign(obj, item);
          return newObj;
        }
      });
    // .filter((e) => e.last_lat && ie.last_lon);

    return {
      markers,
      center: {
        latitude: pageItem.map_json.center_lat,
        longitude: pageItem.map_json.center_lon,
      },
      mapName: pageItem.map_json.map_name,
      scale: pageItem.map_json.scale,
      iconJson,
    };
  }
};

/**
 * 设置地图标记点
 * @param {*} map
 * @param {*} pageItem
 * @returns
 */
export const initMapData = async (map, pageItem) => {
  if (pageItem?.srv_req_json) {
    const params = pageItem.srv_req_json;
    if (pageItem.map_json.map_type === "轨迹") {
      const { points, start, end } = await getMapTravelData(
        params,
        pageItem.map_json.data_coordinate
      );
      const polylineResult = {
        arrowLine: true,
        color: "#3591FC",
        width: 3,
        points: [],
      };
      polylineResult.points = points.map((item) => {
        return {
          latitude: item.latitude,
          longitude: item.longitude,
        };
      });
      includePoints(map, points); //设置缩放，包含所有标记点
      setCarMoveAlong(map, points); // 设置小车移动轨迹
      createPolyline(map, points); // 画折线
      return points;
    } else {
      const markerData = await getMarkerList(pageItem); // 查找所有标记点
      includePoints(map, markerData.markers); //设置缩放，包含所有标记点
      createMarkers(map, markerData);
      return markerData;
    }
  }
};

/**
 *marker轨迹回放
 * @param {object} map -地图实例
 * @param {Array} points -标记点合集
 * @param {boolean} isMoveAlong - 小车是否移动
 */
export const setCarMoveAlong = (map, points, isMoveAlong = false) => {
  //小车移动路线
  const path = points.map((item) => {
    return new TMap.LatLng(item.latitude, item.longitude);
  });
  const start = [points[0].latitude, points[0].longitude];
  const end = [
    points[points.length - 1].latitude,
    points[points.length - 1].longitude,
  ];

  //创建mareker（小车）
  var marker = new TMap.MultiMarker({
    map,
    styles: {
      //样式设置
      "car-down": new TMap.MarkerStyle({
        width: 40, //小车图片宽度（像素）
        height: 40, //高度
        anchor: {
          //图片中心的像素位置（小车会保持车头朝前，会以中心位置进行转向）
          x: 20,
          y: 20,
        },
        faceTo: "map", //取’map’让小车贴于地面，faceTo取值说明请见下文图示
        rotate: 180, //初始小车朝向（正北0度，逆时针一周为360度，180为正南）
        src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/car.png", //小车图片（图中小车车头向上，即正北0度）
      }),
      start: new TMap.MarkerStyle({
        width: 25,
        height: 35,
        anchor: { x: 16, y: 32 },
        src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/start.png",
      }),
      end: new TMap.MarkerStyle({
        width: 25,
        height: 35,
        anchor: { x: 16, y: 32 },
        src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/end.png",
      }),
    },
    geometries: [
      {
        id: "car",
        styleId: "car-down", //绑定样式
        position: new TMap.LatLng(...end), //初始坐标位置
      },
      {
        id: "start",
        styleId: "start",
        position: new TMap.LatLng(...start),
      },
      {
        id: "end",
        styleId: "end",
        position: new TMap.LatLng(...end),
      },
    ],
  });

  if (isMoveAlong) {
    //调用moveAlong，实现小车移动
    marker.moveAlong(
      {
        car: {
          //设置让"car"沿"path"移动，速度70公里/小时
          path,
          speed: 70,
        },
      },
      {
        autoRotation: true, //车头始终向前（沿路线自动旋转）
      }
    );
  }
};

/**
 * 缩放地图显示范围包含所有点
 * @param {object} map -地图实例
 * @param {Array} points -标记点合集
 */
export function includePoints(map, points = []) {
  //假设您有一组坐标点
  var coords = points
    .filter((item) => item && item.latitude && item.longitude)
    .map((item) => new TMap.LatLng(item.latitude, item.longitude));
  //创建LatLngBounds实例
  var latlngBounds = new TMap.LatLngBounds();
  //将坐标逐一做为参数传入extend方法，latlngBounds会根据传入坐标自动扩展生成
  for (var i = 0; i < coords.length; i++) {
    latlngBounds.extend(coords[i]);
  }
  //调用fitBounds自动调整地图显示范围
  map.fitBounds(latlngBounds, {
    padding: 100,
  });
}

/**
 * 在地图上根据传入的点画折线
 * @param {object} map -地图实例
 * @param {Array} points -标记点合集
 */
export function createPolyline(map, points) {
  const paths = points.map(
    (item) => new TMap.LatLng(item.latitude, item.longitude)
  );
  var polylineLayer = new TMap.MultiPolyline({
    id: "polyline-layer", //图层唯一标识
    map: map, //设置折线图层显示到哪个地图实例中
    //折线样式定义
    styles: {
      style_blue: new TMap.PolylineStyle({
        color: "#3777FF", //线填充色
        width: 6, //折线宽度
        // borderWidth: 5, //边线宽度
        // borderColor: "#FFF", //边线颜色
        showArrow: true, // 是否沿线方向展示箭头
        arrowOptions: {
          width: 8,
          height: 5,
          space: 80,
        },
        lineCap: "butt", //线端头方式
      }),
    },
    //折线数据定义
    geometries: [
      {
        //第1条线
        id: "pl_1", //折线唯一标识，删除时使用
        styleId: "style_blue", //绑定样式名
        paths: [...paths],
      },
    ],
  });
  return polylineLayer;
}

/**
 * 在地图上创建标记点
 * @param {object} map -地图实例
 * @param {Array} markerData -标记点数据
 */
export function createMarkers(map, markerData) {
  var markerArr = markerData.markers.map((item) => {
    return {
      id: item.id,
      styleId: "marker" + item.id,
      position: new TMap.LatLng(item.latitude, item.longitude),
      properties: {
        title: "marker1",
      },
    };
  });
  var styles = {};
  markerData.markers.forEach((item) => {
    styles[`marker${item.id}`] = new TMap.MarkerStyle({
      width: 48,
      height: 50,
      anchor: { x: 16, y: 32 },
      src:
        item.iconPath ||
        "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png",
    });
  });
  //初始化marker
  var marker = new TMap.MultiMarker({
    id: "marker-layer",
    map: map,
    styles,
    geometries: markerArr,
  });

  //初始化
  var bounds = new TMap.LatLngBounds();

  //设置自适应显示marker
  function showMarker() {
    //判断标注点是否在范围内
    markerArr.forEach(function (item) {
      //若坐标点不在范围内，扩大bounds范围
      if (bounds.isEmpty() || !bounds.contains(item.position)) {
        bounds.extend(item.position);
      }
    });
    //设置地图可视范围
    map.fitBounds(bounds, {
      padding: 100, // 自适应边距
    });
  }
}
