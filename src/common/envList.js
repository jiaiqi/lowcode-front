/**
 * 环境配置列表
 *
 * 所有环境配置集中管理，提交到 git。
 * 个人本地覆盖通过 .env.local 的 VUE_APP_DEFAULT_ENV 指定环境名即可。
 *
 * 切换方式（优先级从高到低）：
 *   1. URL 参数：?env=parkDev（仅开发环境生效）
 *   2. sessionStorage：sessionStorage.setItem('dev_env', 'parkDev')
 *   3. .env.local：VUE_APP_DEFAULT_ENV=parkDev
 *   4. .env 默认值：VUE_APP_DEFAULT_ENV=dev
 */
export const pathConfigMap = {
  // ==================== 开发环境 ====================
  dev: {
    name: '本地开发',
    gateway: 'http://192.168.0.54:8104',
    sso_app: 'sso',
    application: 'hsprl',
  },
  dev2: {
    name: '开发环境2',
    gateway: 'http://192.168.0.155:180',
    sso_app: 'sso',
    application: 'sapp',
  },
  dev3: {
    name: '宝博/试飞/低空/电建',
    gateway: 'http://172.17.2.194/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'bboa',
  },
  dev4: {
    name: '配置开发',
    gateway: 'http://192.168.0.209/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'config',
  },
  '110': {
    name: '110开发',
    gateway: 'http://192.168.0.110:180',
    sso_app: 'sso',
    application: 'bms',
  },
  '244': {
    name: '244开发',
    gateway: 'http://192.168.0.244:8101',
    sso_app: 'sso',
    application: 'vxfinance',
  },

  // ==================== 正式/SaaS ====================
  saas: {
    name: 'SaaS正式',
    gateway: 'https://api.100xsys.cn:443',
    sso_app: 'sso',
    application: 'config',
    app_path: 'https://api.100xsys.cn:443/oa',
    ws_protocol: 'ws',
    ws_ip: '192.168.0.157',
    ws_port: '55555',
    ws_gateway: 'ws://192.168.0.157:55555',
  },
  // ==================== 正式/宝博 ====================
  baobo: {
    name: '宝博正式',
    gateway: 'https://sxbbcs.com/bxapi',
    sso_app: 'sso',
    application: 'config',
    app_path: 'https://sxbbcs.com/bxapi/oa',
    ws_protocol: 'ws',
    ws_ip: '192.168.0.157',
    ws_port: '55555',
    ws_gateway: 'ws://192.168.0.157:55555',
  },

  // ==================== 延安园区 ====================
  parkDev: {
    name: '延安园区开发',
    gateway: 'http://192.168.0.214/bxapi',
    sso_app: 'sso',
    application: 'config',
    homePageNo: 'BX2506130908230001',
    btnStyle: 'park',
  },
  parkTest: {
    name: '延安园区测试',
    gateway: 'http://192.168.0.210/bxapi',
    sso_app: 'sso',
    application: 'config',
    homePageNo: 'BX2506130908230001',
    btnStyle: 'park',
  },
  parkTestOut: {
    name: '延安园区测试外网',
    gateway: 'http://139.196.111.15:50070/bxapi',
    sso_app: 'sso',
    application: 'config',
    homePageNo: 'BX2506130908230001',
    btnStyle: 'park',
  },
  park: {
    name: '延安园区生产',
    gateway: 'https://www.gxqcxkj.com/bxapi',
    sso_app: 'sso',
    application: 'config',
    homePageNo: 'BX2506130908230001',
    btnStyle: 'park',
  },

  // ==================== 稽核项目 ====================
  audDev: {
    name: '稽核开发',
    gateway: 'http://192.168.0.151:180',
    sso_app: 'sso',
    application: 'aud',
  },

  // ==================== 宝博项目 ====================
  baoboProd: {
    name: '宝博线上',
    gateway: 'https://sxbbcs.com/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'bboa',
  },

  // ==================== 试飞项目 ====================
  shifei: {
    name: '试飞客户',
    gateway: 'http://172.17.2.162/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'doc',
  },

  // ==================== 延安行 ====================
  yananxing: {
    name: '延安行内网',
    gateway: 'http://192.168.0.206/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'config',
    homePageNo: 'PG2509081715270003',
  },
  yananxingOut: {
    name: '延安行外网',
    gateway: 'https://yax.100xsys.cn/bxapi',
    sso_app: 'sso',
    suffix: '/bxapi',
    application: 'config',
    homePageNo: 'PG2509081715270003',
    amapKey: '8d077c460039cabc346d2c8a2859ae3e',
  },

  // ==================== 研学 ====================
  yanxue2: {
    name: '研学2.0',
    gateway: 'http://yxsj.sneducloud.com/yxapi',
    sso_app: 'sso',
    suffix: '/yxapi',
    application: 'config',
  },
  yanxueDev: {
    name: '研学开发',
    gateway: 'http://192.168.0.157:8104',
    sso_app: 'sso',
    application: 'config',
  },
  yanxueOpen: {
    name: '研学外网',
    gateway: 'https://xxld.100xsys.cn',
    sso_app: 'sso',
    application: 'config',
  },
  yanxueOpen1: {
    name: '研学外网1',
    gateway: 'http://139.196.209.46:5021',
    sso_app: 'sso',
    application: 'config',
  },

  // ==================== 西乡 ====================
  xixiang: {
    name: '西乡',
    gateway: 'https://api.laodongcloud.com',
    sso_app: 'sso',
    application: 'ledu',
  },

  // ==================== 健康管理 ====================
  healthDev: {
    name: '健康开发',
    gateway: 'http://192.168.0.154:8104',
    sso_app: 'sso',
    application: 'hsprl',
  },
  healthProd: {
    name: '健康生产',
    gateway: 'https://admin.bxjkw.cn/bxapi',
    sso_app: 'sso',
    application: 'hsprl',
  },

  // ==================== 高速 ====================
  gaosudev: {
    name: '高速开发',
    gateway: 'http://192.168.0.140:180',
    sso_app: 'sso',
    application: 'idm',
  },
  gaosu111: {
    name: '高速111',
    gateway: 'http://192.168.0.111:180',
    sso_app: 'sso',
    application: 'idm',
  },
  gaosu61: {
    name: '高速61',
    gateway: 'http://localhost:8080/gaosuApi',// 业务接口代理到http://61.185.210.204:8099/bxapi
    sso_app: 'sso',
    application: 'idm',
  },
  gaosuRH: {
    name: '高速融合',
    gateway: 'http://192.168.0.215:180',
    sso_app: 'sso',
    application: 'idm',
  },

  // ==================== 其他项目 ====================
  gangu: {
    name: '甘谷人大',
    gateway: 'https://www.ggrdw.gov.cn:40007',
    sso_app: 'sapp',
    application: 'sapp',
  },
  wujingDev: {
    name: '武警开发',
    gateway: 'http://192.168.0.25:8104',
    sso_app: 'sso',
    application: 'config',
  },
  wanxiang: {
    name: '万象',
    gateway: 'http://vrms.vanxum.com:8101',
    sso_app: 'sso',
    application: 'devlop',
  },
};
