'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getUserHabits } from '@/lib/api/habits'
import { getAllHabitsStats } from '@/lib/api/stats'
import { getUserProfile } from '@/lib/api/user'
import Image from 'next/image'
import type { UserHabitWithDetails, HabitStats } from '@/lib/types/database.types'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || '用户'
  
  const [habits, setHabits] = useState<UserHabitWithDetails[]>([])
  const [stats, setStats] = useState<HabitStats | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free')
  const [isInitialLoading, setIsInitialLoading] = useState(true) // 添加初始加载状态

  async function loadDashboardData() {
    const [habitsResult, statsResult, profileResult] = await Promise.all([
      getUserHabits(),
      getAllHabitsStats(),
      getUserProfile()
    ])

    if (habitsResult.success && habitsResult.data) {
      setHabits(habitsResult.data)
    }

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }

    if (profileResult.success && profileResult.data) {
      setAvatarUrl(profileResult.data.avatar_url)
      setUserPlan(profileResult.data.plan as 'free' | 'pro')
    }
    
    setIsInitialLoading(false) // 数据加载完成
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 首次使用引导（只有加载完成且确认无习惯时才显示）
  if (!isInitialLoading && habits.length === 0) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], x: [-10, 10, -10] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-2xl">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-9xl mb-6">
              🌟
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-white mb-4">
              欢迎来到 DailyChain
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 text-lg mb-8">
              每一个微小的改变，都是通往美好的开始
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push('/onboarding/categories')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              创建习惯 ✨
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Aurora Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], x: [-10, 10, -10] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], x: [10, -10, 10] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        {/* Top Navigation - 重新设计的高级头部 */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-slate-900/80 via-purple-900/60 to-slate-900/80 border-b border-white/10 shadow-2xl shadow-purple-500/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20 sm:h-24">
              {/* Logo 区域 - 增强视觉冲击力 */}
              <motion.div 
                className="flex items-center gap-3 sm:gap-4"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* 品牌图标 - 增大尺寸,添加光晕效果 */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 blur-xl opacity-30 animate-pulse" />
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-0.5 shadow-xl shadow-orange-500/30">
                    <div className="w-full h-full rounded-2xl bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl">
                      🔗
                    </div>
                  </div>
                </div>
                
                {/* 品牌文案 - 唯美短语 */}
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wide">
                    <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                      因为习惯 · 所以美好
                    </span>
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-purple-300/90 font-medium tracking-wide mt-1">
                    链接每一天 · 养成好习惯
                  </p>
                </div>
              </motion.div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="text-xs text-purple-300">坚持中 🔥</p>
                </div>
                
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden ${
                      avatarUrl 
                        ? 'bg-gray-200' // 有头像时用浅色背景
                        : 'bg-gradient-to-br from-orange-400 to-pink-400 shadow-orange-500/30' // 无头像时用渐变背景
                    }`}
                  >
                    {avatarUrl ? (
                      <Image 
                        src={avatarUrl} 
                        alt="Avatar" 
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-full"
                        unoptimized
                      />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </motion.button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/profile')
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人资料
                      </button>
                      {userPlan === 'free' && (
                        <>
                          <div className="border-t border-white/10" />
                          <button
                            onClick={() => {
                              setShowUserMenu(false)
                              router.push('/pricing')
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="font-bold">升级 Pro</span>
                          </button>
                        </>
                      )}
                      <div className="border-t border-white/10" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退出登录
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
              >
                {[
                  { icon: "🔥", label: "连续天数", value: `${stats?.current_streak || 0}天`, color: "from-orange-500 to-red-500" },
                  { icon: "✅", label: "今日完成", value: `${habits.filter(h => h.checked_today).length}/${habits.length}`, color: "from-green-500 to-emerald-500" },
                  { icon: "📊", label: "总打卡数", value: `${stats?.total_check_ins || 0}次`, color: "from-blue-500 to-cyan-500" },
                  { icon: "🎯", label: "习惯数量", value: `${stats?.active_habits || 0}个`, color: "from-purple-500 to-pink-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-opacity" style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                    <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                      <div className="text-3xl sm:text-4xl mb-2">{stat.icon}</div>
                      <div className="text-xs sm:text-sm text-white/70 mb-1">{stat.label}</div>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Quick Action Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/check-in')}
                className="w-full mb-6 sm:mb-8 py-5 sm:py-6 lg:py-8 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-2xl sm:rounded-3xl font-bold text-lg sm:text-xl lg:text-2xl text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl sm:text-3xl">✨</span>
                <span>今日打卡</span>
              </motion.button>

              {/* Habits List */}
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">我的习惯</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/onboarding/categories')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm sm:text-base"
                  >
                    + 添加习惯
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {habits.map((habit, index) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => router.push(`/habits/${habit.id}`)}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 cursor-pointer hover:bg-white/15 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl sm:text-4xl">{habit.category.icon}</div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">{habit.name}</h3>
                            <p className="text-sm text-white/70">{habit.category.name}</p>
                          </div>
                        </div>
                        
                        {habit.checked_today ? (
                          <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-xs sm:text-sm font-medium whitespace-nowrap">
                            ✓ 已打卡
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs sm:text-sm font-medium whitespace-nowrap">
                            待打卡
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-white/70 mb-2">
                          <span>进度</span>
                          <span>{habit.total_check_ins} / {habit.target_days || 0} 天</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${habit.progress_percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-white">{habit.current_streak}</div>
                          <div className="text-xs text-white/70">当前连续</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-white">{habit.longest_streak}</div>
                          <div className="text-xs text-white/70">最长连续</div>
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold text-white">{habit.progress_percentage}%</div>
                          <div className="text-xs text-white/70">完成度</div>
                        </div>
                      </div>

                      {/* Habit Options Preview */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          {habit.options && habit.options.length > 0 ? (
                            <>
                              {habit.options.slice(0, 3).map((opt) => (
                                <span key={opt.id} className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs">
                                  {opt.option.name}
                                </span>
                              ))}
                              {habit.options.length > 3 && (
                                <span className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs">
                                  +{habit.options.length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-white/50 text-xs">暂无选项</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
        </div>
      </div>
    </div>
  )
}
