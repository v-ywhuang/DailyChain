'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

// 💬 温暖励志的轮换文案
const inspiringMessages = [
  { key: "progress", text: "看见", highlight: "进步", suffix: "的力量" },
  { key: "persist", text: "每天", highlight: "坚持", suffix: "一点点" },
  { key: "change", text: "改变", highlight: "从今天", suffix: "开始" },
  { key: "beauty", text: "生活", highlight: "因习惯", suffix: "而美好" },
  { key: "grow", text: "成长", highlight: "是一种", suffix: "习惯" },
  { key: "future", text: "今天的", highlight: "努力", suffix: "成就明天" },
]

export default function HomeClient() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  // 每3秒切换一次文案
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % inspiringMessages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])
  return (
    // 🎨 UI/UX Pro Max: Aurora UI + Glassmorphism + Motion-Driven (Single Screen, No Scroll)
    <main className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* 🌌 Aurora Background - Animated Gradient Mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500 via-blue-500 to-purple-500 opacity-30 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* 🎭 Glassmorphism Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        
        {/* ✨ Main Content - Single Screen Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl w-full text-center"
        >
          
          {/* 🎯 Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight px-2">
              DailyChain
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-purple-200 font-light tracking-wide">
              链习惯
            </p>
          </motion.div>

          {/* 💡 Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8 sm:mb-10 px-4"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              极简、有成就感的
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                习惯养成工具
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-purple-200 font-light">
              <span className="text-orange-400 font-semibold">3秒打卡</span>，看见进步 ✨
            </p>
          </motion.div>

          {/* 🎯 CTA Buttons - Glassmorphism Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10 px-4"
          >
            {/* Primary CTA */}
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-2xl shadow-orange-500/50 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  免费开始使用
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </motion.div>
            </Link>

            {/* Secondary CTA - Glassmorphism */}
            <Link href="/auth/login" className="w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                登录
              </motion.div>
            </Link>
          </motion.div>

          {/* ⭐ 温暖励志文案 - 轮换展示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="max-w-2xl mx-auto px-4"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 hover:bg-white/10 transition-all duration-500 group min-h-[160px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMessageIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-center"
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl font-light text-white leading-relaxed">
                    {inspiringMessages[currentMessageIndex].text}
                    <span className="font-bold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mx-2">
                      {inspiringMessages[currentMessageIndex].highlight}
                    </span>
                    {inspiringMessages[currentMessageIndex].suffix}
                  </p>
                  
                  {/* 进度指示器 */}
                  <div className="flex justify-center gap-2 mt-6">
                    {inspiringMessages.map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          i === currentMessageIndex 
                            ? 'w-8 bg-gradient-to-r from-orange-400 to-pink-400' 
                            : 'w-1.5 bg-white/20'
                        }`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: i === currentMessageIndex ? 1 : 0.8 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 🏆 Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-6 sm:mt-8 text-purple-200 text-xs sm:text-sm"
          >
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span className="flex">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </span>
              <span className="font-semibold text-white">1000+</span> 用户正在养成好习惯
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* 🎨 Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
    </main>
  )
}
