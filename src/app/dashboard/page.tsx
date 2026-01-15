import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export const metadata = {
  title: 'Dashboard - DailyChain',
  description: '管理你的习惯',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return <DashboardClient user={user} />
}
