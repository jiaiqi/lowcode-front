
window.APP_CONFIG = {
    appKey:'2Bs0KsW0Bx401x4vTdTv6X0dBTDT4PWj',  //测试环境
    serverUrl:`//api.map.baidu.com/api?type=webgl&v=1.0&ak=2Bs0KsW0Bx401x4vTdTv6X0dBTDT4PWj`,
    API_URL:`//192.168.0.151:180`,
    viRoute:`/baiduApi/direction/v2/driving`,
    RouteAK:`b2S9oNv5cryQ2bDEPVEUa5MKHcCqanFJ`,
    // ROUTE_151:`//api.map.baidu.com/direction/v2/driving` 通过151网关
    splitType:'|',
    // videoInfo:{
    //     host: '113.201.21.178',  // icc 平台ip
    //     port: '9443',  //icc 平台端口 https 默认 443
    //     username: 'admin',  // icc 平台用户名
    //     password: 'Admin123' // icc 平台密码
    // }
    //视频
    videoInfo:{
        host: '10.172.20.2',  // icc 平台ip
        port: '443',  //icc 平台端口 https 默认 443
        username: 'admin',  // icc 平台用户名
        password: 'Admin123' // icc 平台密码
    },
    sock:"wss://www.gxqcxkj.com:9002/im", //在线咨询使用
    chatUrl:'https://www.gxqcxkj.com/im/#/chart-info',
    // ===== 独立域名部署扩展配置 =====
    // 允许通过 postMessage 注入登录态的父窗口 origin 白名单（iframe 嵌入场景）
    // 示例: ["https://www.100xsys.cn", "http://localhost:8080"]
    allowedOrigins: [],
    // SSO 统一登录地址（直接访问独立域名未登录时跳转），如 "https://sso.100xsys.cn/login"
    ssoLoginUrl: "",
    // 旧工程前端入口地址（表单等场景 iframe 嵌入），如 "http://localhost:8080"
    // 生产示例: "https://www.100xsys.cn/main/index.html"
    legacyFormHost: "http://localhost:8080"
};
