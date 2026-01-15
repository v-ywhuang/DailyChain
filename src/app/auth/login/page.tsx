import { Metadata } from 'next'
import LoginClient from './login-client'

export const metadata: Metadata = {
  title: '登录 - DailyChain',
  description: '登录到你的DailyChain账号',
}

export default function LoginPage() {
  return <LoginClient />
}
