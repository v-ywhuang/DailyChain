'use client'

import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useHabits, useAllHabitsStats, useUserProfile } from '@/hooks/use-queries'
import Image from 'next/image'
import { useState } from 'react'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const { data: habits, isLoading: habitsLoading } = useHabits()
  const { data: stats, isLoading: statsLoading } = useAllHabitsStats()
  const { data: profile } = useUserProfile()
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || '用户'
  const userPlan = profile?.plan || 'free'
  const avatarUrl = profile?.avatar_url

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const loading = habitsLoading || statsLoading

  // 首次使用引导
  if (!loading && habits?.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-2xl">
            <div className="text-8xl mb-8">🌟</div>
            <h1 className="text-4xl font-bold text-black mb-4">
              欢迎来到 DailyChain
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              开始创建你的第一个习惯，让改变从今天开始！
            </p>
            <button
              onClick={() => router.push('/onboarding/categories')}
              className="px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              创建习惯 ✨
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  const todayHabits = habits?.filter(h => h.is_active) || []
  const completedToday = todayHabits.filter(h => h.checked_today).length
  const totalToday = todayHabits.length
  const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 - 简约风格 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-black">DailyChain</h1>
          
          <div className="flex items-center gap-4">
            {userPlan === 'free' && (
              <button
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
              >
                升级 Pro
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors overflow-hidden"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="头像" width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-medium text-black truncate">{userName}</p>
                    <p className="text-sm text-gray-500 capitalize">{userPlan}</p>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    个人设置
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 今日进度卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">今日进度</h2>
            <span className="text-2xl font-bold text-black">{completedToday}/{totalToday}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#00D68F] h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-black">{stats.current_streak}</p>
                <p className="text-sm text-gray-500 mt-1">连续天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-black">{stats.total_check_ins}</p>
                <p className="text-sm text-gray-500 mt-1">总打卡</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-black">{stats.active_habits}</p>
                <p className="text-sm text-gray-500 mt-1">活跃习惯</p>
              </div>
            </div>
          )}
        </div>

        {/* 习惯列表 */}
        <div className="space-y-3">
          {todayHabits.map((habit) => (
            <div
              key={habit.id}
              className={`bg-white rounded-xl p-5 shadow-sm border transition-all cursor-pointer ${
                habit.checked_today
                  ? 'border-[#00D68F] bg-[#00D68F]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => router.push(`/habits/${habit.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{habit.category?.icon || '📝'}</span>
                  <div>
                    <h3 className="font-semibold text-black">{habit.name}</h3>
                    {habit.current_streak > 0 && (
                      <p className="text-sm text-gray-500">🔥 连续 {habit.current_streak} 天</p>
                    )}
                  </div>
                </div>

                {habit.checked_today ? (
                  <div className="w-10 h-10 rounded-full bg-[#00D68F] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/check-in?habit=${habit.id}`)
                    }}
                    className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    打卡
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 浮动按钮 - 创建习惯 */}
        <button
          onClick={() => router.push('/onboarding/categories')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center text-2xl"
        >
          +
        </button>
      </main>
    </div>
  )
}
