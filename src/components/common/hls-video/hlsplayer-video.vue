<template>
  <div class="video_hls">
    <video
      class="video-box"
      :style="videoStyle"
      :id="playerId"
      controls
      preload="auto"
      autoplay="true"
    ></video>
  </div>
</template>
<script>
import Hls from './player/dhhls.min.js';
import { Message } from 'element-ui'
import { $http } from "@/common/http";
export default {
  name: "hlsplayer-video",
  data() {
    return {
      hlsplayer: null,
      playerId: 'hls_video_' + Math.random().toString(36).substr(2, 9),
      chnols: null
    }
  },
  props: {
    pageItem: {
      type: Object,
    },
    cellItem: {
      type: Object,
    },
    cellItemData: {
      type: [Object, String],
    },
    chnol: {
      type: String,
    }
  },
  watch: {
    chnol: {
      handler(val) {
        if (val) {
          this.chnols = val;
        }
      },
      immediate: true,
      deep: true
    },
    cellItemData: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val && val.chnl_no && this.cellItem) {
          this.getModVideoInfo(val.chnl_no);
        }
      }
    }
  },
  computed: {
    //获取接口信息
    setDataInfo() {
      return this.pageItem.srv_req_type === '请求数据' ? this.pageItem.srv_req_json : null
    },

    //设置标签基础宽高样式
    videoStyle() {
      console.log('*****', this.pageItem)
      let style = this.cellItem?.style_json
      if (style) {
        return {
          width: style.width,
          height: style.height
        }
      } else {
        return {}
      }
    },
  },
  methods: {
    //弹窗获取视频通道信息
    async getModVideoInfo(chnl_no) {
      let url = '/iot/select/srviot_dev_mon_channel_party_select'
      let req = {
        page: { pageNo: 1, rownumber: 10 },
        serviceName: "srviot_dev_mon_channel_party_select",
        colNames: ["*"],
        condition: [{ colName: "chnl_no", ruleType: "like", value: chnl_no }]
      }
      const res = await $http.post(url, req);
      if (res.data.state !== 'SUCCESS') return;
      let rows = res.data.data[0]
      this.playHls(rows.url)
    },
    //获取视频数据通道接口
    async getVideoInfoById() {
      if (this.setDataInfo) {
        let req = typeof this.pageItem.srv_req_json === 'string' ? JSON.parse(this.pageItem.srv_req_json) : this.pageItem.srv_req_json
        let setParams = {
          page: req.page,
          serviceName: req.serviceName,
          colNames: ['*'],
          condition: this.chnols ? [
            {
              "colName": "chnl_no",
              "ruleType": "eq",
              "value": this.chnol
            }
          ] : req.condition,  //通道参数在接口配置时直接填入
        }
        const url = `/${req.mapp}/select/${req.serviceName}`;
        const res = await $http.post(url, setParams);
        if (res.data.state !== 'SUCCESS') return;
        let rows = res.data.data[0]
        this.playHls(rows.url)
      }
    },
    //自动检测是否支持播放
    autoTestSupHls() {
      //检测浏览器是否支持HLS 播放器
      if (!Hls.isSupported()) {
        return Message.error('浏览器不支持改格式的视频,hls H265视频编码播放仅Chrome104及以上版本支持,请升级');
      }
      this.getVideoInfoById()
      // this.playHls('http://124.160.33.135:4091/live/cameraid/1002612%243/substream/1.m3u8?token=3:CqBAmxo26cidO0YVsODxs5ppWy1XgTsx')
    },
    //hls视频播放
    playHls(url) {
      console.log('播放的视频流地址', url)
      //每次初始化前先判断播放实例是否存在，存在时将其销毁
      if (this.hlsplayer != null) {
        this.hlsplayer.destroy();
      }
      //创建播放
      let video = document.getElementById(this.playerId);
      if (Hls.isSupported()) {
        this.hlsplayer = new Hls();
        this.hlsplayer.loadSource(url);
        this.hlsplayer.attachMedia(video);
        this.hlsplayer.on(Hls.Events.MANIFEST_PARSED, function () {
          //强制关闭hls自带的关闭按钮显示，这里的样式名称是在依赖js中手动强制加上的
          let els = document.getElementsByClassName('hls_close');
          if (els && els.length > 0) {
            Array.from(els).forEach(d => { d.style.display = "none"; });
          }
          if (video) {
            this.playerPlay(video)
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log("apple原生");
        // 如果支持原生播放
        video.src = url;
      }

    },
    //解决video媒体组件在初始化后第一帧加载延迟引起的异常
    playerPlay(player) {
      let thePromise = player.play()
      if (thePromise != undefined) {
        thePromise.then(function (_) {
          player.stop();
          player.currentTime = 0;
          player.play();
        })
          .catch(error => {
            console.log(error);
          });
      }
      else {
        player.play()
      }
    }
  },
  mounted() {
    console.log('cellItemData', this.cellItemData)
    console.log('弹窗视频信息', this.cellItem);
    this.autoTestSupHls();

  }
}
</script>
<style scoped lang="scss">
.video_hls {
  width: 100%;
  height: 100%;
  background: #000;
}

.video-box {
  width: 100%;
  height: 100%;
}
</style>