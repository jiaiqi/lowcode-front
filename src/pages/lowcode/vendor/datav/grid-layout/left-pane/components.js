export default {
  list: [
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
        // {
        //   label: "组合图",
        //   value: "组合图",
        // },
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
    // {
    //   value: "currentInfo",
    //   label: "当前信息卡",
    // },
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
    // {
    //   value: "detail",
    //   label: "详情",
    // },
  ],
};
