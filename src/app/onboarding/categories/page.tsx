'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getCategoriesWithOptions } from '@/lib/api/habits'
import Loading from '@/components/loading'
import type { HabitCategoryWithOptions } from '@/lib/types/database.types'

export default function OnboardingCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<HabitCategoryWithOptions[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const result = await getCategoriesWithOptions()
      if (result.success && result.data) {
        setCategories(result.data)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSelectCategory = (category: HabitCategoryWithOptions) => {
    router.push(`/onboarding/options/${category.id}?name=${encodeURIComponent(category.name)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto">
      {loading ? (
        <Loading />
      ) : (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            你想养成什么习惯？ ✨
          </h1>
          <p className="text-white/70 text-lg">
            选择一个类别，开启你的改变之旅
          </p>
        </motion.div>

        {/* 类别卡片网格 */}
        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-12 text-center"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-4">数据库未初始化</h3>
            <p className="text-white/70 mb-6">
              请先在 Supabase Dashboard 中执行迁移脚本
            </p>
            <div className="bg-black/30 rounded-lg p-4 text-left text-sm font-mono text-white/80 mb-6">
              <p>📍 迁移脚本位置:</p>
              <p className="text-blue-300">supabase/migrations/20260114_complete_schema.sql</p>
              <p className="mt-4">🔗 执行步骤:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>打开 <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-400 hover:underline">Supabase Dashboard</a></li>
                <li>进入项目 SQL Editor</li>
                <li>复制迁移脚本内容并执行</li>
                <li>刷新此页面</li>
              </ol>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full transition-all"
            >
              返回首页
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectCategory(category)}
              className="relative group"
            >
              {/* Glassmorphism卡片 */}
              <div
                className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 h-full overflow-hidden transition-all duration-300 hover:bg-white/15 hover:border-white/30"
              >
                {/* 背景光晕 */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-3xl"
                  style={{ backgroundColor: category.color }}
                />

                {/* 内容 */}
                <div className="relative z-10 text-left">
                  {/* Icon */}
                  <div className="text-6xl mb-4">{category.icon}</div>

                  {/* 标题 */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {category.name}
                  </h3>

                  {/* 描述 */}
                  <p className="text-white/70 mb-4">
                    {category.description}
                  </p>

                  {/* 选项数量 */}
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{category.options?.length || 0} 个选项可选</span>
                  </div>
                </div>

                {/* 箭头 */}
                <div className="absolute bottom-6 right-6 text-white/50 group-hover:text-white/80 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
          </div>
        )}

        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← 返回首页
          </button>
        </motion.div>
        </div>
      )}
    </div>
  )
}
