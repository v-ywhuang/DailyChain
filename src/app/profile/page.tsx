'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getUserProfile, updateUserProfile } from '@/lib/api/user'
import AvatarUpload from '@/components/avatar-upload'
import type { UserProfile } from '@/lib/types/database.types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const result = await getUserProfile()
      if (result.success && result.data) {
        setProfile(result.data)
        setDisplayName(result.data.display_name || '')
      }
    }
    loadProfile()
  }, [])

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return
    
    setIsSaving(true)
    const result = await updateUserProfile({ display_name: displayName.trim() })
    
    if (result.success && result.data) {
      setProfile(result.data)
      setIsEditingName(false)
    }
    setIsSaving(false)
  }

  // Loading 状态由页面级 Suspense 处理（顶部进度条）

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

          <h1 className="text-xl font-bold text-white">个人资料</h1>

          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* 头像上传 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6"
        >
          <h2 className="text-white font-bold text-lg mb-6 text-center">头像设置</h2>
          <AvatarUpload 
            currentAvatarUrl={profile?.avatar_url || undefined}
            onUploadComplete={(url) => {
              if (profile) {
                setProfile({ ...profile, avatar_url: url })
              }
            }}
          />
        </motion.div>

        {/* 个人信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-6"
        >
          <h2 className="text-white font-bold text-lg mb-6">基本信息</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-2 block">邮箱</label>
              <div className="bg-white/5 rounded-xl px-4 py-3 text-white">
                {profile?.email}
              </div>
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">昵称</label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-white border border-white/10 focus:border-purple-500 focus:outline-none"
                    placeholder="请输入昵称"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={isSaving}
                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setDisplayName(profile?.display_name || '')
                    }}
                    className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-white">
                    {profile?.display_name || '未设置昵称'}
                  </div>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                  >
                    编辑
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-sm mb-2 block">会员等级</label>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-xl font-bold ${
                  profile?.plan === 'pro' 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500' 
                    : 'bg-white/10'
                } text-white`}>
                  {profile?.plan === 'pro' ? '🎯 Pro会员' : '🆓 免费版'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <h2 className="text-white font-bold text-lg mb-6">我的成就</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {profile?.total_check_ins || 0}
              </div>
              <div className="text-white/60 text-sm">累计打卡</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {profile?.longest_streak || 0}
              </div>
              <div className="text-white/60 text-sm">最长连续</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {profile?.max_active_habits || 1}
              </div>
              <div className="text-white/60 text-sm">习惯上限</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {profile?.makeup_count || 0}
              </div>
              <div className="text-white/60 text-sm">补卡次数</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
