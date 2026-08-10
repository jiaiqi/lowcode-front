import paramsModelsMixin from '@/pages/lowcode/mixins/paramsModelsMixin.js';

export default {
  data() {
    return {
      tabsCurrent: 0,
    };
  },
  components: {},
  props: {
    pageParams: {
      type: [Array, Object]
    },
    pageItem: {
      type: Object,
      default () {
        return null
      }
    },
    pageParamsModel: {
      type: [Array, Object]
    },
    queryOptions: Object
  },

  mixins: [paramsModelsMixin],
  computed: {
    tabs() {
      let tabs = []
      tabs = this.deepClone(this.pageItem?.tabs_json?.relate_pages_json)
      return tabs
    },
  },

  methods: {
    tabsChange(e) {
      this.tabsCurrent = e
    },
    setPageParams(key, val) {
      // 输出参数更新到页面
      this.$emit('setPageParams', key, val)
    },
  },
  mounted() {
  },
};