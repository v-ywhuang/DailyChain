import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // 退出登录
  await supabase.auth.signOut()
  
  // 清除所有 Supabase cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  allCookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
    }
  })
  
  // 返回重定向响应
  const redirectUrl = new URL('/', request.url)
  return NextResponse.redirect(redirectUrl)
}
