import dayjs from 'dayjs'

/**
 * @description 获取时间关键词数组
 * @returns {Array} - 返回时间关键词数组
 */
function getDateKeys() {
  return ['今天', '昨天', '前天', '明天', '后天', '大后天', '大前天', '本周', '上周', '上上周', '下周', '下下周', '过去一周', '过去两周', '未来一周', '未来两周', '本月', '上月', '下月', '过去一月', '过去两月', '未来一月', '未来两月', '本季度', '上季度', '上上季度', '下季度', '今年', '去年', '前年', '大前年', '明年', '后年', '大后年']
}

/**
 * @description 获取时间关键词对应的时间范围
 * @param {String} key - 时间关键词
 * @param {Boolean} rangeValue - 是否返回时间范围对象
 * @returns {Object|String} - 返回时间范围对象或时间范围字符串
 */
function getDateByKey(key, rangeValue = false) {
  // 定义时间关键词到计算函数的映射
  const timeKeyMap = {
    '今天': () => ({ start: dayjs(), end: dayjs() }),
    '昨天': () => ({ start: dayjs().subtract(1, 'day'), end: dayjs().subtract(1, 'day') }),
    '前天': () => ({ start: dayjs().subtract(2, 'day'), end: dayjs().subtract(2, 'day') }),
    '大前天': () => ({ start: dayjs().subtract(3, 'day'), end: dayjs().subtract(3, 'day') }),
    '明天': () => ({ start: dayjs().add(1, 'day'), end: dayjs().add(1, 'day') }),
    '后天': () => ({ start: dayjs().add(2, 'day'), end: dayjs().add(2, 'day') }),
    '大后天': () => ({ start: dayjs().add(3, 'day'), end: dayjs().add(3, 'day') }),
    '本周': () => ({ start: dayjs().startOf('week'), end: dayjs().endOf('week') }),
    '上周': () => ({ start: dayjs().subtract(1, 'week').startOf('week'), end: dayjs().subtract(1, 'week').endOf('week') }),
    '上上周': () => ({ start: dayjs().subtract(2, 'week').startOf('week'), end: dayjs().subtract(2, 'week').endOf('week') }),
    '下周': () => ({ start: dayjs().add(1, 'week').startOf('week'), end: dayjs().add(1, 'week').endOf('week') }),
    '下下周': () => ({ start: dayjs().add(2, 'week').startOf('week'), end: dayjs().add(2, 'week').endOf('week') }),
    '过去一周': () => ({ start: dayjs().subtract(7, 'day'), end: dayjs() }),
    '过去两周': () => ({ start: dayjs().subtract(14, 'day'), end: dayjs() }),
    '未来一周': () => ({ start: dayjs(), end: dayjs().add(7, 'day') }),
    '未来两周': () => ({ start: dayjs(), end: dayjs().add(14, 'day') }),
    '本月': () => ({ start: dayjs().startOf('month'), end: dayjs().endOf('month') }),
    '上月': () => ({ start: dayjs().subtract(1, 'month').startOf('month'), end: dayjs().subtract(1, 'month').endOf('month') }),
    '下月': () => ({ start: dayjs().add(1, 'month').startOf('month'), end: dayjs().add(1, 'month').endOf('month') }),
    '过去一月': () => ({ start: dayjs().subtract(30, 'day'), end: dayjs() }),
    '过去两月': () => ({ start: dayjs().subtract(60, 'day'), end: dayjs() }),
    '未来一月': () => ({ start: dayjs(), end: dayjs().add(30, 'day') }),
    '未来两月': () => ({ start: dayjs(), end: dayjs().add(60, 'day') }),
    '本季度': () => ({ start: dayjs().startOf('quarter'), end: dayjs().endOf('quarter') }),
    '上季度': () => ({ start: dayjs().subtract(1, 'quarter').startOf('quarter'), end: dayjs().subtract(1, 'quarter').endOf('quarter') }),
    '上上季度': () => ({ start: dayjs().subtract(2, 'quarter').startOf('quarter'), end: dayjs().subtract(2, 'quarter').endOf('quarter') }),
    '下季度': () => ({ start: dayjs().add(1, 'quarter').startOf('quarter'), end: dayjs().add(1, 'quarter').endOf('quarter') }),
    '今年': () => ({ start: dayjs().startOf('year'), end: dayjs().endOf('year') }),
    '去年': () => ({ start: dayjs().subtract(1, 'year').startOf('year'), end: dayjs().subtract(1, 'year').endOf('year') }),
    '前年': () => ({ start: dayjs().subtract(2, 'year').startOf('year'), end: dayjs().subtract(2, 'year').endOf('year') }),
    '大前年': () => ({ start: dayjs().subtract(3, 'year').startOf('year'), end: dayjs().subtract(3, 'year').endOf('year') }),
    '明年': () => ({ start: dayjs().add(1, 'year').startOf('year'), end: dayjs().add(1, 'year').endOf('year') }),
    '后年': () => ({ start: dayjs().add(2, 'year').startOf('year'), end: dayjs().add(2, 'year').endOf('year') }),
    '大后年': () => ({ start: dayjs().add(3, 'year').startOf('year'), end: dayjs().add(3, 'year').endOf('year') })
  };

  // 获取对应计算函数，若不存在则返回默认值
  const calcFn = timeKeyMap[key];
  if (!calcFn) {
    return key;
  }

  // 执行计算获取开始和结束时间
  const { start, end } = calcFn();

  // 根据 rangeValue 决定返回格式
  if (rangeValue) {
    return [start.format('YYYY-MM-DD 00:00:00'), end.format('YYYY-MM-DD 23:59:59')];
  }
  return start.format('YYYY-MM-DD');
}

export {
  getDateKeys,
  getDateByKey
}