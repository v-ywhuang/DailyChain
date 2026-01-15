import { Metadata } from 'next';
import SignupClient from './signup-client';

export const metadata: Metadata = {
  title: '注册 - DailyChain',
  description: '创建你的DailyChain账号，开始养成好习惯',
};

export default function SignupPage() {
  return <SignupClient />
}
