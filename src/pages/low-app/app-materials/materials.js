export const materialsTree = [
  {
    value: "layout",
    label: "布局",
    icon: "ri-layout-masonry-fill",
    service: "srvpage_cfg_layout_select",
    nameCol: "layout_name",
  },
  {
    value: "cardPart",
    label: "部件",
    icon: "ri-star-smile-fill",
    comList: [
      {
        "label": "字符串",
        "value": "文本",
        "parts_type": "文本",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-text",
        "_default_parts_text": "字符串",
      },
      {
        "label": "数字",
        "value": "数字",
        "parts_type": "数字",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-text",
        "_default_parts_text": "数字",
      },
      {
        "label": "图片",
        "value": "图片",
        "parts_type": "图片",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-image-fill",
        // "_default_parts_img": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QBaRXhpZgAATU0AKgAAAAgABQMBAAUAAAABAAAASgMDAAEAAAABAAAAAFEQAAEAAAABAQAAAFERAAQAAAABAAAAAFESAAQAAAABAAAAAAAAAAAAAYagAACxj//bAQQQACgAKAAoACgAKwAoAC0AMgAyAC0APwBEADwARAA/AF0AVQBOAE4AVQBdAIwAZABsAGQAbABkAIwA1QCFAJsAhQCFAJsAhQDVALwA5AC5AK0AuQDkALwBUgEJAOsA6wEJAVIBhgFIATYBSAGGAdkBpwGnAdkCUwI1AlMDCgMKBBURACgAKAAoACgAKwAoAC0AMgAyAC0APwBEADwARAA/AF0AVQBOAE4AVQBdAIwAZABsAGQAbABkAIwA1QCFAJsAhQCFAJsAhQDVALwA5AC5AK0AuQDkALwBUgEJAOsA6wEJAVIBhgFIATYBSAGGAdkBpwGnAdkCUwI1AlMDCgMKBBX/wgARCAAeAB4DASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAgABBf/aAAgBAQAAAADq7ZPDPClD/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/2gAIAQIQAAAAo//EABUBAQEAAAAAAAAAAAAAAAAAAAEA/9oACAEDEAAAACT/xAAZEAEAAgMAAAAAAAAAAAAAAAABABACETH/2gAIAQEAAT8Agbias5MrCI1jb2f/xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAECAQE/AB//xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAEDAQE/AB//2Q==",
      },
      {
        "label": "字体图标",
        "value": "字体图标",
        "parts_type": "字体图标",
        "_default_parts_icon": "ri-image-circle-fill",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-image-circle-fill"
      },
      // {
      //   "label": "金额",
      //   "value": "money",
      //   "type": "cardPart",
      //   "component":"pageItem"
      // },
      // {
      //   "label": "块容器",
      //   "value": "block",
      //   "parts_type": "block",
      //   "type": "cardPart",
      //   "component": "pageItem",
      //   "icon":"ri-checkbox-blank-line"
      // },
      // {
      //   "label": "行容器",
      //   "value": "row",
      //   "parts_type": "row",
      //   "type": "cardPart",
      //   "component": "pageItem",
      //   "icon":"ri-table-2"
      // },
      // {
      //   "label": "变量",
      //   "value": "variable",
      //   "parts_type": "variable",
      //   "type": "cardPart",
      //   "component": "pageItem",
      //   "_default_parts_text": "变量",
      //   "icon":"ri-text"
      // },
      {
        "label": "星级评分",
        "value": "星级评分",
        "parts_type": "星级评分",
        "type": "cardPart",
        "component": "pageItem",
        "_default_parts_text": "3",
        "icon": "ri-star-fill"
      },
      {
        "label": "进度条",
        "value": "进度条",
        "parts_type": "进度条",
        "type": "cardPart",
        "component": "pageItem",
        "_default_parts_text": "50",
        "icon": "ri-progress-2-fill"

      },
      {
        "label": "富文本",
        "value": "富文本",
        "parts_type": "富文本",
        "type": "cardPart",
        "component": "pageItem",
        "_default_parts_text": "<b>富文本</b>",
        "icon": "ri-quote-text"
      },
      {
        "label": "时间日期",
        "value": "时间日期",
        "parts_type": "时间日期",
        "type": "cardPart",
        "component": "pageItem",
        "_default_parts_text": new Date().toLocaleString(),
        "icon": "ri-calendar-schedule-fill"
      },
      {
        "label": "视频",
        "value": "视频",
        "parts_type": "视频",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-video-fill"
      },
      {
        "label": "hls视频",
        "value": "hls视频",
        "parts_type": "hls视频",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-video-fill"
      },
      {
        "label": "音频",
        "value": "音频",
        "parts_type": "音频",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-volume-up-fill"
      },
      {
        "label": "水球图",
        "value": "水球图",
        "parts_type": "水球图",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-contrast-drop-2-line"
      },
      {
        "label": "二维码",
        "value": "二维码",
        "parts_type": "二维码",
        "type": "cardPart",
        "component": "pageItem",
        "icon": "ri-qr-code-fill"
      }
    ]
  },
  {
    value: "chart",
    label: "图表",
    cond_col: "chart_type",
    icon: "Chart",
    service: "srvpage_cfg_com_chart_select",
    nameCol: "chart_name",
    children: [
      {
        label: "折线图",
        value: "折线图",
      },
      {
        label: "柱状图",
        value: "柱状图",
      },
      {
        label: "条形图",
        value: "条形图",
      },
      {
        label: "饼图",
        value: "饼图",
      },
      {
        label: "环图",
        value: "环图",
      },
      {
        label: "雷达图",
        value: "雷达图",
      },
      {
        label: "图表地图",
        value: "地图",
      },
      // {
      //   label: "热力图",
      //   value: "热力图",
      // },
      // {
      //   label: "散点图",
      //   value: "散点图",
      // },
      {
        label: "词云图",
        value: "词云图",
      },
      {
        label: "水球图",
        value: "水球图",
      },
      // {
      //   label: "仪表盘",
      //   value: "仪表盘",
      // },
      // {
      //   label: "水球图",
      //   value: "水球图",
      // },
      // {
      //   label: "数字翻牌器",
      //   value: "数字翻牌器",
      // },
      // {
      //   label: "排行滚动表",
      //   value: "排行滚动表",
      // },
      // {
      //   label: "地图",
      //   value: "地图",
      // },
    ],
  },
  {
    value: "list",
    label: "列表",
    icon: "List",
    cond_col: "list_type",
    service: "srvpage_cfg_com_list_select",
    nameCol: 'list_name',
    children: [
      {
        label: "表格",
        value: "表格",
      },
      {
        label: "卡片",
        value: "卡片",
      },
      {
        label: "信息",
        value: "信息",
      },
    ],
  },
  {
    value: "grid",
    label: "宫格",
    icon: "Grid",
    service: "srvpage_cfg_com_grid_select",
    nameCol: 'grid_name',
  },
  {
    value: "cardGroup",
    label: "卡片组",
    icon: "Card",
    service: "srvpage_cfg_card_group_select",
    nameCol: 'cardg_name',
  },
  {
    value: "控件",
    label: "控件",
    icon: "IconText",
    service: "srvpage_cfg_meta_col_widget_select",
    nameCol: 'widget_name',
  },
  {
    value: "swiper",
    label: "轮播图",
    icon: "Pic",
    service: "srvpage_cfg_figure_swiper_select",
    nameCol: 'swiper_name',
  },
  // {
  //   value: "videoCard",
  //   label: "视频卡片",
  //   icon: "Video",
  //   service: "srvpage_cfg_com_video_card_select",
  //   nameCol:'video_card_name',
  // },
  // {
  //   value: "richTextCard",
  //   label: "图文卡片",
  // },
  {
    value: "map",
    label: "地图",
    icon: "Map",
    service: "srvpage_cfg_com_map_select",
    nameCol: 'map_name',
  },
  {
    value: "currentInfo",
    label: "个人信息",
    icon: "Avatar",
    service: "srvpage_cfg_com_current_info_select",
    nameCol: 'current_info_name',
  },
  // {
  //   value: "userList",
  //   label: "用户列表卡",
  // },
  // {
  //   value: "addrcard",
  //   label: "地址卡",
  // },
  {
    value: "noticeBar",
    label: "通知条",
    icon: "Notice",
    service: "srvpage_cfg_com_notice_bar_select",
    nameCol: 'noticebar_name',
  },
  // {
  //   value: "steps",
  //   label: "步骤条",
  // },
  {
    value: "tabs",
    label: "标签tabs",
    icon: "Tag",
    service: "srvpage_cfg_com_tabs_select",
    nameCol: 'tabs_name',
  },
  {
    value: "form",
    label: "表单form",
    icon: "Form",
    service: "srvpage_cfg_com_form_select",
    nameCol: 'form_name',
  },
  {
    value: "navBar",
    label: "导航菜单",
    icon: "NavBar",
    service: "srvpage_cfg_page_nav_bar_select",
    nameCol: 'nav_name',
  },
  {
    value: "extPage",
    label: "外部页面",
    icon: "ExtPage",
    service: "srvpage_cfg_com_ext_page_select",
    nameCol: 'extp_name',
  },
  {
    value: "others",
    label: "其它",
    icon: "ri-sun-fill",
    comList: [
      {
        label: "悬浮组件",
        value: "悬浮组件",
        icon: "ri-radio-button-fill",
        type: "悬浮组件"
      },
      {
        value: "详情组件",
        label: "详情组件",
        icon: "List",
        type: "component"
      },
      {
        label: "咨询入口",
        value: "咨询入口",
        icon: "ri-radio-button-fill",
        type: "咨询入口"
      }
    ],
  },

]