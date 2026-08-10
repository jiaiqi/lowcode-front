import dayjs from 'dayjs'
export function formatDate(jsDate, type,format) {
  if ("date" === type) {
    return dayjs(jsDate).format("YYYY-MM-DD");
  } else if ("datetime" === type) {
    if(format && format == 'yyyy-MM-dd HH:mm'){
      
      return dayjs(jsDate).format("YYYY-MM-DD HH:mm");
    }else{
      return dayjs(jsDate).format("YYYY-MM-DD HH:mm:ss");
    }
    
  } else if ("year" === type) {
    return dayjs(jsDate).format("YYYY");
  } else if ("month" === type) {
    // return dayjs(jsDate).format("YYYY-MM" + "-01");
    return dayjs(jsDate).format("YYYY-MM");
  } else if ("time" === type) {
    return jsDate;
  } else {
    throw  new Error("unsupport: " + type)
  }
}


export function money2Zh(money) {
  //汉字的数字
  let cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖');
  //基本单位
  let cnIntRadice = new Array('', '拾', '佰', '仟');
  //对应整数部分扩展单位
  let cnIntUnits = new Array('', '万', '亿', '兆');
  //对应小数部分单位
  let cnDecUnits = new Array('角', '分', '毫', '厘');
  //整数金额时后面跟的字符
  let cnInteger = '整';
  //整型完以后的单位
  let cnIntLast = '元';
  //最大处理的数字
  let maxNum = 999999999999999.9999;
  //金额整数部分
  let integerNum;
  //金额小数部分
  let decimalNum;
  //输出的中文金额字符串
  let chineseStr = '';
  //分离金额后用的数组，预定义
  let parts;


  if (money == '') {
    return '';
  }
  money = parseFloat(money);
  if (money >= maxNum) {
    //超出最大处理数字
    return '';
  }
  if (money == 0) {
    chineseStr = cnNums[0] + cnIntLast + cnInteger;
    return chineseStr;
  }
  //转换为字符串
  money = money.toString();
  if (money.indexOf('.') == -1) {
    integerNum = money;
    decimalNum = '';
  } else {
    parts = money.split('.');
    integerNum = parts[0];
    decimalNum = parts[1].substr(0, 4);
  }

  //获取整型部分转换
  if (parseInt(integerNum, 10) > 0) {
    let zeroCount = 0;
    let IntLen = integerNum.length;
    for (let i = 0; i < IntLen; i++) {
      let n = integerNum.substr(i, 1);
      let p = IntLen - i - 1;
      let q = p / 4;
      let m = p % 4;
      if (n == '0') {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          chineseStr += cnNums[0];
        }
        //归零
        zeroCount = 0;
        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
      }
      if (m == 0 && zeroCount < 4) {
        chineseStr += cnIntUnits[q];
      }
    }
    chineseStr += cnIntLast;
  }

  //小数部分
  if (decimalNum != '') {
    let decLen = decimalNum.length;
    for (let i = 0; i < decLen; i++) {
      let n = decimalNum.substr(i, 1);
      if (n != '0') {
        chineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }
  }
  if (chineseStr == '') {
    chineseStr += cnNums[0] + cnIntLast + cnInteger;
  } else if (decimalNum == '') {
    chineseStr += cnInteger;
  }
  return chineseStr;
}

export function formatMoney(valueStr) {
  let value = valueStr
  let isNegative = false
  if(value === null || value === 'null'){
    valueStr = ""
  }
  if(valueStr.indexOf("-") !== -1){
    valueStr = valueStr.replace("-","")
    isNegative = true
  }
  if (/[^0-9\.]/.test(valueStr)) return "invalid value";
  valueStr = valueStr.replace(/^(\d*)$/, "$1.");
  valueStr = (valueStr + "00").replace(/(\d*\.\d\d)\d*/, "$1");
  valueStr = valueStr.replace(".", ",");
  var re = /(\d)(\d{3},)/;
  while (re.test(valueStr)) {
    valueStr = valueStr.replace(re, "$1,$2");
  }

  valueStr = valueStr.replace(/,(\d\d)$/, ".$1");
  if(isNegative){
    valueStr = "-" + valueStr
  }
  return valueStr.replace(/^\./, "0.")
}


export function traverseObj(obj, visitor, filter) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      visitor(obj, key)
      if (filter(obj, key)) {
        traverseObj(obj[key], visitor, filter)
      }
    }
  }
};

export function getWeekStartAndEnd(e) {
  
  console.log('增量',e)
  let days = 1000 * 60 * 60 * 24
  let times = (new Date()).getTime()
  let year = (new Date()).getFullYear()
  let month = (new Date()).getMonth() + 1
  let sDays = (new Date()).getDate() - (new Date()).getDay() 
  let sNum = times - ( (new Date()).getDay() * days)
  let eNum = times + ( (7 - (new Date()).getDay()) * days)
  // let sDate = new Date(
  //   (new Date(sNum + (e *days * 7 ))).getYear() + 1900,
  //   (new Date(sNum + (e *days * 7 ))).getMonth(),
  //   (new Date(sNum + (e *days * 7 ))).getDate()
  // )
  // let eDate = new Date(
  //   (new Date(eNum + (e * days * 7 ))).getYear() + 1900,
  //   (new Date(eNum + (e * days * 7 ))).getMonth(),
  //   (new Date(eNum + (e * days * 7 ))).getDate()
  // )
  let sDate = ((new Date(sNum + (e *days * 7 ))).getYear() + 1900) + 
  '-' + 
  ((new Date(sNum + (e *days * 7 ))).getMonth()+ 1)  + 
  '-' + ((new Date(sNum + (e *days * 7 ))).getDate()) + ' 00:00:00';;
  let eDate = ((new Date(eNum + (e *days * 7 ))).getYear() + 1900) + 
  '-' + 
  ((new Date(eNum + (e *days * 7 ))).getMonth() + 1) + 
  '-' + 
  ((new Date(eNum + (e *days * 7 ))).getDate()) + ' 00:00:00';;
  return [sDate + ',' + eDate]
};
export function getDayStartAndEnd(e){
  let days = 1000 * 60 * 60 * 24
  let times = (new Date()).getTime()
  let nowDay = ((new Date()).getYear() + 1900) + 
  '-' + 
  ((new Date()).getMonth() + 1) + 
  '-' + 
  ((new Date()).getDate()) + ' 00:00:00';
  let nowDate = ((new Date(times + ((0+1) *days))).getYear() + 1900) + 
  '-' + 
  ((new Date(times + ((0+1) * days))).getMonth()+ 1)  + 
  '-' + ((new Date(times + ((0+1) *days))).getDate()) + ' 00:00:00';

  let sDate = ((new Date(times + ((e) *days))).getYear() + 1900) + 
  '-' + 
  ((new Date(times + ((e) * days))).getMonth()+ 1)  + 
  '-' + ((new Date(times + ((e) *days))).getDate()) + ' 00:00:00';
  if(e == 0){
    return [sDate  + ',' +  nowDate]
  }else if(e < 0){
    return [sDate + ',' + nowDay]
  }else{
    return [nowDay + ',' + sDate]
  }
};
export function getMonthStartAndEnd(e){  // -1 0 2
  let days = 1000 * 60 * 60 * 24
  let times = (new Date()).getTime()
  let nowY = new Date().getFullYear()
  let nowM = new Date().getMonth() + 1
  let sMonth = nowM
  let eMonth = nowM + 1
  let sYear = nowY
  let eYear = nowY
  if(e < 0){
    // -1 0 2
    if((nowM + e) >= 0){
      // 不跨月  日期起止月
      sMonth = nowM + e == 0 ? 1 : nowM + e
      eMonth = nowM + 1 > 12 ?  1 : nowM + 1
    }else{
      sMonth = 12 + (nowM + e)
      eMonth = nowM + 1 > 12 ?  1 : nowM + 1
      sYear = nowY--
    }

    if((nowM + 1) > 12){
      eMonth = 1
      eYear = nowY++
    }else{
      eMonth = nowM + 1
      eYear = nowY
    }
  }else if(e > 0){
    sMonth = nowM
    eMonth = (12 - nowM) >= e ?  nowM + e :  e - (12-nowM)
    if(!(12 - nowM) >= e){
      eYear = nowY++
    }
  }
  
  let sMonthTime =  sYear + '-' + sMonth + '-' + 1 + ' 00:00:00';
  let eMonthTime =  eYear + '-' + eMonth + '-' + 1 + ' 00:00:00';
  return [sMonthTime + ',' + eMonthTime]
};
export function getYearStartAndEnd(e){  // -1 0 2
  let nowY = new Date().getFullYear()
  let sYear =  nowY
  let eYear =  nowY + 1
  if(e > 0){
    sYear =  nowY
    eYear =  nowY + e
  }else{
    eYear =  nowY + 1
    sYear =  nowY + e
  }
  let sYearTime =  nowY + '-' + 1 + '-' + 1 + ' 00:00:00';
  let eYearTime =  nowY + '-' + 1 + '-' + 1 + ' 00:00:00';
  return [sYearTime + ',' + eYearTime]
};
export function weekStart() {
  return new Date(
    (new Date()).getYear() + 1900,
    (new Date()).getMonth(),
    (new Date()).getDate() - (new Date()).getDay()
  )
};

export function weekEnd() {
  return new Date(
    (new Date()).getYear() + 1900,
    (new Date()).getMonth(),
    (new Date()).getDate() + (6 - (new Date()).getDay()))
};

export function monthStart() {
  let now = new Date();
  return new Date(
    (now).getYear() + 1900,
    (now).getMonth(),  1
  )
};

export function monthEnd() {
  let now = new Date();
  return new Date(
    (now).getYear() + 1900,
    (now).getMonth(),
    dayjs().daysInMonth())
};


export function parseUrlParams(url) {
  if(!url){
    return
  }
  if(url&&url.indexOf('?')===-1){
    return
  }
  let params = {};
  let urlParams = url.split('?')[1].split('&');
  urlParams.forEach(item => {
    let key = item.split('=')[0];
    let value = item.split('=')[1];
    params[key] = value;
  });
  return params;
}
