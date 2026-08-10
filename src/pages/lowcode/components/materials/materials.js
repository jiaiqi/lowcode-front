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
    groups: [
      {
        label: "基础部件",
        icon: "ri-layout-grid-fill",
        items: [
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
          }
        ]
      },
      {
        label: "媒体部件",
        icon: "ri-image-fill",
        items: [
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
          }
        ]
      },
      {
        label: "图表部件",
        icon: "ri-bar-chart-fill",
        items: [
          {
            "label": "进度圆环",
            "value": "进度圆环",
            "parts_type": "进度圆环",
            "type": "cardPart",
            "component": "pageItem",
            "icon": "ri-donut-chart-fill",
            "_default_parts_text": "80"
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
            "label": "饼图",
            "value": "饼图",
            "parts_type": "饼图",
            "type": "chart",
            "component": "pageItem",
            "icon": "ri-pie-chart-fill",
            "_default_chart_json": {
              "chart_type": "饼图",
              "series_name_cfg": "类别",
              "series_value_cols": "value",
              "legend_disp": "右"
            }
          },
          {
            "label": "环图",
            "value": "环图",
            "parts_type": "环图",
            "type": "chart",
            "component": "pageItem",
            "icon": "ri-donut-chart-fill",
            "_default_chart_json": {
              "chart_type": "环图",
              "series_name_cfg": "类别",
              "series_value_cols": "value",
              "legend_disp": "右",
              "ring_width": "20"
            }
          }
        ]
      },
      {
        label: "功能部件",
        icon: "ri-function-fill",
        items: [
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
            "label": "天气",
            "value": "天气",
            "parts_type": "天气",
            "type": "cardPart",
            "component": "pageItem",
            "icon": "ri:sun-foggy-fill"
          },
          {
            "label": "二维码",
            "value": "二维码",
            "parts_type": "二维码",
            "type": "qrCode",
            "component": "pageItem",
            "icon": "ri-qr-code-fill"
          },
          {
            "label": "倒计时",
            "value": "倒计时",
            "parts_type": "倒计时",
            "type": "cardPart",
            "component": "pageItem",
            "icon": "ri:timer-fill"
          }
        ]
      },
      {
        label: "表单部件",
        icon: "ri-pencil-fill",
        items: [
          {
            "label": "下拉选项",
            "value": "下拉选项",
            "parts_type": "下拉选项",
            "type": "cardPart",
            "component": "pageItem",
            "_default_parts_text": "请选择",
            "icon": "ri-arrow-down-s-fill"
          },
          {
            "label": "日期选择",
            "value": "日期选择器",
            "parts_type": "日期选择器",
            "type": "cardPart",
            "component": "pageItem",
            "_default_parts_text": null,
            "icon": "ri-calendar-fill"
          },
          {
            "label": "日期范围",
            "value": "日期范围选择器",
            "parts_type": "日期范围选择器",
            "type": "cardPart",
            "component": "pageItem",
            "_default_parts_text": null,
            "icon": "ri-calendar-fill"
          },
          {
            "label": "日期时间选择",
            "value": "日期时间选择器",
            "parts_type": "日期时间选择器",
            "type": "cardPart",
            "component": "pageItem",
            "_default_parts_text": null,
            "icon": "ri-calendar-schedule-fill"
          },
          {
            "label": "日期时间范围",
            "value": "日期时间范围选择器",
            "parts_type": "日期时间范围选择器",
            "type": "cardPart",
            "component": "pageItem",
            "_default_parts_text": null,
            "icon": "ri-calendar-schedule-fill"
          }
        ]
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
    value: "描述列表",
    label: "描述列表",
    icon: "List",
    service: "srvpage_cfg_com_descriptions_select",
    nameCol: 'desc_list_name',
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
      },
       {
        label: "大华视频监控",
        value: "大华视频监控",
        icon: "ri:video-on-fill",
        type: "component"
      },
    ],
  },

]