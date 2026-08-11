<template>
  <div
    class="video_page"
    :class="currentTheme"
  >
    <div
      class="tree_left"
      :class="{ 'with-playback': videoChannel, 'collapsed': isCollapsed }"
    >
      <div
        class="collapse-btn"
        @click="toggleCollapse"
      >
        <i :class="isCollapsed ? 'el-icon-arrow-right' : 'el-icon-arrow-left'"></i>
      </div>
      <li class="tree_tl">
        <el-input
          v-model="filterText"
          placeholder="输入关键字进行快速搜索"
          size="mini"
          clearable
          class="filter-input"
        />
        <el-tree
          style="font-size: 0.875rem"
          :data="videoTree"
          :props="fieldNames"
          :default-expanded-keys="expandedKeys"
          :default-checked-keys="selectedKeys"
          :defaultProps="{
            children: 'children',
            label: 'label',
            isLeaf: 'isLeaf'
          }"
          show-line
          :filter-node-method="filterNode"
          @node-click="handleSelect"
          ref="tree"
        >
          <span
            class="custom-tree-node"
            slot-scope="{ node, data }"
            @click="setNode(data)"
          >
            <span>{{ node.label }}</span>
            <span
              :title="data.chnl_online_status"
              class="is_online"
              :style="[{ color: data.chnl_online_status && data.chnl_online_status === '在线' ? '#67C23A' : '#909399' }]"
              v-if="data.isChannel && !data.children"
            ><i class="el-icon-s-opportunity"></i></span>
          </span>
        </el-tree>
      </li>
      <!-- 保存按钮区域 -->
      <div
        class="save-controls"
        v-if="!isPlayerLoading && hasChannelsChanged && props && props.hasOwnProperty('video_card_channels')"
      >
        <el-button
          type="primary"
          size="mini"
          @click="saveWindowChannels"
          class="save-btn"
        >
          <i class="el-icon-check"></i>
          保存配置
        </el-button>
      </div>

      <div class="playback-controls">
        <div class="control-title">历史回放</div>
        <div class="divider"></div>
        <div class="control-content">
          <el-switch
            size="mini"
            v-model="isPlaybackMode"
            @change="handlePlaybackModeChange"
            active-text="回放模式"
            inactive-text="实时模式"
          />
          <div class="record-source-title">录像来源:</div>
          <el-radio-group
            size="mini"
            v-model="recordSource"
            :disabled="!isPlaybackMode"
            class="radio-group"
          >
            <el-radio :label="2">设备录像</el-radio>
            <el-radio :label="3">中心录像</el-radio>
          </el-radio-group>
          <div class="date-picker-group">
            <el-date-picker
              size="mini"
              v-model="playbackStartTime"
              type="datetime"
              placeholder="开始时间"
              format="yyyy-MM-dd HH:mm:ss"
              value-format="yyyy-MM-dd HH:mm:ss"
              :disabled="!isPlaybackMode"
              class="date-picker"
            />
            <el-date-picker
              size="mini"
              v-model="playbackEndTime"
              type="datetime"
              placeholder="结束时间"
              format="yyyy-MM-dd HH:mm:ss"
              value-format="yyyy-MM-dd HH:mm:ss"
              :disabled="!isPlaybackMode"
              class="date-picker"
            />
          </div>
          <div class="button-group">
            <el-button
              size="mini"
              type="primary"
              @click="startPlayback"
              :disabled="!isPlaybackMode || isPlaying || !videoChannel"
            >开始回放
            </el-button>
            <el-button
              size="mini"
              type="danger"
              @click="stopPlayback"
              :disabled="!isPlaying || !videoChannel"
            >
              停止回放
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="video_cot_area">
      <!-- 加载动画 -->
      <div
        v-if="isPlayerLoading"
        class="video-loading-container"
      >
        <div class="video-loading-spinner">
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">视频播放器加载中...</div>
      </div>
      <div
        class="video_cot"
        id="play_dh"
      ></div>
    </div>
  </div>
</template>

<script setup>
import cloneDeep from 'lodash/cloneDeep';
import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
import VideoUtil from "./video";
import { Notification } from 'element-ui';
import {
  useRouter,
  useRoute,
  useHttp,
  useUtils
} from "@/common/vueApi";

// 动态加载 videoPlayer.js 的函数
const loadVideoPlayerScript = () => {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过
    if (window.VideoPlayer && window.dhPlayerControl) {
      resolve();
      return;
    }

    // 检查是否已经有script标签在加载中
    const existingScript = document.querySelector('script[src*="videoPlayer.js"]');
    if (existingScript) {
      // 如果已经在加载中，等待加载完成
      existingScript.onload = () => resolve();
      existingScript.onerror = () => reject(new Error('Failed to load videoPlayer.js'));
      return;
    }

    // 创建script标签动态加载
    const script = document.createElement('script');
    // Vite 兼容：文件由部署方放置到站点根 assets/dhvideo/videoPlayer.js
    // （webpack4 时代的 require('@/assets/dhvideo/videoPlayer.js') 在 Vite 下无法构建）
    script.src = './assets/dhvideo/videoPlayer.js';
    script.async = true;

    script.onload = () => {
      console.debug('videoPlayer.js 动态加载成功');
      resolve();
    };

    script.onerror = () => {
      console.error('videoPlayer.js 动态加载失败');
      reject(new Error('Failed to load videoPlayer.js'));
    };

    document.head.appendChild(script);
  });
};

// 视频播放器脚本加载状态
const isVideoPlayerScriptLoaded = ref(false);

// 定义 emit 事件
const emit = defineEmits(['window-channels-change', 'save-window-channels']);
const route = useRoute();
const shieldClass = ['shield-class', 'select', 'layui-nav closeBox', 'tab-buttons', 'layui-nav-child', 'layui-side', 'layui-header', 'property-panel-container', 'materials-panel-container']
const Videos = new VideoUtil();
const videoTree = ref([]);
const expandedKeys = ref([]);
const selectedKeys = ref([]);
const videoChannel = ref('');
const fieldNames = {
  children: 'children',
  label: 'area_name',
  value: 'area_no'
}

const props = defineProps({
  division: {
    type: Number,
    default: 9
  },
  pageConfig: {
    type: Object,
    default: () => ({})
  },
  pageItem: {
    type: Object,
    default: () => ({})
  },
  video_card_channels: {
    type: String,
    default: ''
  }
})
const vueUtil = useUtils()
const setReq = () => {
  if (props.pageItem?.srv_req_json) {
    const componentParamsModels = route.querys || {}
    let params = componentParamsModels ? cloneDeep(componentParamsModels) : {};
    const pageConfig = props.pageConfig || {}
    if (pageConfig && pageConfig.interface_json_data && Array.isArray(pageConfig.interface_json_data)) {
      if (pageConfig.interface_json_data.length > 0) {
        let obj = pageConfig.interface_json_data[0]
        params = {
          ...params,
          [obj.para]: obj.value
        }
      }
    }

    let req = cloneDeep(props.pageItem?.srv_req_json) || {}
    let conds = []
    let userInfo = sessionStorage.getItem('login_user_info') || sessionStorage.getItem('current_login_user')
    if(userInfo){
      try{
        userInfo = JSON.parse(userInfo)
      }catch(e){
        userInfo = null
        console.error('解析用户信息失败', e)
      }
    }
    const globalParams = {
      ...params,
      user:userInfo,
      user_no: userInfo?.user_no || '',
      userInfo: userInfo || '',
    }
    if (req.hasOwnProperty('condition') && req.condition.length > 0) {
      for (let cond of req.condition) {
        let condModel = cloneDeep(cond)
        if (cond && condModel.value && condModel.value.indexOf('${') !== -1 && condModel.value.indexOf('}') !== -
          1 && params) {
          if (vueUtil.renderStr(condModel.value, globalParams) && vueUtil.renderStr(condModel.value, globalParams).indexOf('[object') == -1) {
            condModel.value = vueUtil.renderStr(condModel.value, globalParams)
          } else {
            let key = condModel.value
            var sreg = new RegExp("\\${", "g"); // 加'g'，删除字符串里所有的"a"
            var ereg = new RegExp("\}", "g"); // 加'g'，删除字符串里所有的"a"
            key = key.replace(sreg, "");
            key = key.replace(ereg, "");
            condModel.value = params && params.hasOwnProperty(key) ? params[key] : ""
            if (condModel.value?.value) {
              condModel.value = condModel.value.value
            }
          }

        }
        conds.push(cloneDeep(condModel))

      }
      req.condition = conds.map(item => item)
    }
    return req
  } else {
    return null
  }
}

const filterText = ref(''); //树节点过滤使用
const tree = ref(null);
let myVideoPlayer = null;
const LoginInfo = window.APP_CONFIG?.videoInfo || {
  host: '10.172.20.2',  // icc 平台ip
  port: '443',  //icc 平台端口 https 默认 443
  username: 'admin',  // icc 平台用户名
  password: 'Admin123' // icc 平台密码
}

// 添加历史回放相关的状态变量
const playbackStartTime = ref('');
const playbackEndTime = ref('');
const isPlaying = ref(false);
const isPlaybackMode = ref(false);
const selectedWindow = ref(0);
const recordSource = ref(2); // 默认选择设备录像
// 添加收缩状态控制
const isCollapsed = ref(true);
// 记录每个窗口的通道信息
const windowChannels = ref({});
// 保存回放前的播放器状态
const previousPlayerState = ref({
  division: props.division, // 默认9宫格
  channels: {}
});

// 添加主题检测和管理
const currentTheme = ref('dark-theme');

// 添加播放器加载状态
const isPlayerLoading = ref(true);

// 添加窗口通道变化监听相关状态
const hasChannelsChanged = ref(false);
const originalWindowChannels = ref({});

// 检测是否在iframe中
const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};
const $http = useHttp();
// 保存窗口通道配置
const saveWindowChannels = async () => {
  const channelList = myVideoPlayer?.setting?.channelList || [];
  console.warn('saveWindowChannels - channelList:', channelList);
  // 发送事件给父组件
  emit('save-window-channels', {
    windowChannels: windowChannels.value,
    timestamp: new Date().toISOString()
  });
  const url = `config/operate/srvpage_cfg_page_component_update`
  const req = [{
    "serviceName": "srvpage_cfg_page_component_update",
    "condition": [{ "colName": "com_no", "ruleType": "eq", "value": props.pageItem.com_no }],
    "data": [{ "video_card_channels": channelList && channelList.length ? JSON.stringify(channelList) : JSON.stringify(windowChannels.value) }]
  }]
  const res = await $http.post(url, req)
  if (res.data.state === 'SUCCESS') {
    // 更新原始配置，重置变化标记
    originalWindowChannels.value = { ...windowChannels.value };
    hasChannelsChanged.value = false;
    // 显示保存成功提示
    Notification({
      title: '保存成功',
      message: '窗口通道配置已保存',
      type: 'success',
      duration: 2000
    });

  } else {
    Notification({
      title: '保存失败',
      message: '窗口通道配置保存失败',
      type: 'error',
      duration: 2000
    });
  }

};

// 根据环境自动选择主题
const getThemeClass = () => {
  return ['website', 'lowcode-view'].includes(route.name) ? 'blue-theme' : 'dark-theme';
  return isInIframe() ? 'blue-theme' : 'dark-theme';
};

// 通知父组件窗口通道信息变化
const notifyParentWindowChannelsChange = () => {
  const channelsData = {
    windowChannels: { ...windowChannels.value },
    timestamp: Date.now()
  };

  const channelList = myVideoPlayer?.setting?.channelList || [];
  console.warn('channelList:', channelList);

  hasChannelsChanged.value = true;
  emit('window-channels-change', channelsData);
};

const setNode = (data) => {
}
// 切换收缩状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 添加单窗口模式下的通道切换方法
const switchChannelInSingleWindow = (newChannelId) => {
  if (!myVideoPlayer) {
    return;
  }

  // 获取当前分屏数
  const currentDivision = myVideoPlayer.getDivision ? myVideoPlayer.getDivision() : 1;
  if (currentDivision !== 1) {
    return;
  }

  // 先释放当前窗口的通道
  try {
    // 停止当前播放
    if (myVideoPlayer.stopReal) {
      myVideoPlayer.stopReal();
    }
    // 关闭当前窗口
    if (myVideoPlayer.closeWindow) {
      myVideoPlayer.closeWindow({
        isAll: false,
        snum: 0,
        channelList: [windowChannels.value[0]]
      });
    }
    // 清空当前窗口的通道信息
    windowChannels.value[0] = null;

    // 通知父组件窗口通道信息变化
    notifyParentWindowChannelsChange();
  } catch (error) {
    console.error('释放窗口通道时发生错误:', error);
  }

  // 延迟一下再开始新的通道播放
  setTimeout(() => {
    // 更新窗口通道信息
    windowChannels.value[0] = newChannelId;

    // 通知父组件窗口通道信息变化
    notifyParentWindowChannelsChange();

    myVideoPlayer.startReal([{
      channelId: newChannelId,
      channelName: '通道名称',
      snum: 0, // 单窗口模式下固定使用索引0
      streamType: 2,
      deviceType: 2,
      cameraType: '1',
      capability: '00000000000000000000000000000001'
    }]);
  }, 200); // 增加延时确保释放操作完成
}

const handleSelect = async (selectedKeys, e) => {
  let node = e.data ? e.data : {};
  if (node && node.isChannel && !node.chnl_online_status || node.chnl_online_status === '离线')
    return Notification({
      title: '注意!',
      message: '当前视频离线',
      type: 'warning',
      position: 'top-left',
      showClose: false,
      duration: 2000
    })
  if (node && node.isChannel && node.chnl_online_status && node.chnl_online_status === '在线') {
    videoChannel.value = node.chnl_no;
    // // 测试使用使用固定的通道ID
    // const fixedChannelId = '1002636$1$0$0';
    // videoChannel.value = fixedChannelId;

    // 获取当前选中的窗口索引
    const currentWindowIndex = selectedWindow.value;

    // 记录当前窗口的通道信息
    windowChannels.value[currentWindowIndex] = videoChannel.value;

    // 通知父组件窗口通道信息变化
    notifyParentWindowChannelsChange();

    // 确保播放器已经初始化
    if (!myVideoPlayer) {
      try {
        await initPlayer();
      } catch (error) {
        console.error('初始化播放器失败:', error);
        return;
      }
    }

    // 获取当前分屏数
    const currentDivision = myVideoPlayer.getDivision ? myVideoPlayer.getDivision() : 1;

    if (currentDivision === 1) {
      // 单窗口模式下，先停止当前播放
      try {
        if (isPlaybackMode.value && isPlaying.value) {
          // 如果是回放模式且正在播放，先停止回放
          stopPlayback();
        } else if (myVideoPlayer.stopReal) {
          // 如果是实时模式，停止实时播放
          myVideoPlayer.stopReal();
        }
      } catch (error) {
        console.error('停止当前播放时发生错误:', error);
      }

      // 延迟一下再开始新的通道播放
      setTimeout(() => {
        if (isPlaybackMode.value && isPlaying.value) {
          // 如果是回放模式且正在播放，开始新的回放
          startPlayback();
        } else {
          // 否则开始实时播放
          myVideoPlayer.startReal([{
            channelId: videoChannel.value,
            channelName: node?.chnl_name || '通道名称',
            snum: 0, // 单窗口模式下固定使用索引0
            streamType: 2,
            deviceType: 2,
            cameraType: '1',
            capability: '00000000000000000000000000000001'
          }]);
        }
      }, 200);
    } else {
      // 多窗口模式下使用原有的播放逻辑
      if (isPlaybackMode.value && isPlaying.value) {
        stopPlayback();
        setTimeout(() => {
          startPlayback();
        }, 200);
      } else {
        playStartReal(videoChannel.value, currentWindowIndex, node);
      }
    }
  }
}

//初始化播放器
const initPlayer = async () => {
  try {
    // 先动态加载 videoPlayer.js 脚本
    if (!isVideoPlayerScriptLoaded.value) {
      await loadVideoPlayerScript();
      isVideoPlayerScriptLoaded.value = true;
    }

    // 如果播放器实例已存在，先销毁它
    if (myVideoPlayer) {
      try {
        // 如果正在播放，先停止播放
        if (isPlaying.value) {
          myVideoPlayer.stopPlayback();
        }
        // 销毁播放器实例
        myVideoPlayer.destroy();
        myVideoPlayer = null;
      } catch (error) {
        console.error('销毁播放器时发生错误:', error);
      }
    }

    // 创建新的播放器实例
    return new Promise((resolve, reject) => {
      myVideoPlayer = new VideoPlayer({
        videoId: "play_dh",
        windowType: isPlaybackMode.value ? 7 : 0,    // 播放器类型，必传， 0 - 实时预览，3 - 录像回放，7- 录像回放（支持倒放）
        usePluginLogin: true, // 采用登录 (请默认传true，插件内部自动拉流)
        pluginLoginInfo: LoginInfo,
        division: props.division, // 默认显示9宫格
        draggable: false, // 窗口拖拽 【暂不支持】
        showBar: true, // 底部操作栏， 选传，【true - 显示, false - 隐藏】
        shieldClass: shieldClass, // 如果DOM元素被插件挡住了，把DOM元素的类名传入。
        coverShieldClass: ['video_cot_area'], // 如果插件要在dom内滚动，需要把DOM元素的类名传入，请查看案例-遮挡
        parentIframeShieldClass: shieldClass, // 有 iframe 时，top层 的 dom 元素被插件挡住了，把DOM元素的类名传入。
        // 创建播放器成功回调
        createSuccess: (versionInfo) => {
          // 初始化时默认显示9宫格
          myVideoPlayer.changeDivision(props.division)
          myVideoPlayer.setTabControlBtn();
          // 播放器加载完成，隐藏加载动画
          isPlayerLoading.value = false
          console.warn('创建播放器成功:', versionInfo);
          resolve();
        },
        // 创建播放器失败回调
        createError: (err) => {
          // 有错误码，可打印查看错误信息
          isPlayerLoading.value = false
          console.error('创建播放器失败:', err);
          reject(err);
        },
        // 插件公共回调
        dhPlayerMessage: (channelInfo, message) => {
        // 打印所有插件抛的事件，便于你部署后看实际 PTZ 点击抛什么（测试完可注释）
          console.warn('[DHPlayer 事件] PTZ 调试:', {
          channelInfo,
          message,
          snum: channelInfo?.snum || selectedWindow.value
          });

        // 判断是否是 PTZ 按钮点击事件（根据大华常见抛出方式）
        // 你部署后点 PTZ 图标，看控制台输出什么 message，然后调整下面 if 条件
        if (
        message?.eventCode === 704 ||                          // 常见 PTZ 操作/鉴权码
        message?.type?.toLowerCase() === 'ptz' ||              // 部分版本用 type: 'ptz'
        (typeof message === 'string' && message.toLowerCase().includes('ptz')) ||  // 字符串包含 ptz
          message?.i18nKey?.includes('PTZ')                      // 国际化 key 提示
        ) {
        // 尝试从 message 中提取方向（实际需根据控制台输出调整）
        let direction = 'up';  // 默认兜底

          // 根据常见字段匹配（你看日志替换成真实的）
          if (message?.direction) {
            direction = message.direction;                       // 如 'up', 'down', 'left', 'right', 'zoomIn', 'zoomOut'
            } else if (message?.action) {
            direction = message.action;
          } else if (message?.key || message?.btn) {
            // 有些版本用 btn: 'PTZ_UP' 等
          const key = (message.key || message.btn || '').toLowerCase();
          if (key.includes('up')) direction = 'up';
          else if (key.includes('down')) direction = 'down';
          else if (key.includes('left')) direction = 'left';
          else if (key.includes('right')) direction = 'right';
          else if (key.includes('zoomin')) direction = 'zoomIn';
          else if (key.includes('zoomout')) direction = 'zoomOut';
        }

        console.warn(`[PTZ 触发] 方向: ${direction}, 窗口: ${channelInfo?.snum || selectedWindow.value}`);

      // 发送云台控制指令（核心调用）
        myVideoPlayer.send({
          method: 'video.ptzControl',
          info: {
            snum: channelInfo?.snum || selectedWindow.value,  // 当前窗口号
            action: direction,           // 方向
            speed: 5,                    // 速度 1~10
            stop: false                  // false = 开始移动
            }
        });

        // 600ms 后自动停止（防止一直转，体验更好）
        setTimeout(() => {
          myVideoPlayer.send({
          method: 'video.ptzControl',
            info: {
              snum: channelInfo?.snum || selectedWindow.value,
              action: direction,
              speed: 5,
              stop: true
         }
        });
        console.warn(`[PTZ 自动停止] 方向: ${direction}`);
        }, 600);
        }
      },
        // 实时预览成功回调
        realSuccess: (info) => {
          console.warn('实时预览成功-init:', info);
          notifyParentWindowChannelsChange();
        },
        // 实时预览失败 回调
        realError: (info, err) => {
          console.error('实时预览失败:', info, err);

        },
        // 对讲成功回调
        talkSuccess: (info) => {
          console.warn('对讲成功:', info);
        },
        // 对讲失败回调
        talkError: (info, err) => {
          console.error('对讲失败:', info, err);
        },
        // 录像播放成功回调
        playbackSuccess: (info) => {
          console.warn('录像播放成功:', info);

        },
        // 录像播放失败回调
        playbackError: (info, err) => {
          console.error('录像播放失败:', info, err);

        },
        // 录像播放完成回调
        playbackFinish: (info) => {
          console.warn('录像播放完成:', info);

        },
        // 抓图成功回调
        snapshotSuccess: ({ base64Url, path }, info) => {
          let byteCharacters = atob(
            base64Url.replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
          );
          let byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          let byteArray = new Uint8Array(byteNumbers);
          let blob = new Blob([byteArray], {
            type: undefined,
          });
          let aLink = document.createElement("a");
          aLink.download = "图片名称.jpg"; //这里写保存时的图片名称
          aLink.href = URL.createObjectURL(blob);
          aLink.click();
          console.warn('抓图成功:', info);
        },
        // 关闭视频窗口回调
        closeWindowSuccess: ({ isAll, snum, channelList }) => {
          console.warn('关闭视频窗口成功:', { isAll, snum, channelList });
        },
        // 鼠标单击窗口回调
        clickWindow: (snum) => {
          // 点击窗口时，更新当前选择的窗口索引
          if (!isPlaybackMode.value) {
            selectedWindow.value = snum;
            console.warn('当前选择的实时窗口：', snum + 1);
          }
          if (isPlaybackMode.value && !isPlaying.value) {
            selectedWindow.value = snum;
            console.warn('当前选择的回放窗口：', snum + 1);
          }
        },
        // 鼠标双击窗口回调
        dbClickWindow: (snum) => {
          console.warn('鼠标双击窗口:', snum);
        },
        // 播放器窗口的数量回调
        changeDivision: (division) => {
          console.warn('播放器窗口的数量回调:', division);
        },
        // rtsp 流下载录像成功回调
        downloadRecordSuccess: (info) => {
          console.warn('rtsp 流下载录像成功:', info);
        },
        // rtsp 流下载录像失败回调
        downloadRecordError: (info, err) => {
          console.error('rtsp 流下载录像失败:', info, err);
        }
      });

    })
  } catch (error) {
    console.error('初始化播放器时发生错误:', error);
    isPlayerLoading.value = false;
    Notification({
      title: '错误',
      message: '视频播放器初始化失败: ' + error.message,
      type: 'error',
      duration: 3000
    });
    throw error;
  }
}
//实时流播放
const playStartReal = (id, windowIndex = 0, node) => {
  if (!myVideoPlayer) {
    return;
  }
  // 如果当前是回放模式，先停止回放
  if (isPlaybackMode.value) {
    stopPlayback();
  }
  isPlaybackMode.value = false;

  // 更新窗口通道信息
  windowChannels.value[windowIndex] = id;
  console.warn('当前所有窗口通道信息：', windowChannels.value);

  // 通知父组件窗口通道信息变化
  notifyParentWindowChannelsChange();

  myVideoPlayer.startReal([{
    channelId: id, // 通道id 【必传】
    channelName: node?.chnl_name || '通道名称', // 通道名称 (用于本地录像下载)
    snum: windowIndex, // 使用指定的窗口序号
    streamType: 2,  // 1-主码流  2-辅码流 (可不传，默认主码流)
    deviceType: 2, // talkType 对讲类型  1-设备对讲 2-通道对讲 设备类别 (插件对讲时，需要配置该参数，否则无法对讲)
    cameraType: '1',  // 摄像头类型 (用于云台)
    capability: '00000000000000000000000000000001', // 能力集 (用于云台)
    realSuccess: (info) => {
      console.warn('playStartReal实时预览成功:', info);
    },
    // 实时预览失败回调
    realError: (info, err) => {
      console.error('实时预览失败:', info, err);
    },
  }])
}
//历史回放
const startPlayback = () => {
  if (!myVideoPlayer) {
    return;
  }

  if (!playbackStartTime.value || !playbackEndTime.value) {
    return;
  }

  // 检查时间是否有效
  if (new Date(playbackStartTime.value) > new Date(playbackEndTime.value)) {
    return;
  }

  if (!videoChannel.value) {
    return;
  }

  isPlaying.value = true;

  // 重新初始化播放器以支持倒放
  myVideoPlayer = new VideoPlayer({
    videoId: "play_dh",
    windowType: 7,    // 使用支持倒放的模式
    usePluginLogin: true,
    pluginLoginInfo: LoginInfo,
    division: 1,
    draggable: false,
    showBar: true,
    shieldClass: shieldClass,
    coverShieldClass: ['video_cot_area'],
    parentIframeShieldClass: shieldClass,
    createSuccess: (versionInfo) => {
      // 开始回放
      myVideoPlayer.startPlayback([{
        channelId: videoChannel.value, // 使用当前选中的通道
        channelName: '通道名称',
        startTime: playbackStartTime.value,
        endTime: playbackEndTime.value,
        recordSource: recordSource.value,
        streamType: 0,
        snum: selectedWindow.value
      }]);
      console.warn('开始回放:', {
        channelId: videoChannel.value,
        startTime: playbackStartTime.value,
        endTime: playbackEndTime.value,
        recordSource: recordSource.value,
        streamType: 0,
        snum: selectedWindow.value
      });
    },
    createError: (err) => {
      console.error('创建播放器失败:', err);
      isPlaying.value = false;
    }
  });
}

// 停止回放
const stopPlayback = () => {
  if (myVideoPlayer && isPlaying.value) {
    try {
      // 使用 controlPlayback 方法暂停播放
      myVideoPlayer.controlPlayback({
        snum: selectedWindow.value,
        state: 0  // 0 表示暂停
      });
      isPlaying.value = false;

      // 保持当前窗口状态，不销毁播放器实例
      if (myVideoPlayer.changeDivision) {
        myVideoPlayer.changeDivision(1); // 保持单窗口模式
      }
    } catch (error) {
      console.error('停止回放时发生错误:', error);
    }
  }
}

// 处理回放模式切换
const handlePlaybackModeChange = (checked) => {
  if (checked) {
    // 切换到回放模式
    if (myVideoPlayer) {
      // 保存当前所有窗口的通道信息
      const currentChannels = {};
      // 遍历所有窗口，获取当前播放的通道信息
      for (let i = 0; i < 9; i++) {
        if (windowChannels.value[i]) {
          currentChannels[i] = windowChannels.value[i];
        }
      }

      // 保存当前播放器状态
      previousPlayerState.value = {
        division: myVideoPlayer.getDivision ? myVideoPlayer.getDivision() : props.division,
        channels: currentChannels
      };

      // 切换到单窗口模式
      myVideoPlayer.changeDivision(1);
    }
  } else {
    // 切换回实时模式
    cancelPlayback();
  }
};
//切换回实时播放时的回调业务
const cancelPlayback = () => {
  if (myVideoPlayer) {
    try {
      if (isPlaying.value) {
        if (typeof myVideoPlayer.stopPlayback === 'function') {
          myVideoPlayer.stopPlayback();
        }
      }
      isPlaybackMode.value = false;
      isPlaying.value = false;
      // 清空时间选择
      playbackStartTime.value = '';
      playbackEndTime.value = '';

      // 保存当前播放器实例的引用和通道信息
      const currentPlayer = myVideoPlayer;
      const savedChannels = { ...previousPlayerState.value.channels };

      // 创建新的播放器实例
      myVideoPlayer = new VideoPlayer({
        videoId: "play_dh",
        windowType: 0,    // 实时预览模式
        usePluginLogin: true,
        pluginLoginInfo: LoginInfo,
        division: props.division, // 固定使用9宫格
        draggable: false,
        showBar: true,
        shieldClass: shieldClass,
        coverShieldClass: ['video_cot_area'],
        parentIframeShieldClass: shieldClass,
        createSuccess: (versionInfo) => {
          // 确保切换到9宫格
          myVideoPlayer.changeDivision(props.division);
          myVideoPlayer.setTabControlBtn();
          // 增加延时确保窗口切换完成
          setTimeout(() => {
            // 使用保存的通道信息
            const playbackList = Object.entries(savedChannels)
              .filter(([_, channelId]) => channelId) // 过滤掉空值
              .map(([windowIndex, channelId]) => {
                // 确保通道ID格式正确
                const formattedChannelId = channelId.includes('$') ? channelId : `${channelId}$1$0$0`;
                return {
                  channelId: formattedChannelId,
                  channelName: '通道名称',
                  snum: parseInt(windowIndex),
                  streamType: 2,
                  deviceType: 2,
                  cameraType: '1',
                  capability: '00000000000000000000000000000001'
                };
              });

            if (playbackList.length > 0) {
              // 确保所有通道都停止后再开始新的播放
              if (typeof myVideoPlayer.stopReal === 'function') {
                myVideoPlayer.stopReal();
              }

              // 短暂延时后开始新的播放
              setTimeout(() => {
                myVideoPlayer.startReal(playbackList);
                // 更新窗口通道信息
                windowChannels.value = { ...savedChannels };

                // 通知父组件窗口通道信息变化
                notifyParentWindowChannelsChange();
              }, 200);
            }
          }, 500); // 增加延时到500ms，确保窗口切换完成
        },
        createError: (err) => {
          console.error('创建播放器失败:', err);
        },
        // 添加实时预览成功回调
        realSuccess: (info) => {
        },
        // 添加实时预览失败回调
        realError: (info, err) => {
          console.error('实时预览失败:', info, err);
        }
      });

      // 销毁旧的播放器实例
      if (currentPlayer && typeof currentPlayer.destroy === 'function') {
        currentPlayer.destroy();
      }
    } catch (error) {
      console.error('取消回放时发生错误:', error);
    }
  }
}
//处理节点数据重新组装
const processTreeData = (data) => {
  return data.map(item => {
    const newItem = { ...item };

    // 处理当前节点的 channels
    if (item.channels && item.channels.length > 0) {
      const channelsParent = {
        area_name: '视频通道',
        area_no: `${item.area_no}_channels`,
        children: item.channels.map(channel => ({
          ...channel,
          area_name: channel.chnl_name,
          area_no: channel.chnl_no,
          isChannel: true
        }))
      };
      newItem.children = [
        ...(newItem.children || []),
        channelsParent
      ];
    }

    // 递归处理子节点
    if (newItem.children) {
      newItem.children = processTreeData(newItem.children);
    }
    if (newItem.is_leaf !== '否' && !newItem.children?.length) {
      newItem.isLeaf = true;
    }
    return newItem;
  });
};
//获取视频节点树
const getVideoInfo = async () => {
  let res = null
  let req = setReq()
  if (req && req.serviceName) {
    const url = `/${req.mapp}/select/${req.serviceName}`
    req = {
      ...req,
      treeData: true,
    }
    res = await $http.post(url, req)
  } else {
    res = await Videos.getVideoListByArea()
  }
  // .then(res => {
  if (res.data.state !== 'SUCCESS') return;
  videoTree.value = processTreeData(res.data.data);
  // }).catch(err => {
  // });
}

// 监听过滤文本变化
watch(filterText, (val) => {
  tree.value?.filter(val);
});

// 监听 windowChannels 变化
watch(() => windowChannels.value, (newValue, oldValue) => {
  // 深度比较新值和原始值
  const isChanged = JSON.stringify(newValue) !== JSON.stringify(originalWindowChannels.value);
  hasChannelsChanged.value = isChanged;
}, { deep: true });

// 过滤节点方法
const filterNode = (value, data) => {
  if (!value) return true;
  return data.area_name.toLowerCase().includes(value.toLowerCase());
};

// 初始化窗口通道配置
const initWindowChannels = () => {
  try {
    if (props.video_card_channels) {
      const defaultChannels = JSON.parse(props.video_card_channels);
      console.warn('初始化窗口通道配置:', defaultChannels);
      if (Array.isArray(defaultChannels) && defaultChannels.length) {
        // 有默认通道配置，使用它
        console.warn('有默认通道配置数组:', defaultChannels);
        console.warn('检测到默认通道配置，准备自动播放');
        defaultChannels.forEach((item, index) => {
          const chnl_no = item.channelId;
          console.warn('通道信息:', item);
          if (chnl_no) {
            console.warn(`自动播放窗口 ${index}，通道: ${chnl_no}`);
            playStartReal(chnl_no, parseInt(index));
          }
        });
        return
      }
      // 设置默认值
      windowChannels.value = { ...defaultChannels };
      originalWindowChannels.value = { ...defaultChannels };

      // 如果有默认值，自动播放
      if (Object.keys(defaultChannels).length > 0) {
        console.warn('检测到默认通道配置，准备自动播放');
        // 延迟执行，确保播放器已初始化
        setTimeout(() => {
          Object.keys(defaultChannels).forEach(windowIndex => {
            const chnl_no = defaultChannels[windowIndex];
            if (chnl_no) {
              console.warn(`自动播放窗口 ${windowIndex}，通道: ${chnl_no}`);
              playStartReal(chnl_no, parseInt(windowIndex));
            }
          });
        }, 1000);
      }
    }
  } catch (error) {
    console.error('解析默认窗口通道配置失败:', error);
  }
};

onMounted(async () => {
  // 根据环境自动选择主题
  currentTheme.value = getThemeClass();

  // 给body添加对应的主题类
  document.body.classList.add(currentTheme.value);


  await getVideoInfo()
  try {
    await initPlayer()

  } catch (error) {
    console.error('初始化播放器失败:', error);
  }

  setTimeout(() => {
    // 初始化窗口通道配置
    initWindowChannels();

  }, 3000);

})

// 组件卸载时移除主题类
onUnmounted(() => {
  document.body.classList.remove(currentTheme.value);
})
</script>

<style lang="scss">
li {
  list-style: none;
}

// 定义CSS变量 - 暗色主题颜色系统
.dark-theme {
  // 背景色
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3a3a3a7c;
  --bg-sidebar: #2525257e;
  --bg-control-panel: #2a2a2a9d;

  // 文字颜色
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-muted: #888888;
  --text-title: #e6e6e6;

  // 边框颜色
  --border-primary: #404040;
  --border-secondary: #333333;
  --border-hover: #555555;

  // 按钮和交互元素
  --btn-bg: #404040;
  --btn-bg-hover: #4a4a4a;
  --btn-text: #ffffff;

  // 状态颜色
  --status-online: #67C23A;
  --status-offline: #909399;

  // 输入框
  --input-bg: #333333;
  --input-border: #404040;
  --input-text: #ffffff;
  --input-placeholder: #888888;
}

// 定义CSS变量 - iframe主题颜色系统（基于#03192A背景）
.blue-theme {
  // 背景色 - 基于#03192A调整
  --bg-primary: #03192A;
  --bg-secondary: #0a2438;
  --bg-tertiary: #0f2f46;
  --bg-sidebar: #051e32;
  --bg-control-panel: #0c2740;

  // 文字颜色 - 针对深蓝背景优化
  --text-primary: #ffffff;
  --text-secondary: #b8d4f0;
  --text-muted: #7a9cc6;
  --text-title: #e8f2ff;

  // 边框颜色 - 与深蓝背景协调
  --border-primary: #1a3a5c;
  --border-secondary: #0f2a44;
  --border-hover: #2a4a6c;

  // 按钮和交互元素 - 蓝色调
  --btn-bg: #1a3a5c;
  --btn-bg-hover: #2a4a6c;
  --btn-text: #ffffff;

  // 状态颜色
  --status-online: #4CAF50;
  --status-offline: #9E9E9E;

  // 输入框 - 深蓝色调
  --input-bg: #0a2438;
  --input-border: #1a3a5c;
  --input-text: #ffffff;
  --input-placeholder: #7a9cc6;
}

.light-theme {}

.is_online {
  font-size: 0.75rem;
  margin-left: 0.3125rem;
}

.video_page {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  display: flex;
  justify-content: space-between;
  padding: 0.625rem;
  gap: 10px;

  // 暗色主题适配
  &.dark-theme {
    background: var(--bg-primary);
    color: var(--text-primary);
    backdrop-filter: blur(10px);

    .tree_left {
      background: var(--bg-sidebar);
      border: 1px solid var(--border-primary);
      color: var(--text-primary);

      .collapse-btn {
        background: var(--btn-bg);
        border-color: var(--border-primary);
        color: var(--text-primary);

        &:hover {
          background: var(--btn-bg-hover);
        }

      }

      .playback-controls {
        background: var(--bg-control-panel);
        border-top-color: var(--border-primary);

        .control-title {
          color: var(--text-title);
        }
      }
    }
  }

  // iframe主题适配 - 复用暗色主题的所有样式
  &.blue-theme {
    background-color: var(--bg-primary);
    color: var(--text-primary);

    .tree_left {
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-primary);

      .collapse-btn {
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-primary);

        &:hover {
          background-color: var(--btn-bg-hover);
          border-color: var(--border-hover);
        }
      }

      .tree_tl {
        .el-tree {
          background-color: transparent;
          color: var(--text-primary);

          .el-tree-node {
            .el-tree-node__content {
              background-color: transparent;
              color: var(--text-primary);

              &:hover {
                background-color: var(--bg-tertiary);
              }

              .el-tree-node__expand-icon {
                color: var(--text-secondary);
              }

              .custom-tree-node {
                color: var(--text-primary);
              }
            }

            &.is-current>.el-tree-node__content {
              background-color: var(--bg-tertiary);
            }
          }
        }
      }

      .playback-controls {
        background-color: var(--bg-control-panel);
        border-top: 1px solid var(--border-primary);

        .control-title {
          color: var(--text-title);
          border-bottom: 1px solid var(--border-primary);
        }

        .control-content {
          .date-picker-group {
            .date-picker {
              margin-bottom: 8px;
            }
          }

          .button-group {
            .el-button {
              margin-right: 8px;
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .video_cot_area {
      background-color: var(--bg-control-panel);
      backdrop-filter: blur(10px);
      width: 100%;
    }

    // 开关组件
    .el-switch {
      .el-switch__core {
        background-color: var(--border-primary) !important;
        border-color: var(--border-primary) !important;
      }

      .el-switch__label {
        color: var(--text-secondary) !important;

        &.is-active {
          color: var(--text-primary) !important;
        }
      }
    }

    // 单选按钮组
    .el-radio-group {
      .el-radio {
        .el-radio__label {
          color: var(--text-primary) !important;
        }

        .el-radio__input.is-disabled+.el-radio__label {
          color: var(--text-muted) !important;
        }
      }
    }

    // 日期选择器
    .el-date-editor {
      .el-input__inner {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;

        &::placeholder {
          color: var(--input-placeholder) !important;
        }

        &:focus {
          border-color: var(--border-hover) !important;
        }
      }

      &.is-disabled .el-input__inner {
        background-color: var(--bg-secondary) !important;
        color: var(--text-muted) !important;
      }
    }

    // 按钮组件
    .el-button {
      &.el-button--mini {
        background-color: var(--btn-bg) !important;
        border-color: var(--border-primary) !important;
        color: var(--btn-text) !important;

        &:hover:not(.is-disabled) {
          background-color: var(--btn-bg-hover) !important;
          border-color: var(--border-hover) !important;
        }

        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
          color: var(--text-muted) !important;
        }
      }

      &.el-button--primary {
        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
        }
      }

      &.el-button--danger {
        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
        }
      }
    }
  }

  .tree_left {
    width: 350px;
    height: 100%;
    overflow: auto;
    background: #fff;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    position: relative;

    // &.with-playback {
    //   width: 20%;
    // }

    &.collapsed {
      width: 40px !important;
      overflow: hidden;

      .tree_tl,
      .playback-controls {
        opacity: 0;
        visibility: hidden;
      }
    }

    .collapse-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 40px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid #dcdfe6;
      border-right: none;
      border-radius: 4px 0 0 4px;
      z-index: 1;
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        background: #f5f7fa;
      }
    }

    .tree_tl {
      flex: 1;
      overflow: auto;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-tree {
        flex: 1;
        overflow-y: auto;
      }
    }

    .playback-controls {
      padding: 10px;
      border-top: 1px solid #ebeef5;
      background: #fff;
      transition: opacity 0.3s ease, visibility 0.3s ease;

      .control-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 10px;
        color: #303133;
      }

      .control-content {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .radio-group {
          width: 100%;
          display: flex;
          justify-content: space-between;
        }

        .date-picker-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;

          .date-picker {
            width: 100%;
          }
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
      }
    }
  }

  .video_cot_area {
    flex: 1;
    height: 100%;
    backdrop-filter: blur(10px);
    background-color: var(--bg-control-panel);
    width: 100%;
    position: relative;
  }

  /* 视频加载动画容器 */
  .video-loading-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: var(--bg-control-panel);
    z-index: 10;
  }

  /* 旋转的圆形加载器 */
  .video-loading-spinner {
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
  }

  .spinner-ring {
    width: 100%;
    height: 100%;
    border: 4px solid var(--border-primary);
    border-top: 4px solid var(--text-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* 加载文字 */
  .loading-text {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
  }

  /* 旋转动画 */
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  .video_cot {
    height: 100%;
  }

  // Element UI 组件暗色主题适配
  &.dark-theme,
  &.blue-theme {

    // 树形组件
    .el-tree {
      background: transparent !important;
      color: var(--text-primary) !important;
      flex: 1;
      scrollbar-width: thin;
      scrollbar-color: var(--bg-primary) var(--bg-sidebar);
      scrollbar-gutter: stable;

      .el-tree-node:focus>.el-tree-node__content {
        background-color: var(--bg-tertiary) !important;
      }

      .el-tree-node__content {
        color: var(--text-primary) !important;

        &:hover {
          background-color: var(--bg-tertiary) !important;
        }
      }

      .el-tree-node__expand-icon {
        color: var(--text-secondary) !important;
      }

      .custom-tree-node {
        color: var(--text-primary) !important;
      }
    }

    // 开关组件
    .el-switch {
      .el-switch__core {
        background-color: var(--border-primary) !important;
        border-color: var(--border-primary) !important;
      }

      .el-switch__label {
        color: var(--text-secondary) !important;

        &.is-active {
          color: var(--text-primary) !important;
        }
      }
    }

    // 单选按钮组
    .el-radio-group {
      .el-radio {
        .el-radio__label {
          color: var(--text-primary) !important;
        }

        .el-radio__input.is-disabled+.el-radio__label {
          color: var(--text-muted) !important;
        }
      }
    }

    // 日期选择器
    .el-date-editor {
      .el-input__inner {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;

        &::placeholder {
          color: var(--input-placeholder) !important;
        }

        &:focus {
          border-color: var(--border-hover) !important;
        }
      }

      &.is-disabled .el-input__inner {
        background-color: var(--bg-secondary) !important;
        color: var(--text-muted) !important;
      }
    }

    // 按钮组件
    .el-button {
      &.el-button--mini {
        background-color: var(--btn-bg) !important;
        border-color: var(--border-primary) !important;
        color: var(--btn-text) !important;

        &:hover:not(.is-disabled) {
          background-color: var(--btn-bg-hover) !important;
          border-color: var(--border-hover) !important;
        }

        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
          color: var(--text-muted) !important;
        }
      }

      &.el-button--primary {
        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
        }
      }

      &.el-button--danger {
        &.is-disabled {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-secondary) !important;
        }
      }
    }
  }

  .tree-node-title {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.filter-input {
  margin-bottom: 10px;
  width: 100%;


}

// 暗色主题适配 - Element UI输入框
.dark-theme .filter-input {
  .el-input__inner {
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
    color: var(--input-text) !important;
    border-radius: 0;

    &::placeholder {
      color: var(--input-placeholder) !important;
    }

    &:focus {
      border-color: var(--border-hover) !important;
    }
  }
}

// iframe主题适配 - Element UI输入框
.blue-theme .filter-input {
  .el-input__inner {
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
    color: var(--input-text) !important;
    border-radius: 0;

    &::placeholder {
      color: var(--input-placeholder) !important;
    }

    &:focus {
      border-color: var(--border-hover) !important;
    }
  }
}

.record-source-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.dark-theme .record-source-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;

  // 暗色主题适配
  .dark-theme & {
    color: var(--text-secondary);
  }
}

.divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 0 0 10px 0;
  width: 100%;
}

// 暗色主题适配
.dark-theme .divider {
  background-color: var(--border-primary);
}

// iframe主题适配
.blue-theme .divider {
  background-color: var(--border-primary);
}

.dark-theme {
  .el-picker-panel {
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
    color: var(--input-text) !important;

    .el-date-picker__header-label {
      color: var(--input-text) !important;
    }

    .el-picker-panel__content {

      .el-date-table th {
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;
      }
    }

    .el-date-picker__time-header,
    .el-picker-panel__footer {
      background-color: var(--input-bg) !important;
      border-color: var(--input-border) !important;
      color: var(--input-text) !important;

      .el-input__inner {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;
      }

      .el-button.el-button--default {
        background-color: var(--btn-bg) !important;
        border-color: var(--border-primary) !important;
        color: var(--btn-text) !important;
      }
    }

    .popper__arrow {
      border-top-color: var(--input-border) !important;

      &::after {
        border-top-color: var(--input-bg) !important;
      }
    }
  }
}

.blue-theme {
  .el-picker-panel {
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
    color: var(--input-text) !important;

    .el-date-picker__header-label {
      color: var(--input-text) !important;
    }

    .el-picker-panel__content {

      .el-date-table th {
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;
      }
    }

    .el-date-picker__time-header,
    .el-picker-panel__footer {
      background-color: var(--input-bg) !important;
      border-color: var(--input-border) !important;
      color: var(--input-text) !important;

      .el-input__inner {
        background-color: var(--input-bg) !important;
        border-color: var(--input-border) !important;
        color: var(--input-text) !important;
      }

      .el-button.el-button--default {
        background-color: var(--btn-bg) !important;
        border-color: var(--border-primary) !important;
        color: var(--btn-text) !important;
      }
    }

    .popper__arrow {
      border-top-color: var(--input-border) !important;

      &::after {
        border-top-color: var(--input-bg) !important;
      }
    }
  }
}

// 保存按钮样式
.save-controls {
  padding: 10px;
  border-bottom: 1px solid var(--border-primary);
  margin-bottom: 10px;

  .save-btn {
    width: 100%;
    background-color: var(--btn-primary-bg) !important;
    border-color: var(--btn-primary-bg) !important;
    color: var(--btn-primary-text) !important;

    &:hover {
      background-color: var(--btn-primary-hover) !important;
      border-color: var(--btn-primary-hover) !important;
    }

    i {
      margin-right: 5px;
    }
  }
}

// 主题适配
.dark-theme .save-controls .save-btn {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: #ffffff !important;

  &:hover {
    background-color: #66b1ff !important;
    border-color: #66b1ff !important;
  }
}

.iframe-theme .save-controls .save-btn {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;

  &:hover {
    background-color: #40a9ff !important;
    border-color: #40a9ff !important;
  }
}
</style>