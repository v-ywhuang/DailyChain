'use client'

import Link from 'next/link'
import LoginForm from './login-form-v2'

export default function LoginClient() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">DailyChain</h1>
          <p className="text-gray-600">继续你的习惯之旅</p>
        </div>

        {/* 登录表单卡片 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-black mb-6">登录</h2>
          
          <LoginForm />
          
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600">
              还没有账号？{' '}
              <Link href="/auth/signup" className="text-black font-semibold hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-gray-500 text-sm mt-8">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}
