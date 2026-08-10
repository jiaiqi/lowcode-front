<template>
  <div
    class="swiper-list"
    v-if="!swiperList || swiperList.length === 0"
  >
    <span v-if="pageItem && pageItem.com_label">{{ pageItem.com_label }}</span>
  </div>

  <div
    class="swiper-list"
    :class="{ 'left-bottom-dot': dotPostion === 'left-bottom' }"
    id="home-swiper-list"
    :data-order-no="pageItem['order_no']"
    v-else-if="pageItem"
  >
    <stack-swiper
      :swiper-style="tagStylefn(pageItem.swiper_json.style_json)"
      :swiper-list="swiperList"
      :layoutMode="swiperStyle"
      :page-item="pageItem"
      :cardJson="getCardJson"
      @on-tap="toDetail"
      @change="swiperChange"
      v-if="swiperStyle && ['堆叠1', '堆叠2'].includes(swiperStyle)"
    ></stack-swiper>
    <el-carousel
      class="card-swiper square-dot"
      :indicator-dots="false"
      :style="[tagStylefn(pageItem.swiper_json.style_json)]"
      :circular="true"
      :autoplay="true"
      :interval="5000"
      duration="500"
      arrow="always"
      @change="swiperChange"
      indicator-color="#333"
      indicator-active-color="#E8E8E8"
      v-else-if="swiperList.length > 1 && swiperStyle === '卡片'"
    >
      <template v-for="(item, index) in swiperList">
        <el-carousel-item
          :key="index"
          :class="current == index ? 'cur' : ''"
          v-if="item.url"
        >
          <div class="swiper-item">
            <div class="swiper-item-box">
              <video
                :src="item.url"
                controls
                :id="item.url && item.store_video_file"
                :poster="item.videoPoster"
                v-if="
                  item.url && item.file_type === '视频' && current === index
                "
              ></video>
              <img
                lazy-load
                :src="item.url"
                mode="scaleToFill"
                decoding="async"
                v-else-if="
                  item.url &&
                  (!item.store_video_file || item.file_type !== '视频')
                "
                @click.stop="toDetail(item)"
              />
              <div v-else-if="!item.url" class="no-image-placeholder">
                <i class="el-icon-picture-outline no-image-icon"></i>
                <span class="no-image-text">暂无图片</span>
              </div>
            </div>
          </div>
        </el-carousel-item>
      </template>
    </el-carousel>
    <div
      class="swiper-cot"
      v-else-if="
        swiperList.length > 1 ||
        (swiperList.length === 1 && swiperList[0].type === 'vr')
      "
      style="height: 100%"
    >
      <div
        class="swiper-mian"
        :class="{
          'thumbnails-mode': useThumbnails,
        }"
      >
        <el-carousel
          ref="carousel"
          class="screen-swiper item-box rectangle-dot"
          :style="[tagStylefn(pageItem.swiper_json.style_json)]"
          easing-function="linear"
          indicator-active-color="#00aaff"
          :indicator-dots="true"
          :circular="true"
          :autoplay="autoplay"
          :interval="interval"
          duration="500"
          @change="swiperChange"
        >
          <template v-for="(item, index) in swiperList">
            <el-carousel-item
              :key="item.url ? item.url : index"
              :data-id="item.id"
              :class="current == index ? 'cur' : ''"
              v-if="item.url"
            >
              <div
                class="swiper-item-box"
                @click.stop="toDetail(item)"
                :class="{ 'is-vr': item.type === 'vr' }"
              >
                <img
                  :src="item.videoPoster"
                  mode="scaleToFill"
                  decoding="async"
                  v-if="item.url && item.file_type === '视频'"
                />
                <img
                  :src="item.url"
                  mode="scaleToFill"
                  decoding="async"
                  v-else-if="
                    item.url &&
                    (!item.store_video_file || item.file_type !== '视频')
                  "
                />
                <div v-else-if="!item.url" class="no-image-placeholder">
                  <i class="el-icon-picture-outline no-image-icon"></i>
                  <span class="no-image-text">暂无图片</span>
                </div>
                <!-- VR遮罩层 -->
                <div
                  class="vr-overlay"
                  v-if="item.type === 'vr' && item.vrLink"
                >
                  <a
                    class="vr-icon"
                    target="_blank"
                    :href="getVrUrl(item.vr_no, item.vrLink)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlns:xlink="http://www.w3.org/1999/xlink"
                      viewBox="0 0 1024 1024"
                      width="72"
                      height="72"
                      style=""
                      filter="none"
                    >
                      <g>
                        <path
                          d="M779.648 429.952l99.648 144.896c-25.856 0-49.408-1.28-72.768 0.448-18.304 1.344-28.8-4.928-38.848-20.352-25.6-39.744-53.44-78.08-80.064-117.12-3.968-5.76-8.128-8.576-15.36-8.32-13.76 0.64-27.52 0.192-42.88 0.192v144.128H548.352c-0.32-3.264-0.832-6.656-0.832-10.048 0-66.688 0.192-133.312-0.256-199.936-0.064-10.88 3.328-13.824 14.08-13.696 63.488 0.448 126.976 0.256 190.464 0.256h9.472c17.728-0.96 30.848-13.824 30.656-29.824a30.592 30.592 0 0 0-30.784-29.696c-32-0.384-63.872-0.128-95.872-0.128H548.544V212.864c4.16-0.256 8.32-0.64 12.544-0.64h248.448c41.6 0 63.296 21.76 63.616 63.36 0.256 30.464 0.448 60.8 0.384 91.136-0.128 39.68-23.808 63.04-63.488 63.232h-30.4zM136.256 212.288c28.8 0 55.68-0.384 82.368 0.448 3.328 0.128 7.872 5.632 9.6 9.6 27.136 65.472 54.144 130.944 80.896 196.608 4.032 9.856 7.424 19.968 12.352 29.376 2.176 4.288 7.232 10.048 10.88 9.92 3.648-0.128 8.896-5.76 10.752-10.24a26795.52 26795.52 0 0 0 94.208-221.76c4.48-10.624 9.536-14.848 21.376-14.336 23.936 1.024 47.872 0.32 73.92 0.32-2.176 5.44-3.52 8.96-5.12 12.416l-140.16 317.696c-11.008 25.216-28.928 40-57.152 39.552-27.52-0.448-45.184-15.296-55.68-40.128-44.608-105.92-89.344-211.84-134.08-317.696-1.408-3.136-2.304-6.464-4.16-11.776z m-55.168 243.712a151.232 151.232 0 0 0-23.104 20.096C29.312 506.176 29.184 544 57.792 574.336c23.68 25.152 53.248 41.6 84.288 55.744 52.48 23.872 108.288 35.712 164.864 44.096 27.776 4.096 73.92 8.96 138.368 14.528V616.896l126.016 109.696-126.016 110.72v-76.672a2250.88 2250.88 0 0 1-108.672-8.96c-87.68-11.52-172.48-33.28-248.384-80.64a347.648 347.648 0 0 1-60.288-49.088C-5.12 588.928-8.704 546.816 16.576 507.52 43.52 465.92 83.84 441.408 129.6 424.832c-16.256 10.24-32.768 20.224-48.576 31.168z m808.32-27.648c42.432 16.64 94.976 36.096 113.728 76.864 18.752 40.832 8.832 83.392-21.696 116.736-32.96 36.032-119.424 109.888-334.336 129.728-36.736 2.048-44.8-59.712-7.872-68.096 72-16.448 221.888-30.08 308.096-108.16 27.84-27.776 26.624-76.48 0-105.792-22.912-23.424-46.912-33.728-57.92-41.28z"
                          p-id="13112"
                          fill="rgba(255,255,255,1)"
                        ></path>
                      </g>
                    </svg>
                  </a>
                </div>
                <div
                  class="title"
                  v-if="item._title && !isTopSwiperBottomContent"
                >
                  {{ item._title }}
                </div>
              </div>
            </el-carousel-item>
          </template>
        </el-carousel>
      </div>
      <div
        class="content-card"
        v-if="isTopSwiperBottomContent && activeData && activeData.id"
      >
        <card-group-cell
          :page-item="pageItem"
          :cellsLayout="[getCardJson]"
          :cell-data="[item]"
          v-for="(item, index) in swiperList"
          v-if="index === current"
          :key="item.id ? item.id : index"
        ></card-group-cell>
      </div>
      <div
        class="thumbnails-container"
        v-else-if="useThumbnails"
      >
        <button
          class="scroll-btn scroll-btn-left"
          @click="scrollThumbnails('left')"
          :disabled="scrollPosition <= 0"
          type="button"
        >
          <i class="el-icon-arrow-left"></i>
        </button>
        <div
          class="thumbnails"
          ref="thumbnailsContainer"
        >
          <template v-for="(item, index) in swiperList">
            <img
              :key="item.id"
              :src="item._thumbnail || item.url"
              @click="changeCarousel(index)"
              :class="{ active: current === index }"
              alt=""
              class="thumbnail-img"
              v-if="item.url"
            />
          </template>
        </div>
        <button
          class="scroll-btn scroll-btn-right"
          @click="scrollThumbnails('right')"
          :disabled="scrollPosition >= maxScrollPosition"
        >
          <i class="el-icon-arrow-right"></i>
        </button>
      </div>
    </div>

    <div
      class="single-media"
      v-else
    >
      <div
        class="swiper-item-box"
        :style="[tagStylefn(pageItem.swiper_json.style_json)]"
        v-for="(item, index) in swiperList"
        :key="item.url"
        :data-id="item.id"
      >
        <video
          :src="item.url"
          controls
          v-if="item.url && item.file_type === '视频' && current === index"
          :id="item.store_video_file"
          :poster="item.videoPoster"
        ></video>
        <img
          lazy-load
          :src="item.url"
          mode="scaleToFill"
          v-else-if="
            item.url && (!item.store_video_file || item.file_type !== '视频')
          "
          @click.stop="toDetail(item)"
        />
        <div v-else-if="!item.url" class="no-image-placeholder">
          <i class="el-icon-picture-outline no-image-icon"></i>
          <span class="no-image-text">暂无图片</span>
        </div>
        
        <div
          class="title"
          v-if="item._title"
        >{{ item._title }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatStyleData, rpx2px } from "../../common/index.js";
import cardGroupCell from "./card-group-cell/card-group-cell.vue";
import StackSwiper from "./stack-swiper/stack-swiper.vue";
export default {
  name: "slide-list",
  components: {
    cardGroupCell,
    StackSwiper,
  },
  computed: {
    //判定是否含有缩略图显示选项
    useThumbnails() {
      return this.pageItem?.swiper_json?.swiper_options?.includes("缩略图");
    },
    isTopSwiperBottomContent() {
      return this.pageItem?.swiper_json?.swiper_options?.includes("上图下文");
    },
    getCardJson() {
      return this.pageItem?.swiper_json?.card_json;
    },
    swiperJson() {
      return this.pageItem?.swiper_json;
    },
    swiperStyle() {
      return this.swiperJson?.swiper_layout || "平铺";
    },
    interval() {
      return this.pageItem?.more_config?.interval || 5000;
    },
    autoplay() {
      return this.pageItem?.more_config?.autoplay === false ? false : true;
    },
    dotPostion() {
      return this.pageItem?.more_config?.dotPosition || "bottom-center";
    },
    height() {
      if (this.pageItem?.img_ratio) {
        return `${350 * this.pageItem?.img_ratio}px`;
      }
      return `${this.pageItem?.more_config?.swiperHeight || 150}px`;
    },
    calcStyle() {
      let obj = {};
      if (
        this.pageItem &&
        (this.pageItem.margin || this.pageItem.margin == 0)
      ) {
        obj.margin = this.pageItem.margin;
      }
      if (this.height) {
        obj.height = this.height;
        obj.minHeight = this.height;
      }
      return this.pageItem.swiper_json.style_json;
      // return `height:${obj.height}!important;min-height:${obj.minHeight}`
    },
    activeData() {
      return this.swiperList?.[this.current];
    },
  },
  props: {
    pageItem: {
      type: Object,
    },
    beforeClick: {
      type: Function,
      default: null,
    },
    queryOptions: Object,
  },
  data() {
    return {
      storeNo: "",
      current: 0,
      swiperList: [],
      videoContext: {},
      isFirstSwiperList: false,
      scrollPosition: 0,
      maxScrollPosition: 0,
      isManualScrolling: false, // 标记是否正在手动滚动
    };
  },
  mounted() {
    this.getSwiperList();
  },
  updated() {
    this.$nextTick(() => {
      this.updateScrollPosition();
    });
  },
  methods: {
    getVrUrl(no, link) {
      if (link) {
        return link;
      }
      return `/VRhome/#/ModView?no=${no}`;
    },
    changeCarousel(index) {
      this.$refs.carousel.setActiveItem(index);
    },
    scrollThumbnails(direction) {
      const container = this.$refs.thumbnailsContainer;
      if (!container) return;

      // 设置手动滚动标志
      this.isManualScrolling = true;

      const thumbnailWidth = 100; // 图片宽度
      const thumbnailGap = 5; // 图片间距
      const scrollAmount = thumbnailWidth + thumbnailGap; // 一个图片的宽度
      if (direction === "left") {
        this.scrollPosition = Math.max(0, this.scrollPosition - scrollAmount);
      } else {
        this.scrollPosition = Math.min(
          this.maxScrollPosition,
          this.scrollPosition + scrollAmount
        );
      }
      container.scrollTo({
        left: this.scrollPosition,
        behavior: "smooth",
      });

      // 滚动完成后重置标志
      setTimeout(() => {
        this.isManualScrolling = false;
      }, 500); // 500ms后重置，确保滚动动画完成
    },
    updateScrollPosition() {
      const container = this.$refs.thumbnailsContainer;
      if (!container) return;

      this.maxScrollPosition = Math.max(
        0,
        container.scrollWidth - container.clientWidth
      );
    },
    scrollToActiveThumbnail() {
      if (!this.useThumbnails || this.isManualScrolling) return;

      const container = this.$refs.thumbnailsContainer;
      if (!container) return;

      const thumbnailWidth = 100; // 图片宽度
      const thumbnailGap = 5; // 图片间距
      const itemWidth = thumbnailWidth + thumbnailGap;

      // 计算当前active thumbnail的位置
      const activeItemLeft = this.current * itemWidth;
      const activeItemRight = activeItemLeft + thumbnailWidth;

      // 获取容器的可视区域
      const containerWidth = container.clientWidth;
      const currentScrollLeft = container.scrollLeft;
      const visibleLeft = currentScrollLeft;
      const visibleRight = currentScrollLeft + containerWidth;

      // 判断是否需要滚动
      let newScrollPosition = currentScrollLeft;

      if (activeItemLeft < visibleLeft) {
        // 如果active item在可视区域左侧，滚动到该item
        newScrollPosition = activeItemLeft;
      } else if (activeItemRight > visibleRight) {
        // 如果active item在可视区域右侧，滚动使其显示在右边界
        newScrollPosition = activeItemRight - containerWidth;
      }

      // 确保滚动位置在有效范围内
      newScrollPosition = Math.max(
        0,
        Math.min(newScrollPosition, this.maxScrollPosition)
      );

      if (newScrollPosition !== currentScrollLeft) {
        this.scrollPosition = newScrollPosition;
        container.scrollTo({
          left: newScrollPosition,
          behavior: "smooth",
        });
      }
    },
    tagStylefn(style) {
      if (style) {
        return formatStyleData(style);
      }
    },
    swiperChange(e) {
      if (this.videoContext.parse) {
        this.videoContext.parse();
      }
      this.current = e?.detail?.current || e;
      this.$nextTick(() => {
        // 自动滚动thumbnails到当前active的图片
        this.scrollToActiveThumbnail();
      });
    },
    async fetchJumpJson(jump_no) {
      const url = `${window.backendIpAddr}/config/select/srvpage_cfg_jump_action_select`;
      const req = {
        serviceName: "srvpage_cfg_jump_action_select",
        colNames: ["*"],
        condition: [
          {
            colName: "jump_no",
            ruleType: "like",
            value: jump_no,
          },
        ],
        page: {
          pageNo: 1,
          rownumber: 1,
        },
      };
      const res = await this.$http.post(url, req);
      if (res?.data?.data?.length) {
        return res.data.data[0];
      }
    },
    async toDetail(item) {
      if (item?.type === "vr" && item.vr_no) {
        return;
        // const url = `/VRhome/#/ModView?no=${item.vr_no}`;
        // open(url);
      } else if (
        this.pageItem?.swiper_json?.img_origin === "接口请求" &&
        item[this.pageItem?.swiper_json?.srv_col_jump_no]
      ) {
        const jumpJson = await this.fetchJumpJson(
          item[this.pageItem?.swiper_json?.srv_col_jump_no]
        );
        if (jumpJson?.row_json) {
          this.jumpAction(jumpJson?.row_json, item);
        }
        return;
      }
      let jumpUrl = "";
      if (jumpUrl) {
        open(jumpUrl);
      } else if (item.mini_program_url) {
      } else if (this.swiperJson?.card_json?.jump_json) {
        this.jumpAction(this.swiperJson?.card_json?.jump_json, item);
      } else if (item.content_no || item.content) {
        // 跳到文章详情
        this.$router.push({
          path: `/site/PG2504171010470001`,
          query: {
            content_no: item.content_no || item.article_no || "",
            id: item.id,
          },
        });
      } else {
        // this.toPredivimg(item.url);
      }
    },
    async getFilePath(file_no) {
      let url = `${window.backendIpAddr}/file/select/srvfile_attachment_guest_select`;
      let req = {
        serviceName: "srvfile_attachment_guest_select",
        colNames: ["*"],
        condition: [
          {
            colName: "file_no",
            value: file_no,
            ruleType: "eq",
          },
        ],
      };
      if (file_no) {
        let response = await this.$http.post(url, req);
        // console.log('srvfile_attachment_select', response);
        if (
          response.data.state === "SUCCESS" &&
          response.data.data.length > 0
        ) {
          return response.data.data;
        }
      }
    },
    async fetchVrInfo(vr_no) {
      const req = {
        "serviceName": "srvpark_vr_sandbox_select",
        "colNames": ["*"],
        "condition": [{ "colName": "vr_no", "ruleType": "eq", "value": vr_no }],
        "page": { "pageNo": 1, "rownumber": 1 },
      }
      const url = `/park/select/srvpark_vr_sandbox_select`
      const res = await this.$http.post(url, req)
      if (res.data.state === 'SUCCESS' && Array.isArray(res.data.data) && res.data.data.length) {
        return res.data.data[0]
      }
    },
    async getSwiperList() {
      const swiperJson = this.pageItem?.swiper_json;
      let data = null;
      let list = []
      if (swiperJson?.image_origin === "接口请求") {
        let reqJson =
          this.pageItem.swiper_json.srv_req_json || this.pageItem.srv_req_json;
        const app =
          reqJson.mapp ||
          this.resolveDefaultSrvApp?.() ||
          this.$route.query.srvApp;
        const url = `/${app}/select/${reqJson.serviceName}`;
        reqJson = JSON.parse(
          this.renderStr(JSON.stringify(reqJson), { ...this.$route.query })
        );
        const res = await this.$http.post(url, reqJson);
        if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
          data = res.data.data[0];
          list = res.data.data.map((item, index) => {
            return {
              ...item,
              url: this.getImagePath(item[swiperJson?.srv_col_image]),
              _thumbnail: this.getImagePath(
                item[swiperJson?.srv_col_image],
                100
              ),
              _title:
                (swiperJson?.srv_col_title &&
                  item[swiperJson?.srv_col_title]) ||
                "",
            };
          });
          if (swiperJson?.swiper_options?.includes("单行数据多张图片")) {
            const fileNo = res.data.data[0]?.[swiperJson?.srv_col_image];
            if (fileNo) {
              const response = await this.selectFileList(fileNo);
              list = [];
              const prefix = this.serviceApi().downloadFile;
              for (let i in response.body.data) {
                let file = response.body.data[i];
                file.name = response.body.data[i].src_name;
                file.url = `${prefix}${response.body.data[i].fileurl}`;
                if (file?.fileurl?.indexOf("http") === 0) {
                  file.url = file.fileurl;
                }

                // file._thumbnail = `${prefix}${response.body.data[i].fileurl}?thumbnailType=fwsu_40`;
                file._thumbnail = file.url; //缩略图部分展示不出来，先用原图

                list.push(file);
              }
            }
          } else if (!this.getCardJson) {
            // 纯图的轮播图，过滤没有图片的数据
            list = list.filter(
              (item) => item && item[swiperJson?.srv_col_image]
            );
          }
        }
      }

      // list = list.filter((item) => item && item.url)

      if ((swiperJson?.image_origin === "集中传图" || !list.length) && swiperJson?.image) {
        let res = await this.getFilePath(swiperJson?.image);
        if (Array.isArray(res)) {
          list = res.reduce((pre, cur) => {
            if (cur.fileurl) {
              cur.url =
                `${window.backendIpAddr}/file/download?filePath=` +
                cur.fileurl +
                "&bx_auth_ticket=" +
                sessionStorage.getItem("bx_auth_ticket");
            }
            pre.push(cur);
            return pre;
          }, []);
        }
      }
      this.swiperList = list
      if (swiperJson?.vr_no_col && swiperJson?.vr_cover) {
        let img = swiperJson?.vr_cover;
        let name = "";
        let vrNo = swiperJson?.vr_no;
        let vrLink = "";
        if (data && typeof data === "object") {
          if (swiperJson.vr_img_col) {
            let col = swiperJson.vr_img_col;
            if (col?.includes(".") && !col?.includes("${")) {
              img = this.renderStr("${" + col + "}", data) || img;
            } else {
              img = data[col] || img;
            }
          }
          if (swiperJson.vr_no_col) {
            let col = swiperJson.vr_no_col;
            if (col?.includes(".") && !col?.includes("${")) {
              vrNo = this.renderStr("${" + col + "}", data);
            } else {
              vrNo = data[col];
            }
          }
        }
        if (vrNo) {
          const vrInfo = await this.fetchVrInfo(vrNo)
          if(vrInfo && vrInfo.vr_cover){
            img = vrInfo.vr_cover
          }
          vrLink = `/VRhome/#/ModView?vr_no=${vrNo}`
          if (process.env.NODE_ENV === 'development') {
            vrLink = window.backendIpAddr?.replace('/bxapi', '') + `/VRhome/#/ModView?vr_no=${vrNo}`
          }
          this.swiperList.unshift({
            _thumbnail: this.getImagePath(img, 100),
            url: this.getImagePath(img),
            type: "vr",
            vr_no: vrNo,
            vrLink,
          });
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.swiper-list {
  // border-radius: 20rpx;
  overflow: hidden;
  position: relative;
  // min-width: 335px;
  height: 100%;
  width: 100%;

  .item-box {
    height: 100%;
    width: 100%;
  }

  ::v-deep .el-carousel__container {
    height: 100%;
    width: 100%;
  }

  .swiper-item-box {
    width: 100%;
    height: 100%;
    position: relative;

    .title {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 10;
      background-color: rgba($color: #000000, $alpha: 0.5);
      color: #fff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 10px;
      box-sizing: border-box;
    }

    video,
    img {
      width: 100%;
      height: 100%;
      object-fit: fill;
      min-height: 100px;
    }
  }

  .home-btn {
    position: absolute;
    right: 20rpx;
    top: 20rpx;
    z-index: 10;

    .cu-btn {
      width: 80rpx;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      background-color: rgba($color: #000000, $alpha: 0.1);
      // border: 1rpx solid #c2c2c2;
      color: #fff;
      border-radius: 50%;
      font-size: 40rpx;
      margin: 0;
      padding: 0;
    }
  }
}

.thumbnails-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
  position: relative;
}

.thumbnails {
  display: flex;
  overflow-x: hidden;
  // scroll-behavior: smooth;
  flex: 1;
  margin: 0;
  gap: 5px;
}

.thumbnail-img {
  width: 100px;
  height: 60px;
  cursor: pointer;
  object-fit: cover;
  border-radius: 4px;
  transition: filter 0.3s ease;
  flex-shrink: 0;
  filter: opacity(0.3);
}

.thumbnail-img:hover {
  filter: opacity(0.8);
}

.thumbnail-img.active {
  filter: opacity(1);
}

.scroll-btn {
  width: 24px;
  height: 60px;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background-color: #bdb6b6;
  color: #fff;
}

.scroll-btn:hover:not(:disabled) {
  background-color: #858585;
  font-size: 20px;
}

.scroll-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.scroll-btn-left {
  margin-right: 5px;
}

.scroll-btn-right {
  margin-left: 5px;
}

.thumbnails-mode {
  :deep(.el-carousel) {
    .el-carousel__indicators {
      display: none;
    }
  }
}

// VR遮罩样式
.vr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);

  .vr-icon {
    margin-bottom: 8px;
    animation: vrPulse 3s infinite;
    background-color: rgba(16, 16, 16, 0.3);
    padding: 30px;
    border-radius: 50%;
    cursor: pointer;

    svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
}

// VR图标脉冲动画
@keyframes vrPulse {

  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

// VR元素悬停效果
.swiper-item-box.is-vr:hover {
  .vr-overlay {
    background: rgba(0, 0, 0, 0.2);

    .vr-icon {
      transform: scale(1.2);
      // &:hover {
      // animation-play-state: paused;
      // }
    }
  }
}

::v-deep .el-carousel__container {
  .el-carousel__arrow {
    width: min(60px, 20%);
    height: min(60px, 20%);
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    font-size: 30px;
    font-weight: 600;
  }
}

.no-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #999;
  border: 1px dashed #ddd;
  border-radius: 4px;
  min-height: 150px;
}

.no-image-icon {
  font-size: 48px;
  margin-bottom: 10px;
  color: var(--primary-color,#4EAAEB);
}

.no-image-text {
  font-size: 16px;
}
</style>