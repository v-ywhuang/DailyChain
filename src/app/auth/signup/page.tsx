import { Metadata } from 'next'
import { Suspense } from 'react'
import SignupClient from './signup-client'
import { GlobalLoadingBar } from '@/components/global-loading'

export const metadata: Metadata = {
  title: '注册 - DailyChain',
  description: '创建你的DailyChain账号，开始养成好习惯',
}

export default function SignupPage() {
  return (
    <Suspense fallback={<GlobalLoadingBar />}>
      <SignupClient />
    </Suspense>
  )
}
