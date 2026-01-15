'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserStats, getCheckInHeatmap } from '@/lib/api/stats'
import { getHabitById } from '@/lib/api/habits'
import { getReportEncouragement } from '@/lib/api/encouragements'
import { getUserProfile } from '@/lib/api/user'
import html2canvas from 'html2canvas'
import type { UserHabitWithDetails, Encouragement } from '@/lib/types/database.types'

interface Stats {
  total_check_ins: number
  current_streak: number
  longest_streak: number
  active_habits: number
  total_days?: number
}

interface HeatmapData {
  date: string
  count: number
}

export default function ReportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const habitId = searchParams.get('habit')
  const reportRef = useRef<HTMLDivElement>(null)
  
  const [habit, setHabit] = useState<UserHabitWithDetails | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [encouragement, setEncouragement] = useState<Encouragement | null>(null)
  const [userName, setUserName] = useState<string>('朋友')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 生成个性化开场白 - 唯美小作文形式
  const generateIntro = () => {
    if (!stats) return ''
    
    const { current_streak, total_check_ins, longest_streak } = stats
    const today = new Date()
    const month = today.toLocaleDateString('zh-CN', { month: 'long' })
    const day = today.getDate()
    
    // 根据数据生成不同风格的小作文
    if (current_streak === 0 && total_check_ins === 0) {
      return `亲爱的${userName}，在这个${month}的第${day}天，你翻开了改变的第一页。每个人都有重新开始的权利，每一次尝试都值得被温柔以待。也许过去有过犹豫，也许未来充满未知，但此刻的你选择了出发，这本身就是一种了不起的勇气。习惯的养成从来不是一蹴而就，它需要时间的陪伴，需要内心的坚持。愿你在这条路上，遇见更好的自己。`
    }
    
    if (current_streak > 0 && current_streak < 7) {
      return `亲爱的${userName}，今天是${month}${day}日，你已经坚持了${current_streak}天。这${current_streak}天里，也许有过疲惫，也许有过动摇，但你还是选择了继续。每一个清晨的醒来，每一次对自己的承诺，都在悄悄改变着你。这段旅程才刚刚开始，前方还有更多美好等待着你去发现。至今累计${total_check_ins}次打卡，每一次都是你对自己的温柔守护。请相信，所有的坚持，终将绽放成最美的风景。`
    }
    
    if (current_streak >= 7 && current_streak < 21) {
      return `亲爱的${userName}，在${month}的第${day}天，你已经走过了${current_streak}个日夜。一周、两周、或许更久，时间在你的坚持中悄然流转，而你也在这个过程中变得越来越强大。${total_check_ins}次打卡记录，每一次都是你与更好自己的约定。你曾创造过${longest_streak}天的连续记录，那是属于你的高光时刻。习惯的力量正在你身上显现，那些曾经需要刻意为之的事情，如今已经成为生活的一部分。继续前行吧，你比想象中更优秀。`
    }
    
    if (current_streak >= 21 && current_streak < 66) {
      return `亲爱的${userName}，${month}${day}日，这是你坚持的第${current_streak}天。二十一天养成一个习惯，而你已经超越了这个门槛，将坚持变成了一种生活方式。${total_check_ins}次打卡，不仅仅是数字的累积，更是你与自己灵魂的${total_check_ins}次对话。你最长坚持了${longest_streak}天，这个记录见证了你的毅力与决心。现在的你，已经懂得了什么叫做"习惯成自然"，那些曾经的努力，如今已经化作生命中的一部分。感谢你对自己的温柔与坚定，愿你继续在这条路上熠熠生辉。`
    }
    
    if (current_streak >= 66 && current_streak < 100) {
      return `亲爱的${userName}，当${month}的阳光洒在第${day}天，你已经走过了${current_streak}个日日夜夜。科学研究表明，66天足以让一个新行为成为习惯，而你做到了。${total_check_ins}次的累计打卡，每一次都是对过去的肯定，对未来的期许。你创造了${longest_streak}天的最长连续记录，那是属于你的传奇。此刻的你，已经不需要太多的督促与提醒，因为坚持早已融入你的血液。你用实际行动证明了，改变不是偶然的奇迹，而是日复一日的选择。为你骄傲，也请继续温柔地对待自己的每一天。`
    }
    
    // 100天以上
    return `亲爱的${userName}，${month}${day}日，一个值得被铭记的日子。${current_streak}天的坚持，${total_check_ins}次的打卡，这些数字背后是你无数个清晨的醒来、无数次内心的对话、无数回对自己的承诺。你最长连续${longest_streak}天，这个记录不仅仅是时间的证明，更是你生命力量的展现。一百天、两百天、或是更久，你用实际行动诠释了什么叫做"持之以恒"。那些曾经觉得遥不可及的目标，如今已经成为日常；那些曾经需要克服的困难，如今已经云淡风轻。你已经成为了自己的英雄，也成为了他人的光。感谢你从未放弃，感谢你一直温柔而坚定地前行。未来的路还很长，但有你这样的勇气和毅力，一切皆有可能。`
  }

  useEffect(() => {
    async function loadData() {
      // 加载用户信息
      const profileResult = await getUserProfile()
      if (profileResult.success && profileResult.data) {
        setUserName(profileResult.data.display_name || profileResult.data.email?.split('@')[0] || '朋友')
      }
      
      // 如果有habitId，加载单个习惯的数据
      if (habitId) {
        const habitResult = await getHabitById(habitId)
        if (habitResult.success && habitResult.data) {
          setHabit(habitResult.data)
        }
      }

      // 加载统计数据
      const statsResult = await getUserStats()
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }

      // 加载热力图数据
      const currentYear = new Date().getFullYear()
      const heatmapResult = await getCheckInHeatmap(currentYear)
      if (heatmapResult.success && heatmapResult.data) {
        // 转换数据格式
        const heatmapArray: HeatmapData[] = []
        Object.entries(heatmapResult.data).forEach(([date, count]) => {
          heatmapArray.push({ date, count })
        })
        setHeatmapData(heatmapArray)
      }

      // 加载鼓励语
      const encouragementResult = await getReportEncouragement(statsResult.data?.current_streak)
      if (encouragementResult.success && encouragementResult.data) {
        setEncouragement(encouragementResult.data)
      }
    }

    loadData()
  }, [habitId])

  const generateImage = async () => {
    if (!reportRef.current) return

    setIsGenerating(true)
    setErrorMessage('')

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      // 转换为 Blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `dailychain-report-${new Date().toISOString().split('T')[0]}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
        setIsGenerating(false)
      }, 'image/png')
    } catch (error) {
      console.error('生成图片失败:', error)
      setErrorMessage('生成图片失败，请重试')
      setIsGenerating(false)
    }
  }

  // Loading 状态由页面级 Suspense 处理（顶部进度条）
  // 不需要内部 loading 状态，直接等待数据加载完成

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 操作按钮 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all"
          >
            返回
          </button>
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>生成图片分享</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {errorMessage}
          </div>
        )}

        {/* 报告内容 */}
        <div
          ref={reportRef}
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl gpu-accelerated"
        >
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {habit ? habit.name : '我的习惯报告'}
            </h1>
            <p className="text-slate-400">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="总打卡"
              value={stats?.total_check_ins || 0}
              icon="✓"
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              label="当前连续"
              value={stats?.current_streak || 0}
              icon="🔥"
              color="from-orange-500 to-red-500"
            />
            <StatCard
              label="最长连续"
              value={stats?.longest_streak || 0}
              icon="🏆"
              color="from-yellow-500 to-orange-500"
            />
            <StatCard
              label="活跃习惯"
              value={stats?.active_habits || 0}
              icon="⭐"
              color="from-purple-500 to-pink-500"
            />
          </div>

          {/* 个性化开场白 - 唯美小作文 */}
          <div className="mb-8 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 gpu-accelerated">
            <p className="text-sm sm:text-base text-white/90 leading-relaxed text-justify indent-8">
              {generateIntro()}
            </p>
          </div>

          {/* 唯美鼓励文案（数据库随机） */}
          {encouragement && (
            <div className="mb-8 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-8 border border-white/20 gpu-accelerated">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">✨</div>
                <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-2">
                  {encouragement.content}
                </p>
                <p className="text-slate-300 text-sm">
                  {encouragement.emotion === 'motivational' && '激励 · 向上'}
                  {encouragement.emotion === 'gentle' && '温柔 · 治愈'}
                  {encouragement.emotion === 'celebratory' && '庆祝 · 喜悦'}
                </p>
              </div>
            </div>
          )}

          {/* 热力图 */}
          <div className="bg-slate-900/30 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">打卡热力图</h2>
            <Heatmap data={heatmapData} />
          </div>

          {/* 底部标识 */}
          <div className="text-center mt-8 text-slate-500">
            <p>来自 DailyChain - 习惯养成助手</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 统计卡片组件
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}

// 热力图组件
function Heatmap({ data }: { data: HeatmapData[] }) {
  // 生成最近90天的日期
  const days = 90
  const today = new Date()
  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - i))
    return date.toISOString().split('T')[0]
  })

  // 创建日期到数量的映射
  const dataMap = new Map(data.map(d => [d.date, d.count]))

  // 按周分组
  const weeks: string[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((date) => {
              const count = dataMap.get(date) || 0
              const intensity = count === 0 ? 0 : Math.min(Math.ceil(count / 2), 4)
              const colors = [
                'bg-slate-700/30',
                'bg-green-900/50',
                'bg-green-700/70',
                'bg-green-500/90',
                'bg-green-400',
              ]
              
              return (
                <div
                  key={date}
                  className={`w-3 h-3 rounded-sm ${colors[intensity]}`}
                  title={`${date}: ${count}次`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
