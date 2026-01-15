'use client'

import { useState, useActionState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { login } from './actions'
import Link from 'next/link'

const initialState = {
  error: null as string | null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-400 hover:to-pink-400 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
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
          登录中...
        </span>
      ) : (
        '登录'
      )}
    </button>
  )
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  
  const [state, formAction] = useActionState(login, initialState)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (state && state !== initialState && state.error === null) {
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 100)
    }
  }, [state, redirectTo, router])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      
      {state?.error && (
        <div className="p-3 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 text-sm">
          {state.error.includes('Invalid login credentials') 
            ? '邮箱或密码错误，请检查后重试'
            : state.error.includes('Email not confirmed')
            ? '⚠️ 请先验证你的邮箱！我们已发送验证邮件，请查收并点击链接完成验证后再登录。'
            : state.error
          }
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-white placeholder:text-white/50 hover:bg-white/15"
          placeholder="your@email.com"
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            密码
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
          >
            忘记密码？
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-white placeholder:text-white/50 hover:bg-white/15"
          placeholder="输入密码"
          autoComplete="current-password"
        />
      </div>

      <div className="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 text-purple-500 focus:ring-purple-400 border-white/20 rounded bg-white/10 cursor-pointer"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-white cursor-pointer">
          记住我
        </label>
      </div>

      <SubmitButton />
    </form>
  )
}
