import { createBrowserClient } from '@supabase/ssr'

/**
 * 客户端Supabase客户端（用于浏览器/Client Components）
 * 使用环境变量 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * @supabase/ssr 的 createBrowserClient 会自动使用 cookie 存储 session
 * 这样服务端的 middleware 就能读取到 session
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
