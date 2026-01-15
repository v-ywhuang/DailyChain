'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getUserAchievements } from '@/lib/api/user'

// 匹配 API 返回的数据结构
interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  habit_id: string | null
  unlocked_at: string
  achievement: {
    id: string
    name: string
    description: string
    icon: string
    category: string
    unlock_condition: Record<string, unknown>
    is_active: boolean
    created_at: string
  }
}

export default function AchievementsPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null)

  useEffect(() => {
    async function loadAchievements() {
      console.log('🔍 开始加载成就...')
      const result = await getUserAchievements()
      console.log('📦 API返回结果:', result)
      
      if (result.success && result.data) {
        console.log('✅ 成就数据:', result.data)
        setAchievements(result.data)
      } else {
        console.error('❌ 加载失败:', result.error)
      }
    }
    loadAchievements()
  }, [])

  // Loading 状态由页面级 Suspense 处理（顶部进度条）

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto pb-20">
      {/* Aurora背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏆 我的成就
          </h1>
          <p className="text-white/70 text-lg">
            已解锁 {achievements.length} 个成就徽章
          </p>
        </motion.div>

        {/* Achievements Grid */}
        {achievements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-2">开始你的旅程</h3>
            <p className="text-white/70 mb-6">完成第一次打卡，解锁你的第一个成就！</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold"
            >
              开始打卡
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setSelectedAchievement(achievement)}
                className="relative cursor-pointer group"
              >
                {/* Glassmorphism Card */}
                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 h-full overflow-hidden transition-all duration-300 hover:bg-white/15 hover:border-white/30 gpu-accelerated">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  
                  <div className="relative z-10 text-center">
                    {/* Icon */}
                    <div className="text-6xl mb-4">{achievement.achievement.icon}</div>
                    
                    {/* Name */}
                    <h3 className="text-lg font-bold text-white mb-2">
                      {achievement.achievement.name}
                    </h3>
                    
                    {/* Date */}
                    <p className="text-white/50 text-xs">
                      {new Date(achievement.unlocked_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Share Button */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => {/* TODO: 实现分享功能 */}}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold hover:scale-105 transition-transform"
            >
              🎉 分享我的成就
            </button>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/70 hover:text-white transition-colors"
          >
            ← 返回首页
          </button>
        </motion.div>
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAchievement(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 max-w-md w-full gpu-accelerated"
            >
              <div className="text-center">
                <div className="text-8xl mb-6">{selectedAchievement.achievement.icon}</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {selectedAchievement.achievement.name}
                </h2>
                <p className="text-white/70 text-lg mb-6">
                  {selectedAchievement.achievement.description}
                </p>
                <p className="text-white/50 mb-8">
                  解锁时间：{new Date(selectedAchievement.unlocked_at).toLocaleString('zh-CN')}
                </p>
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="px-6 py-3 bg-white/20 rounded-2xl text-white hover:bg-white/30 transition-all"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
