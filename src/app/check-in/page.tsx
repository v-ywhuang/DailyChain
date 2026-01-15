'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getUserHabits } from '@/lib/api/habits'
import { createCheckIn } from '@/lib/api/check-ins'
import { getSmartEncouragement } from '@/lib/api/encouragements'
import type { UserHabitWithDetails, Encouragement } from '@/lib/types/database.types'

export default function CheckInPage() {
  const router = useRouter()
  const [habits, setHabits] = useState<UserHabitWithDetails[]>([])
  const [selectedHabit, setSelectedHabit] = useState<UserHabitWithDetails | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [checking, setChecking] = useState(false)
  const [encouragement, setEncouragement] = useState<Encouragement | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true) // 添加初始加载状态

  // 个性化数据
  const [weight, setWeight] = useState('')
  const [pages, setPages] = useState('')
  const [mood, setMood] = useState<'great' | 'good' | 'ok' | 'bad' | ''>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadData() {
      const result = await getUserHabits()
      if (result.success && result.data) {
        const activeHabits = result.data.filter(h => !h.checked_today)
        setHabits(activeHabits)
        
        // 默认选择第一个
        if (activeHabits.length > 0) {
          setSelectedHabit(activeHabits[0])
          
          // 默认选中所有选项
          const allOptions = new Set(activeHabits[0].options.map(opt => opt.option_id))
          setSelectedOptions(allOptions)
        }
      }
      setIsInitialLoading(false) // 数据加载完成
    }
    loadData()
  }, [])

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions)
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId)
    } else {
      newSelected.add(optionId)
    }
    setSelectedOptions(newSelected)
  }

  const handleCheckIn = async () => {
    if (!selectedHabit || selectedOptions.size === 0) {
      setErrorMessage('请至少选择一个习惯项目')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setChecking(true)

    // 创建打卡记录
    const result = await createCheckIn({
      habit_id: selectedHabit.id,
      completed_option_ids: Array.from(selectedOptions),
      weight: weight ? Number(weight) : undefined,
      pages: pages ? Number(pages) : undefined,
      mood: mood || undefined,
      notes: notes || undefined
    })

    if (result.success) {
      // 获取鼓励语
      const encResult = await getSmartEncouragement({
        habit_id: selectedHabit.id,
        category: selectedHabit.category.name,
        streak: selectedHabit.current_streak + 1,
        context: 'daily'
      })

      if (encResult.success && encResult.data) {
        setEncouragement(encResult.data)
      }

      setShowSuccess(true)

      // 3秒后跳转
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } else {
      setErrorMessage(result.error || '打卡失败')
      setTimeout(() => setErrorMessage(''), 3000)
    }

    setChecking(false)
  }

  // Loading 状态由页面级 Suspense 处理（顶部进度条）

  // 只有加载完成且确认无习惯时才显示"都完成了"
  if (!isInitialLoading && habits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">今天的习惯都完成啦！</h2>
          <p className="text-white/70 mb-6">继续保持，明天见~</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // 成功页面
  if (showSuccess && encouragement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-2xl"
        >
          {/* 成功动画 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="text-9xl mb-6"
          >
            ✨
          </motion.div>

          {/* 连续天数 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="text-6xl font-bold text-white mb-2">
              {selectedHabit ? selectedHabit.current_streak + 1 : 0}
            </div>
            <div className="text-white/70 text-xl">天连续打卡</div>
          </motion.div>

          {/* 鼓励语 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 mb-6"
          >
            <p className="text-2xl text-white font-medium leading-relaxed">
              {encouragement.content}
            </p>
          </motion.div>

          {/* 返回按钮 */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl text-white hover:bg-white/30 transition-all"
          >
            返回首页
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            今日打卡 ✨
          </h1>
          <p className="text-white/70">
            记录你的每一次坚持
          </p>
        </motion.div>

        {/* 习惯选择（如果有多个） */}
        {habits.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <label className="block text-white/90 mb-3 font-medium">选择习惯</label>
            <div className="grid grid-cols-2 gap-3">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => {
                    setSelectedHabit(habit)
                    setSelectedOptions(new Set(habit.options.map(opt => opt.option_id)))
                  }}
                  className={`
                    p-4 rounded-2xl border transition-all text-left
                    ${selectedHabit?.id === habit.id
                      ? 'bg-white/20 border-white/50'
                      : 'bg-white/10 border-white/20 hover:border-white/30'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{habit.category.icon}</div>
                  <div className="text-white font-medium">{habit.name}</div>
                  <div className="text-white/50 text-sm">连续{habit.current_streak}天</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {selectedHabit && (
          <>
            {/* 习惯选项列表 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <label className="block text-white/90 mb-3 font-medium">今天完成了哪些？</label>
              <div className="space-y-3">
                {selectedHabit.options.map((habitOption) => {
                  const option = habitOption.option
                  const isSelected = selectedOptions.has(option.id)
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className="w-full text-left"
                    >
                      <div
                        className={`
                          p-4 rounded-2xl border transition-all
                          ${isSelected
                            ? 'bg-white/20 border-white/50'
                            : 'bg-white/10 border-white/20 hover:border-white/30'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium mb-1">{option.name}</div>
                            <div className="text-white/60 text-sm">{option.encouragement}</div>
                          </div>
                          
                          <div
                            className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                              ${isSelected ? 'bg-white border-white' : 'border-white/30'}
                            `}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* 个性化数据输入 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 mb-6"
            >
              <h3 className="text-white font-medium mb-4">记录详情（可选）</h3>
              
              <div className="space-y-4">
                {/* 体重（减肥类） */}
                {selectedHabit.category.name === '减肥' && (
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">今日体重 (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="65.5"
                    />
                  </div>
                )}

                {/* 阅读页数（阅读类） */}
                {selectedHabit.category.name === '阅读' && (
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">阅读页数</label>
                    <input
                      type="number"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="30"
                    />
                  </div>
                )}

                {/* 心情（冥想类） */}
                {selectedHabit.category.name === '冥想' && (
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">今日心情</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'great', label: '😄 很好', color: 'from-green-500 to-emerald-500' },
                        { value: 'good', label: '😊 不错', color: 'from-blue-500 to-cyan-500' },
                        { value: 'ok', label: '😐 一般', color: 'from-yellow-500 to-orange-500' },
                        { value: 'bad', label: '😔 不好', color: 'from-gray-500 to-slate-500' }
                      ].map((moodOption) => (
                        <button
                          key={moodOption.value}
                          type="button"
                          onClick={() => setMood(moodOption.value as any)}
                          className={`
                            px-3 py-2 rounded-xl text-sm font-medium transition-all
                            ${mood === moodOption.value
                              ? `bg-gradient-to-r ${moodOption.color} text-white`
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }
                          `}
                        >
                          {moodOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 备注 */}
                <div>
                  <label className="block text-white/80 mb-2 text-sm">今日感想</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                    placeholder="记录你的感受..."
                    rows={3}
                  />
                </div>
              </div>
            </motion.div>

            {/* 打卡按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <button
                onClick={() => router.back()}
                className="px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white hover:bg-white/15 transition-all"
              >
                取消
              </button>
              
              <button
                onClick={handleCheckIn}
                disabled={selectedOptions.size === 0 || checking}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:scale-105 transition-all"
              >
                {checking ? '打卡中...' : '完成打卡 ✨'}
              </button>
            </motion.div>
          </>
        )}

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
