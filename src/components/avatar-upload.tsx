'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { updateUserProfile } from '@/lib/api/user'
import { createBrowserClient } from '@supabase/ssr'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  onUploadComplete?: (url: string) => void
}

export default function AvatarUpload({ currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl || '')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      // 生成唯一文件名 - 路径必须是 avatars/{user-id}/{filename}
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `avatars/${user.id}/${fileName}`

      // 上传到Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      // 更新用户资料
      const result = await updateUserProfile({
        avatar_url: publicUrl
      })

      if (result.success) {
        setPreviewUrl(publicUrl)
        onUploadComplete?.(publicUrl)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('上传失败:', err)
      setError(err instanceof Error ? err.message : '上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 头像预览 */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-4 border-white/20 relative">
          {previewUrl ? (
            <Image 
              src={previewUrl} 
              alt="Avatar" 
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              👤
            </div>
          )}
        </div>

        {/* 上传按钮遮罩 */}
        <label 
          htmlFor="avatar-upload"
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-white text-2xl"
            >
              ⏳
            </motion.div>
          ) : (
            <span className="text-white text-sm">点击上传</span>
          )}
        </label>

        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* 提示文字 */}
      <div className="text-center">
        <p className="text-white/60 text-xs">
          支持 JPG、PNG、GIF格式，最大5MB
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-2 text-red-200 text-sm"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}
