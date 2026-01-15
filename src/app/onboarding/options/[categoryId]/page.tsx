'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { getHabitOptions, createUserHabit } from '@/lib/api/habits'
import type { HabitOption } from '@/lib/types/database.types'

export default function OnboardingOptionsPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryName = searchParams.get('name') || '习惯'
  
  const [categoryId, setCategoryId] = useState<string>('')
  const [options, setOptions] = useState<HabitOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [habitName, setHabitName] = useState(`我的${categoryName}计划`)
  const [targetDays, setTargetDays] = useState(30)

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      setCategoryId(resolvedParams.categoryId)
      
      const result = await getHabitOptions(resolvedParams.categoryId)
      if (result.success && result.data) {
        setOptions(result.data)
        
        // 默认选中热门选项（最多3个）
        const popularOptions = result.data.filter(opt => opt.is_popular).slice(0, 3)
        setSelectedOptions(new Set(popularOptions.map(opt => opt.id)))
      }
    }
    init()
  }, [params])

  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions)
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId)
    } else {
      // 最多选5个
      if (newSelected.size < 5) {
        newSelected.add(optionId)
      }
    }
    setSelectedOptions(newSelected)
  }

  const handleCreate = async () => {
    if (selectedOptions.size === 0) {
      setErrorMessage('请至少选择1个习惯选项')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setCreating(true)
    const result = await createUserHabit({
      category_id: categoryId,
      name: habitName,
      target_days: targetDays,
      option_ids: Array.from(selectedOptions)
    })

    if (result.success) {
      router.push('/dashboard?new=true')
    } else {
      // 如果是达到上限，显示升级弹窗
      if (result.error === 'NEED_UPGRADE') {
        setShowUpgradeModal(true)
      } else {
        setErrorMessage(result.error || '创建失败')
        setTimeout(() => setErrorMessage(''), 3000)
      }
    }
    setCreating(false)
  }

  // 按类型分组
  const groupedOptions = options.reduce((acc, option) => {
    if (!acc[option.type]) {
      acc[option.type] = []
    }
    acc[option.type].push(option)
    return acc
  }, {} as Record<string, HabitOption[]>)

  const typeNames: Record<string, string> = {
    diet: '饮食习惯 🥗',
    exercise: '运动习惯 🏃',
    lifestyle: '生活习惯 💧',
    mental: '心理习惯 🧘',
    learning: '学习习惯 📚'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            选择你的习惯组合 ✨
          </h1>
          <p className="text-white/70">
            已选择 {selectedOptions.size}/5 个习惯
          </p>
        </motion.div>

        {/* 习惯名称和目标设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 mb-8"
        >
          <div className="mb-4">
            <label className="block text-white/90 mb-2 font-medium">习惯名称</label>
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="给你的习惯起个名字"
            />
          </div>
          
          <div>
            <label className="block text-white/90 mb-2 font-medium">目标天数</label>
            <input
              type="number"
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              min="7"
              max="365"
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </motion.div>

        {/* 选项列表（按类型分组） */}
        <div className="space-y-8 mb-8">
          {Object.entries(groupedOptions).map(([type, typeOptions]) => (
            <div key={type}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                {typeNames[type] || type}
                <span className="text-sm font-normal text-white/50">
                  ({typeOptions.length} 个选项)
                </span>
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {typeOptions.map((option, index) => {
                  const isSelected = selectedOptions.has(option.id)
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleOption(option.id)}
                      className="relative group text-left"
                    >
                      <div
                        className={`
                          relative bg-white/10 backdrop-blur-lg border rounded-2xl p-5 transition-all duration-300
                          ${isSelected 
                            ? 'border-white/50 bg-white/20' 
                            : 'border-white/20 hover:border-white/30 hover:bg-white/15'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* 标题和标签 */}
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white">
                                {option.name}
                              </h3>
                              
                              {option.is_popular && (
                                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                                  🔥 热门
                                </span>
                              )}
                              
                              {/* 难度星级 */}
                              <div className="flex items-center">
                                {Array.from({ length: option.difficulty }).map((_, i) => (
                                  <span key={i} className="text-yellow-400">⭐</span>
                                ))}
                              </div>
                            </div>

                            {/* 鼓励语 */}
                            <p className="text-white/80 text-sm mb-2">
                              {option.encouragement}
                            </p>

                            {/* 提示 */}
                            {option.tips && (
                              <p className="text-white/50 text-xs">
                                💡 {option.tips}
                              </p>
                            )}

                            {/* 额外信息 */}
                            <div className="flex items-center gap-3 mt-3 text-white/50 text-xs">
                              {option.estimated_time && (
                                <span>⏱️ {option.estimated_time}分钟</span>
                              )}
                              {option.calories_burn && (
                                <span>🔥 {option.calories_burn}卡</span>
                              )}
                              <span>📊 {option.usage_count}人选择</span>
                            </div>
                          </div>

                          {/* 选中标记 */}
                          <div className="ml-4">
                            <div
                              className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${isSelected 
                                  ? 'bg-white border-white' 
                                  : 'border-white/30'
                                }
                              `}
                            >
                              {isSelected && (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-4 h-4 text-purple-900"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </motion.svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-gradient-to-t from-purple-900 via-purple-900/95 to-transparent pt-8 pb-6"
        >
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white hover:bg-white/15 transition-all"
            >
              返回
            </button>
            
            <button
              onClick={handleCreate}
              disabled={selectedOptions.size === 0 || creating}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:scale-105 transition-all"
            >
              {creating ? '创建中...' : '完成创建 ✨'}
            </button>
          </div>
        </motion.div>

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

        {/* 升级Pro弹窗 */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    已达到免费版上限
                  </h3>
                  <p className="text-white/80 mb-6">
                    免费版最多创建 <span className="text-yellow-400 font-bold">1个习惯</span>
                  </p>
                  
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                    <div className="text-yellow-400 text-lg font-bold mb-3">
                      升级到 Pro 版本 ✨
                    </div>
                    <div className="text-white text-2xl font-bold mb-3">
                      仅需 ¥9.9/月
                    </div>
                    <ul className="text-left text-white/90 space-y-2 text-sm">
                      <li>✅ 无限创建习惯</li>
                      <li>✅ 每月3次补卡</li>
                      <li>✅ 高级数据分析</li>
                      <li>✅ 更多成就徽章</li>
                      <li>✅ 专属鼓励语</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all"
                    >
                      暂不升级
                    </button>
                    <button
                      onClick={() => {
                        router.push('/pricing')
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white font-bold hover:shadow-lg hover:scale-105 transition-all"
                    >
                      立即升级 🚀
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
    </div>
  )
}
