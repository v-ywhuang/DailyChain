/**
 * 极简 Loading 组件 - 顶部进度条
 * 不打断用户，只在顶部显示小巧的进度指示
 */

'use client'

import { useEffect, useState } from 'react'

export function TopLoadingBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 模拟进度增长
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 200)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
      </div>
    </div>
  )
}

/**
 * 内联小型 Loading（用于按钮等）
 */
export function InlineLoading({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
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
      {text && <span className="text-sm">{text}</span>}
    </span>
  )
}

/**
 * 中央小型 Loading（页面级，但不遮挡）
 */
export function CenterLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        {/* 外圈光晕 */}
        <div className="absolute inset-0 blur-lg opacity-50 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />
        </div>
        {/* Spinner */}
        <svg
          className="animate-spin h-8 w-8 relative"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="url(#gradient)"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

/**
 * 页面级 Loading（保留原背景，只在中央显示）
 */
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CenterLoading />
    </div>
  )
}

export default CenterLoading
