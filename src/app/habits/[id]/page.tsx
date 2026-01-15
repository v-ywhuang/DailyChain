'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { getHabitById } from '@/lib/api/habits'
import { getCheckInHistory } from '@/lib/api/check-ins'
import Loading from '@/components/loading'
import type { UserHabitWithDetails, CheckIn } from '@/lib/types/database.types'

export default function HabitDetailPage() {
  const router = useRouter()
  const params = useParams()
  const habitId = params.id as string

  const [habit, setHabit] = useState<UserHabitWithDetails | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0
  })

  useEffect(() => {
    async function loadData() {
      const [habitResult, checkInsResult] = await Promise.all([
        getHabitById(habitId),
        getCheckInHistory(habitId, 100)
      ])

      if (habitResult.success && habitResult.data) {
        setHabit(habitResult.data)
      }

      if (checkInsResult.success && checkInsResult.data) {
        const checkInData = checkInsResult.data
        setCheckIns(checkInData)
        
        // 计算真实的统计数据
        const totalCheckIns = checkInData.length
        
        // 计算当前连续天数
        let currentStreak = 0
        const today = new Date().toISOString().split('T')[0]
        const sortedDates = checkInData
          .map(c => c.check_in_date)
          .sort()
          .reverse()
        
        for (let i = 0; i < sortedDates.length; i++) {
          const checkDate = new Date(sortedDates[i])
          const expectedDate = new Date()
          expectedDate.setDate(expectedDate.getDate() - i)
          const expectedDateStr = expectedDate.toISOString().split('T')[0]
          
          if (sortedDates[i] === expectedDateStr) {
            currentStreak++
          } else {
            break
          }
        }
        
        // 计算最长连续天数
        let longestStreak = 0
        let tempStreak = 1
        
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i])
          const prevDate = new Date(sortedDates[i - 1])
          const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            tempStreak++
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            tempStreak = 1
          }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak)
        
        setStats({
          currentStreak,
          longestStreak,
          totalCheckIns
        })
      }

      setLoading(false)
    }
    loadData()
  }, [habitId])

  if (loading) {
    return <Loading />
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold mb-4">习惯不存在</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white/20 backdrop-blur-lg rounded-xl hover:bg-white/30 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-xl font-bold text-white">习惯详情</h1>

          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* 习惯卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 mb-6"
        >
          {/* 头部：图标+名称+类别 */}
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{habit.category.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{habit.name}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-white/80 text-sm">
                  {habit.category.name}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-white/80 text-sm">
                  目标 {habit.target_days} 天
                </span>
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.currentStreak}
              </div>
              <div className="text-white/60 text-sm">当前连续</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.longestStreak}
              </div>
              <div className="text-white/60 text-sm">最长连续</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalCheckIns}
              </div>
              <div className="text-white/60 text-sm">累计打卡</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm">完成进度</span>
              <span className="text-white font-bold">{habit.progress_percentage}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${habit.progress_percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
              />
            </div>
          </div>

          {/* 选项列表 */}
          {habit.options && habit.options.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white/80 text-sm mb-3">习惯选项</h3>
              <div className="space-y-2">
                {habit.options.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/10 rounded-xl p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl">✓</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.option.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* 功能入口 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/achievements?habit=${habitId}`)}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-6 hover:scale-105 transition-all"
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-white font-bold text-lg mb-1">成就徽章</div>
            <div className="text-white/60 text-sm">查看该习惯的成就</div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push(`/report?habit=${habitId}`)}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-white font-bold text-lg mb-1">数据报告</div>
            <div className="text-white/60 text-sm">生成精美的分享图</div>
          </motion.button>
        </div>

        {/* 打卡历史 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
        >
          <h3 className="text-white font-bold text-lg mb-4">打卡历史</h3>
          
          {checkIns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white/60">还没有打卡记录</p>
              <button
                onClick={() => router.push('/check-in')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl text-white font-bold hover:shadow-2xl hover:scale-105 transition-all"
              >
                立即打卡
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {checkIns.slice(0, 10).map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="bg-white/10 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {new Date(checkIn.check_in_date).toLocaleDateString('zh-CN', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </span>
                    <span className="text-green-400 text-sm">✓ 已完成</span>
                  </div>
                  {checkIn.notes && (
                    <p className="text-white/60 text-sm">{checkIn.notes}</p>
                  )}
                </div>
              ))}
              
              {checkIns.length > 10 && (
                <div className="text-center pt-4">
                  <span className="text-white/40 text-sm">
                    还有 {checkIns.length - 10} 条记录...
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
