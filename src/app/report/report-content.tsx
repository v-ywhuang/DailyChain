'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserStats, getCheckInHeatmap } from '@/lib/api/stats'
import { getHabitById } from '@/lib/api/habits'
import html2canvas from 'html2canvas'
import type { UserHabitWithDetails } from '@/lib/types/database.types'

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
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadData() {
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

      setLoading(false)
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

  const shareToWechat = async () => {
    await generateImage()
    setErrorMessage('图片已保存，请手动分享到微信')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? '生成中...' : '生成图片'}
          </button>
          <button
            onClick={shareToWechat}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            分享到微信
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
          className="bg-gradient-to-br from-slate-800/50 to-purple-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
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
