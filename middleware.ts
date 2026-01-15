import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 🔓 认证页面（已登录用户不能访问）
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/forgot-password']

// 🔒 受保护路由（必须登录）
const PROTECTED_ROUTES = ['/dashboard', '/habits', '/settings', '/achievements']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 更新 Supabase session（自动刷新token）
  const { response, user } = await updateSession(request)

  // 已登录用户访问认证页面 → 重定向到 dashboard
  if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 未登录用户访问受保护页面 → 重定向到登录页
  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 访问首页时，已登录用户重定向到 dashboard
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 图片文件 (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
