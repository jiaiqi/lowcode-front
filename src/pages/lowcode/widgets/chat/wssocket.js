var websock = null;
let rec; //断线重连后，延迟5秒重新创建WebSocket连接  rec用来存储延迟请求的代码
let closed = false; //手动关闭标记：close() 置 true，阻止关闭后残留的重连/心跳定时器继续 connect/send
let isConnect = false; //连接标识 避免重复连接
let connectCallBack= null;
let messageCallBack = null;
let closeCallBack = null


let connect = (wsurl,accessToken) => {
	try {
		if (isConnect) {
			return;
		}
		closed = false; //重新发起连接时清除手动关闭标记
		console.log("连接WebSocket");
		websock = new WebSocket(wsurl); 
		websock.onmessage = function(e) {
			let sendInfo = JSON.parse(e.data)
			if (sendInfo.cmd == 0) {	
				heartCheck.start()
				// 登录成功才算真正完成连接
				connectCallBack && connectCallBack();
				console.log('----这是lc_pcWebSocket登录成功')
			} else if (sendInfo.cmd == 1) {
				// 重新开启心跳定时
				heartCheck.reset();
			} else {
				// 其他消息转发出去
				console.log("----这是lc_pc获取的信息,收到消息:",sendInfo);
				messageCallBack && messageCallBack(sendInfo.cmd, sendInfo.data)
			}
		}
		websock.onclose = function(e) {
			console.log('----这是lc_pc获取的信息,WebSocket连接关闭')
			isConnect = false; //断开后修改标识
			closeCallBack && closeCallBack(e);
		}
		websock.onopen = function() {
			console.log("----这是lc_pc获取的信息,WebSocket连接成功");
			isConnect = true;
			// 发送登录命令
			let loginInfo = {
				cmd: 0,
				data: {
					accessToken: accessToken
				}
			};
			websock.send(JSON.stringify(loginInfo));
		}

		// 连接发生错误的回调方法
		websock.onerror = function() {
			console.log('----这是lc_pc获取的信息,WebSocket连接发生错误')
			isConnect = false; //连接断开修改标识
			reconnect(wsurl,accessToken);
		}
	} catch (e) {
		console.log("尝试创建连接失败");
		reconnect(wsurl,accessToken); //如果无法连接上webSocket 那么重新连接！可能会因为服务器重新部署，或者短暂断网等导致无法创建连接
	}
};

//定义重连函数
let reconnect = (wsurl,accessToken) => {
	console.log("尝试重新连接");
	if (isConnect){
		//如果已经连上就不在重连了
		return; 
	}
	rec && clearTimeout(rec);
	rec = setTimeout(function() { // 延迟5秒重连  避免过多次过频繁请求重连
		if (closed) return; // 已手动关闭，不再重连
		connect(wsurl,accessToken);
	}, 15000);
};
//设置关闭连接
let close = (code) => {
	closed = true; //置关闭标记，阻止残留定时器回调继续 connect/send
	rec && clearTimeout(rec);
	rec = null;
	clearTimeout(heartCheck.timeoutObj);
	heartCheck.timeoutObj = null;
	websock && websock.close(code);
};


//心跳设置
let heartCheck = {
	timeout: 5000, //每段时间发送一次心跳包 这里设置为20s
	timeoutObj: null, //延时发送消息对象（启动心跳新建这个对象，收到消息后重置对象）
	start: function() {
		if (isConnect && !closed) { // 已手动关闭则不再发送心跳
			console.log('----这是lc_pc获取的信息,发送WebSocket心跳')
			let heartBeat = {
				cmd: 1,
				data: {}
			};
			websock.send(JSON.stringify(heartBeat))
		}
	},

	reset: function() {
		clearTimeout(this.timeoutObj);
		this.timeoutObj = setTimeout(function() {
			heartCheck.start();
		}, this.timeout);

	}
};



// 实际调用的方法
let sendMessage = (agentData) => {
	if (websock.readyState === websock.OPEN) {
		// 若是ws开启状态
		websock.send(JSON.stringify(agentData))
	} else if (websock.readyState === websock.CONNECTING) {
		// 若是 正在开启状态，则等待1s后重新调用
		setTimeout(function() {
			if (closed) return; // 已手动关闭，停止重试发送
			sendMessage(agentData)
		}, 1000)
	} else {
		// 若未开启 ，则等待1s后重新调用
		setTimeout(function() {
			if (closed) return; // 已手动关闭，停止重试发送
			sendMessage(agentData)
		}, 1000)
	}
}

let onConnect = (callback) => {
	connectCallBack = callback;
}

let onMessage = (callback) => {
	messageCallBack = callback;
}
let setMessageOut = () => {
	return messageCallBack
}

let onClose = (callback) => {
	closeCallBack = callback;
}
// 将方法暴露出去
export {
	connect,
	reconnect,
	close,
	sendMessage,
	onConnect,
	onMessage,
	onClose,
}
