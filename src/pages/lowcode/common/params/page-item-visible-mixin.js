/**
 * 页面组件 显示隐藏控制
 * 参考移动端 getPageItemVisible：依据 pageItem.display / display_cond / auth_roles 判断是否显示。
 * 编辑态 (inEdit) 强制显示，避免编辑器改不到被隐藏的组件。
 *
 * 提供：
 * - isPageItemVisible：默认用当前组件自身的 pageItem 计算（computed）
 * - judgePageItemVisible(pageItem, options)：通用判定方法，options.skipEditCheck=true 时不绕过编辑态
 */
export default {
  computed: {
    // 当前用户角色列表（兼容多种字段名）
    currentUserRoles() {
      const userInfo =
        this.$store?.state?.loginInfo?.loginUser ||
        (window.sessionStorage.getItem("current_login_user")
          ? JSON.parse(window.sessionStorage.getItem("current_login_user"))
          : {}) ||
        {};
      return (
        userInfo.roles || userInfo.roleList || userInfo.authorities || []
      );
    },
    // 是否匿名登录（pageParamsModel._isAnonymLogin 由 page-params-mixin 注入）
    isAnonymLogin() {
      return !!(
        this.pageParamsModel?._isAnonymLogin ||
        this.props?.pageParamsModel?._isAnonymLogin ||
        this.$attrs?.pageParamsModel?._isAnonymLogin
      );
    },
    // 是否已认证（关联租户）
    isVerified() {
      return !!(
        this.pageParamsModel?._isVerified ||
        this.props?.pageParamsModel?._isVerified ||
        this.$attrs?.pageParamsModel?._isVerified
      );
    },
    // 是否编辑态（兼容 attrs/props 透传）
    _isEditState() {
      return !!(
        this.inEdit ||
        this.props?.inEdit ||
        this.$attrs?.inEdit
      );
    },
    // 单元组件是否显示
    isPageItemVisible() {
      const pageItem =
        this.pageItemData ||
        this.pageItem ||
        this.props?.data ||
        this.$attrs?.data;
      return this.judgePageItemVisible(pageItem);
    },
  },
  methods: {
    /**
     * 通用可见性判定
     * @param {Object} pageItem - 被判断的组件配置（可能为 null/undefined）
     * @param {Object} [options] - { skipEditCheck?: boolean }
     * @returns {boolean}
     */
    judgePageItemVisible(pageItem, options = {}) {
      // 编辑态：所有组件都可见，方便拖拽和修改
      if (!options.skipEditCheck && this._isEditState) {
        return true;
      }
      if (!pageItem) {
        return true;
      }
      if (pageItem.display === "否") {
        return false;
      }
      if (pageItem.display === "是") {
        return true;
      }
      if (pageItem.display === "按条件") {
        switch (pageItem.display_cond) {
          case "已登录":
            return !this.isAnonymLogin;
          case "未登录":
            return this.isAnonymLogin;
          case "未关联租户":
            return !this.isAnonymLogin && !this.isVerified;
          case "有权限时": {
            if (!pageItem.auth_roles) {
              // 未配置 auth_roles 时默认隐藏（fail-closed）
              return false;
            }
            const allowedRoles = String(pageItem.auth_roles)
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean);
            if (allowedRoles.length === 0) {
              return false;
            }
            const userRoles = this.currentUserRoles || [];
            return allowedRoles.some((role) => userRoles.includes(role));
          }
          default:
            return true;
        }
      }
      return true;
    },
    /**
     * lc-view v-for 子节点可见性判断：仅对 lcBlock/lcContainer/lcContent 三种类型生效
     * @param {Object} item - childComponents 中的一项（item.type / item.component）
     */
    isChildVisible(item) {
      if (!item) return true;
      const type = item.type;
      const comp = item.component;
      const isLayoutType =
        type === "block" ||
        type === "container" ||
        type === "content" ||
        comp === "lc-block" ||
        comp === "lc-container" ||
        comp === "lc-content";
      if (!isLayoutType) {
        // 非布局容器组件（如 PageItem、floatComponent、chatEntrance 等）保持原行为
        return true;
      }
      return this.judgePageItemVisible(item.data || item.pageItem);
    },
  },
};
