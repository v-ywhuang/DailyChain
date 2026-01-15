import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './login-client'
import { GlobalLoadingBar } from '@/components/global-loading'

export const metadata: Metadata = {
  title: '登录 - DailyChain',
  description: '登录到你的DailyChain账号',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<GlobalLoadingBar />}>
      <LoginClient />
    </Suspense>
  )
}
