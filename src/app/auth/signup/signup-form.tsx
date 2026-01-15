'use client'

import { useState, useTransition } from 'react'
import { signup } from './actions'

export default function SignupForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // 处理表单提交
  const handleSubmit = async (formData: FormData) => {
    setError(null)

    // 客户端验证
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 8) {
      setError('密码至少需要8个字符')
      return
    }
    if (!name || name.length < 2) {
      setError('昵称至少需要2个字符')
      return
    }
    if (name.length > 20) {
      setError('昵称不能超过20个字符')
      return
    }

    console.log('🚀 提交注册表单...')

    startTransition(async () => {
      try {
        const result = await signup(formData)

        if (result?.error) {
          if (result.error.includes('already registered')) {
            setError('该邮箱已被注册，请直接登录')
          } else {
            setError(result.error)
          }
        }
      } catch (err) {
        console.error('注册错误:', err)
        setError('注册失败，请重试')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* 错误/成功提示 */}
      {error && (
        <div
          className={`p-3 rounded-lg border text-sm ${
            error.includes('✅')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          {error}
        </div>
      )}

      {/* 昵称输入 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-1.5">
          昵称
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={20}
          className="w-full px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder:text-white/50"
          placeholder="你的昵称"
          disabled={isPending}
          autoComplete="name"
        />
      </div>

      {/* 邮箱输入 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder:text-white/50"
          placeholder="your@email.com"
          disabled={isPending}
          autoComplete="email"
        />
      </div>

      {/* 密码输入 */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full px-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-white placeholder:text-white/50"
          placeholder="至少8个字符"
          disabled={isPending}
          autoComplete="new-password"
        />
        <p className="mt-1 text-xs text-purple-200">密码至少8个字符，建议包含字母、数字和符号</p>
      </div>

      {/* 注册按钮 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-medium rounded-lg hover:from-primary-dark hover:to-primary transition-all duration-normal shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            注册中...
          </span>
        ) : (
          '立即注册'
        )}
      </button>

      {/* 服务条款 */}
      <p className="text-xs text-text-secondary text-center">
        注册即表示你同意我们的{' '}
        <a href="/terms" className="text-primary hover:underline">
          服务条款
        </a>{' '}
        和{' '}
        <a href="/privacy" className="text-primary hover:underline">
          隐私政策
        </a>
      </p>
    </form>
  )
}
