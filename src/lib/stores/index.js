import { createPinia } from 'pinia'

// 创建 Pinia 实例
export const pinia = createPinia()

// 导出所有 stores
export { useActiveCardStore } from './activeCard'
export { useOrientationStore } from './orientation'
