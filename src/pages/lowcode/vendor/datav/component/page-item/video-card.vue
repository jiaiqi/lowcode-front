<template>
	<div class="video-card box">
		<el-row :gutter="computGutter" :class="computClass" v-for="(row ,i) in videoList" :key="i">
			<el-col :span="computSpan" v-for="(col, index) in row"
				:key="index"
				v-if="(index + 1) <= Number(pageItem.video_card_json.card_layout_json.cols_num)">
				<div class="video-item" @click="toVideoPlayer(col)">
					<img class="video-bg" :src="col.url || defPic">
					<img class="play-btn" v-if="col.showPlayImg" src="@/assets/img/video-play-btn.png">
				<div class="video-title" :style="[titleStyle]">{{ col[pageItem.video_card_json.col_label] }}</div>

				</div>
			</el-col>
		</el-row>
	</div>
</template>

<script>
import {$http} from '@/common/http.js'
export default {
	name: 'video-card',
	props: {
		pageItem: {
			type: Object
		}
	},
	data() {
		return {
			accessToken: '',
			videoList: [],
			defPic: this.getImagePath(this.pageItem.video_card_json.preview_default),
			showLoading: true
		};
	},
	computed: {
		titleStyle(){
			let style = { }
			let position = this.pageItem.video_card_json?.video_label_option
			if(position === '下方'){
				style = {
					position:'absolute',
					width:'100%',
					left:'0',
					bottom:'0',
					padding:'0',
					color:'#fff',
					background:'rgb(0 0 0 / 50%)'
				}
			}
			return style
		},
		computGutter() {
			return this.pageItem.video_card_json?.card_layout_json?.style_json_diy?.margin || 20
		},
		computSpan() {
			return 24 / Number(this.pageItem.video_card_json?.card_layout_json?.cols_num) || 12
		},
		computClass() {
			if (this.pageItem.video_card_json.video_label_option === '下方') {
				return 'row-layout big'
			} else {
				return 'row-layout small'
			}
		},
	},
	mounted() {
		let params = {}
		if (this.pageItem.srv_req_json) {
			params = this.pageItem.srv_req_json
		}
		this.getVideoList(params)
	},
	methods: {
		async getVideoList(p) {
			if (!p.serviceName || !p.mapp) return

			const url = `/${p.mapp}/select/${p.serviceName}`
			const req = {
				"serviceName": p.serviceName,
				"colNames": p.colNames,
				"condition": p.condition
			}
			const res = await $http.post(url, req)
			if (res.data.state === 'SUCCESS' && Array.isArray(res.data.data) && res.data.data.length > 0) {
				let resData = res.data.data
				const leng = resData.length
				let rowsNum = 0
				if (this.pageItem.video_card_json.card_layout_json.rows_max) {
					rowsNum = Number(this.pageItem.video_card_json.card_layout_json.rows_max)
				}
				let colsNum = 0
				if (this.pageItem.video_card_json.card_layout_json.cols_num) {
					colsNum = Number(this.pageItem.video_card_json.card_layout_json.cols_num)
				}
				for (let i = 0; i < rowsNum; i++) {
					this.videoList[i] = []
					let count = 0
					for (let j = 0; j < leng; j++) {
						if (j < colsNum && count < colsNum && resData[j]) {
							let obj = {}
							obj.url = this.defPic
							const resObj = {
								...obj,
								...resData[j]
							}
							this.videoList[i].push(resObj)
							resData.splice(j--, 1)
							count++
						}
					}
				}
				this.$forceUpdate()

				for (let i = 0; i < this.videoList.length; i++) {
					for (let j = 0; j < this.videoList[i].length; j++) {
						let url = null
						url = await this.getPicUrl(this.videoList[i][j])
						if (url) {
							this.videoList[i][j].url = url
							this.videoList[i][j].showPlayImg = true
						} else {
							this.videoList[i][j].showPlayImg = false
						}
					}
				}
				this.$forceUpdate()

				this.showLoading = false

				if (resData.length > 0) {
					this.getAccessToken(resData[0])
				}
			}
		},
		async getPicUrl(o) {
			if (!o) return

			const url = `/liot/select/srvliot_capture_select`
			const req = {
				"serviceName": "srvliot_capture_select",
				"condition": [{
					"colName": "sn",
					"ruleType": "eq",
					"value": o.dev_sn
				},
				{
					"colName": "channel_no",
					"ruleType": "eq",
					"value": o.channel
				}
				]
			}
			const res = await $http.post(url, req)
			if (res.data.state === 'SUCCESS' && Array.isArray(res.data.data) && res.data.data.length > 0) {
				let pic = res.data.data[0].picUrl
				return pic
			}
		},
		async getAccessToken(o) {
			const url = `/liot/select/srvliot_play_address_select`
			const req = {
				"serviceName": "srvliot_play_address_select",
				"condition": [{
					"colName": "sn",
					"ruleType": "eq",
					"value": o.dev_sn
				},
				{
					"colName": "channel_no",
					"ruleType": "eq",
					"value": o.channel
				},
				{
					"colName": "vcode",
					"ruleType": "eq",
					"value": o.verify_code
				},
				]
			}
			const res = await $http.post(url, req)
			if (res.data.state === 'SUCCESS' && Array.isArray(res.data.data) && res.data.data.length > 0) {
				const data = res.data.data[0]
				this.accessToken = data.accessToken
			}
		},
		toVideoPage(o) {
			if (!o.url) return
			const url = `/player?deviceSerial=${o.dev_sn}&channelNo=${o.channel}&verify_code=${o.verify_code}`
			window.open(url)
		},
		toVideoPlayer(o) {
			if (!o.url) return
			const url = `/player?deviceSerial=${o.dev_sn}&channelNo=${o.channel}&verify_code=${o.verify_code}`
			this.$router.push({
				path:url
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.el-col{
	position: relative;
}
.row-layout {
	padding: 5px;

	&.big {
		.video-item {
			height: 104px;
			position: relative;
			cursor: pointer;
			.video-bg {
				width: 100%;
				height: 104px;
			}

			.play-btn {
				width: 24px;
				height: 24px;
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
			}
		}

		.video-title {
			height: 32px;
			background-color: #fff;
			color: #324274;
			line-height: 32px;
			font-size: 14px;
			padding-left: 12px;
		}
	}

	&.small {
		.video-item {
			height: 76px;
			position: relative;

			.video-bg {
				height: 76px;
			}

			.play-btn {
				width: 16px;
				height: 16px;
				position: absolute;
				right: 8px;
				top: 8px;
			}
		}

		.video-title {
			position: relative;
			bottom: 24px;
			z-index: 1;
			background-color: rgba(21, 21, 21, 0.67);
			height: 24px;
			line-height: 24px;
			color: #fff;
			padding-left: 12px;
			font-size: 12px;
		}
	}

	.video-loading {
		position: absolute;
		top: 40%;
		left: 45%;
		transform: translate(-50%, -50%);
	}
}
</style>
