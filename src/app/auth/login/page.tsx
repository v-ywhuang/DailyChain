import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './login-client'

export const metadata: Metadata = {
  title: '登录 - DailyChain',
  description: '登录到你的DailyChain账号',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginClient />
    </Suspense>
  )
}
