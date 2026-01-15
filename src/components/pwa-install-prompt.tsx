'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  
  // 直接计算isIOS,不使用state
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  useEffect(() => {
    // 检测是否已经是PWA模式
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    // 如果已经是PWA模式,不显示提示
    if (standalone) return

    // 检查是否永久关闭了提示（用户点击关闭按钮）
    const dismissedPermanently = localStorage.getItem('pwa-install-dismissed-permanently')
    if (dismissedPermanently === 'true') return

    // 监听beforeinstallprompt事件 (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 检查用户是否之前关闭过提示
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const now = Date.now()
      
      // 如果上次关闭是7天以内，不再显示
      if (dismissedTime && (now - dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
        return
      }
      
      setTimeout(() => setShowPrompt(true), 3000) // 3秒后显示
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS设备提示(iOS不支持beforeinstallprompt)
    if (isIOS && !standalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const now = Date.now()
      
      // 如果上次关闭是7天以内，不再显示
      if (dismissedTime && (now - dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
        return
      }
      
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isIOS])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('用户接受安装')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // 临时关闭（7天后再显示）
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', Date.now().toString())
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  const handleDismissPermanently = () => {
    setShowPrompt(false)
    // 永久关闭
    localStorage.setItem('pwa-install-dismissed-permanently', 'true')
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9999]"
      >
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-900/95 to-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-6">
          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 内容 */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
              🔗
            </div>

            {/* Text */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-white mb-1">
                安装链习惯
              </h3>
              <p className="text-sm text-purple-200 mb-4">
                {isIOS 
                  ? '点击分享按钮,然后选择"添加到主屏幕"' 
                  : '添加到主屏幕,随时打卡养成好习惯'}
              </p>

              {/* iOS 安装指引 */}
              {isIOS ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-purple-300 bg-white/5 rounded-xl p-3 border border-white/10">
                    <span className="text-xl">⬆️</span>
                    <span>点击底部分享按钮</span>
                    <span className="text-xl">➕</span>
                    <span>添加到主屏幕</span>
                  </div>
                  <button
                    onClick={handleDismissPermanently}
                    className="w-full text-white/60 hover:text-white text-xs py-2 transition-colors"
                  >
                    不再提示
                  </button>
                </div>
              ) : (
                /* Android 安装按钮 */
                <div className="space-y-2">
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
                  >
                    立即安装
                  </button>
                  <button
                    onClick={handleDismissPermanently}
                    className="w-full text-white/60 hover:text-white text-xs py-2 transition-colors"
                  >
                    不再提示
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-b-3xl" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
