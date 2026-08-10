/**
 * @fileoverview Vue 2.7 Composition API 工具函数
 * @description 提供在 setup() 函数中访问 Vue 实例属性的工具函数
 * @author jq
 * @version 1.0.0
 */

import { getCurrentInstance } from 'vue'

/**
 * 在 setup() 中访问 Vuex store
 * @returns {Object} Vuex store 实例
 * @throws {Error} 当不在 setup() 函数中调用时抛出错误
 * @example
 * ```javascript
 * import { useStore } from '@/common/vueApi'
 * 
 * export default {
 *   setup() {
 *     const store = useStore()
 *     const user = store.state.user
 *     return { user }
 *   }
 * }
 * ```
 */
export const useStore = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useStore() must be called in setup()')
  }
  if (!vm.proxy.$store) {
    console.warn('useStore(): $store is not available')
  }
  return vm.proxy.$store
}

/**
 * 在 setup() 中访问 Vue Router 实例
 * @returns {Object} Vue Router 实例
 * @throws {Error} 当不在 setup() 函数中调用时抛出错误
 * @example
 * ```javascript
 * import { useRouter } from '@/common/vueApi'
 * 
 * export default {
 *   setup() {
 *     const router = useRouter()
 *     const goToHome = () => router.push('/')
 *     return { goToHome }
 *   }
 * }
 * ```
 */
export const useRouter = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useRouter() must be called in setup()')
  }
  if (!vm.proxy.$router) {
    console.warn('useRouter(): $router is not available')
  }
  return vm.proxy.$router
}

/**
 * 在 setup() 中访问当前路由信息
 * @returns {Object} 当前路由对象
 * @throws {Error} 当不在 setup() 函数中调用时抛出错误
 * @example
 * ```javascript
 * import { useRoute } from '@/common/vueApi'
 * 
 * export default {
 *   setup() {
 *     const route = useRoute()
 *     const currentPath = route.path
 *     return { currentPath }
 *   }
 * }
 * ```
 */
export const useRoute = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useRoute() must be called in setup()')
  }
  if (!vm.proxy.$route) {
    console.warn('useRoute(): $route is not available')
  }
  return vm.proxy.$route
}

/**
 * 在 setup() 中访问 $http 实例
 * @returns {Object} $http 实例
 * @throws {Error} 当不在 setup() 函数中调用时抛出错误
 * @example
 * ```javascript
 * import { useHttp } from '@/common/vueApi'
 * 
 * export default {
 *   setup() {
 *     const http = useHttp()
 *     const fetchData = () => http.get('/api/data')
 *     return { fetchData }
 *   }
 * }
 * ```
 */
export const useHttp = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useHttp() must be called in setup()')
  }
  if (!vm.proxy.$http) {
    console.warn('useHttp(): $http is not available')
  }
  return vm.proxy.$http
}

/**
 * 在 setup() 中访问 $message 实例
 * @returns {Object} $message 实例
 * @throws {Error} 当不在 setup() 函数中调用时抛出错误
 * @example
 * ```javascript
 * import { useMessage } from '@/common/vueApi'
 * 
 * export default {
 *   setup() {
 *     const message = useMessage()
 *     const showSuccess = (text) => message.success(text)
 *     return { showSuccess }
 *   }
 * }
 * ```
 */
export const useMessage = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useMessage() must be called in setup()')
  }
  if (!vm.proxy.$message) {
    console.warn('useMessage(): $message is not available')
  }
  return vm.proxy.$message
}


export const useMessageBox = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useMessageBox() must be called in setup()')
  }
  if (!vm.proxy.$msgbox) {
    console.warn('useMessageBox(): $msgbox is not available')
  }
  return vm.proxy.$msgbox
}



export const useUtils = () => {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useUtils() must be called in setup()')
  }
  const utilKeys = ['renderStr', 'addTabByUrl','$set']
  const utils = {}
  utilKeys.forEach(key => {
    if (!vm.proxy[key]) {
      console.warn(`useUtils(): ${key} is not available`)
    }
    utils[key] = vm?.proxy?.[key]
  })
  return utils
}