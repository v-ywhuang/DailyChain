/**
 * 全局 Loading 系统 - 业界标准顶部进度条
 * 参考: NProgress, 微信小程序, 支付宝 H5
 * 
 * 使用场景:
 * - 页面跳转
 * - 数据加载
 * - 表单提交
 * - 任何异步操作
 */

'use client'

import { useEffect, useState } from 'react'

// ==========================================
// 1. 顶部进度条（全局唯一）
// ==========================================
export function GlobalLoadingBar() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 使用 requestAnimationFrame 避免同步 setState 警告
    requestAnimationFrame(() => {
      // 快速启动到 30%
      setProgress(30)
    })
    
    // 逐渐增长到 90%
    const intervals = [
      setTimeout(() => setProgress(50), 200),
      setTimeout(() => setProgress(70), 500),
      setTimeout(() => setProgress(85), 1000),
      setTimeout(() => setProgress(92), 1500),
    ]

    return () => intervals.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [progress])

  if (!isVisible) return null

  return (
    <>
      {/* 背景遮罩（可选，不打断用户） */}
      {/* <div className="fixed inset-0 bg-black/5 z-[9998]" /> */}
      
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-orange-500 to-pink-500 transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            boxShadow: '0 0 10px rgba(236, 72, 153, 0.5), 0 0 5px rgba(236, 72, 153, 0.5)'
          }}
        >
          {/* 右侧光效 */}
          <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-white/40" />
        </div>
      </div>
    </>
  )
}

// ==========================================
// 2. 按钮内 Loading（表单提交）
// ==========================================
export function ButtonLoading({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span>{text}</span>}
    </span>
  )
}

// ==========================================
// 3. 页面级 Loading（Suspense fallback）
// ==========================================
export function PageLoading() {
  return <GlobalLoadingBar />
}

// ==========================================
// 4. 容器级 Loading（小区域加载）
// ==========================================
export function ContainerLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-8 h-8">
        {/* 简单的旋转圆 */}
        <div className="absolute inset-0 border-3 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-3 border-pink-500 rounded-full border-t-transparent animate-spin" />
      </div>
    </div>
  )
}

// ==========================================
// 5. 全局 Loading 控制器（编程式调用）
// ==========================================
class LoadingController {
  private listeners: Set<(show: boolean) => void> = new Set()
  
  show() {
    this.listeners.forEach(listener => listener(true))
  }
  
  hide() {
    this.listeners.forEach(listener => listener(false))
  }
  
  subscribe(listener: (show: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const loadingController = new LoadingController()

// ==========================================
// 6. 全局 Loading Provider（自动显示进度条）
// ==========================================
export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = loadingController.subscribe(setIsLoading)
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <>
      {isLoading && <GlobalLoadingBar />}
      {children}
    </>
  )
}

// ==========================================
// 7. 默认导出（最常用）
// ==========================================
export default GlobalLoadingBar
