'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function ReportPage() {
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

      // 加载真实热力图数据（最近90天）
      const today = new Date()
      const currentYear = today.getFullYear()
      const heatmapResult = await getCheckInHeatmap(currentYear)
      
      if (heatmapResult.success && heatmapResult.data) {
        // 转换 Record<string, number> 为 HeatmapData[]
        const heatmapArray: HeatmapData[] = []
        
        // 生成最近90天的日期
        for (let i = 89; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          heatmapArray.push({
            date: dateStr,
            count: heatmapResult.data[dateStr] || 0
          })
        }
        
        setHeatmapData(heatmapArray)
      }

      setLoading(false)
    }
    loadData()
  }, [habitId])

  const generateShareImage = async () => {
    if (!reportRef.current) return
    
    setIsGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#1e1b4b',
        scale: 2,
        useCORS: true
      })
      
      const dataUrl = canvas.toDataURL('image/png')
      
      // 下载图片
      const link = document.createElement('a')
      link.download = `链习惯-${habit?.name || '数据报告'}-${new Date().toLocaleDateString()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('生成失败:', error)
      setErrorMessage('生成失败，请重试')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成鼓励语
  const getEncouragementText = () => {
    if (!stats) return ''
    
    const { current_streak, longest_streak, total_check_ins } = stats
    
    const texts = []
    
    if (current_streak >= 7) {
      texts.push(`🎉 太棒了！你已经坚持了${current_streak}天，这份自律会让你变得更好！`)
    } else if (current_streak > 0) {
      texts.push(`💪 已经连续坚持${current_streak}天，继续加油！`)
    }
    
    if (longest_streak >= 30) {
      texts.push(`👑 最长连续${longest_streak}天，你已经是习惯养成大师了！`)
    } else if (longest_streak >= 14) {
      texts.push(`🌟 最长坚持${longest_streak}天，习惯正在慢慢养成！`)
    }
    
    if (total_check_ins >= 100) {
      texts.push(`🏆 累计打卡${total_check_ins}次，这是多么珍贵的坚持啊！`)
    } else if (total_check_ins >= 30) {
      texts.push(`📈 已经完成${total_check_ins}次打卡，每一次都是进步的见证！`)
    } else if (total_check_ins > 0) {
      texts.push(`🌱 ${total_check_ins}次打卡，习惯的种子正在生根发芽！`)
    }
    
    return texts.join('\n\n')
  }

  // 生成总结文案
  const getSummaryText = () => {
    if (!stats) return ''
    
    const { current_streak, total_check_ins, active_habits } = stats
    
    return `
在这段旅程中，你已经完成了 ${total_check_ins} 次打卡，
养成了 ${active_habits} 个好习惯。

${current_streak > 0 ? `当前已经连续坚持 ${current_streak} 天，` : ''}
每一次的坚持都在塑造更好的自己。

记住：改变不是一蹴而就的，
而是日复一日的微小积累。
你的每一个选择，都在书写未来的自己。

感恩你对自己的不放弃 ❤️
    `.trim()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto pb-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 可分享的报告卡片 */}
        <div ref={reportRef} className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-8 mb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              📊 我的习惯报告
            </h1>
            <p className="text-white/70">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: '🔥', label: '连续天数', value: `${stats.current_streak}天`, color: 'from-orange-500 to-red-500' },
                { icon: '🏆', label: '最长记录', value: `${stats.longest_streak}天`, color: 'from-yellow-500 to-orange-500' },
                { icon: '✅', label: '总打卡', value: `${stats.total_check_ins}次`, color: 'from-green-500 to-emerald-500' },
                { icon: '🎯', label: '活跃习惯', value: `${stats.active_habits}个`, color: 'from-blue-500 to-cyan-500' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">{stat.icon}</div>
                    <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-white/70 text-sm">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 打卡热力图 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-4">📅 打卡热力图</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 91 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (90 - i))
                const dateStr = date.toISOString().split('T')[0]
                const count = heatmapData.find(d => d.date === dateStr)?.count || 0
                
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded ${
                      count === 0 ? 'bg-white/10' :
                      count === 1 ? 'bg-green-500/30' :
                      count === 2 ? 'bg-green-500/60' :
                      'bg-green-500'
                    }`}
                    title={`${dateStr}: ${count}次打卡`}
                  />
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-white/50">
              <span>少</span>
              <div className="w-3 h-3 rounded bg-white/10" />
              <div className="w-3 h-3 rounded bg-green-500/30" />
              <div className="w-3 h-3 rounded bg-green-500/60" />
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>多</span>
            </div>
          </motion.div>

          {/* 成长总结 */}
          {stats && stats.total_check_ins > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 backdrop-blur-lg rounded-2xl p-6 border border-orange-500/20 mb-6"
            >
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <span>💭</span>
                <span>成长总结</span>
              </h3>
              <p className="text-purple-100 leading-relaxed whitespace-pre-line">
                {getSummaryText()}
              </p>
            </motion.div>
          )}

          {/* 动态鼓励语 */}
          {getEncouragementText() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 mb-6"
            >
              <p className="text-purple-100 leading-relaxed whitespace-pre-line">
                {getEncouragementText()}
              </p>
            </motion.div>
          )}

          {/* 拉新Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <div className="inline-block bg-gradient-to-r from-orange-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl px-6 py-4 border border-orange-500/30">
              <p className="text-white/90 text-sm mb-2">
                🔗 加入我们，一起养成好习惯！
              </p>
              <p className="text-purple-300 text-xs">
                扫描二维码或访问 dailychain.app
              </p>
            </div>
          </motion.div>

          {/* 静态鼓励语 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-center"
          >
            <p className="text-xl text-white font-medium italic">
              &ldquo;坚持的每一天，都在塑造更好的自己&rdquo;
            </p>
            <p className="text-white/50 mt-2">- 链习惯 DailyChain</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={generateShareImage}
            disabled={isGenerating}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isGenerating ? '生成中...' : '📸 保存为图片'}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl text-white hover:bg-white/30 transition-all"
          >
            返回首页
          </button>
        </div>

        {/* 错误提示Toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-red-500/90 backdrop-blur-lg px-6 py-4 rounded-2xl text-white font-medium shadow-2xl border border-red-400/50">
                {errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
