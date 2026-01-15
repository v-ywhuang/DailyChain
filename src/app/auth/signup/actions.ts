'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * 🔐 服务端注册 Action
 * 使用 Server Action 让 Supabase session 正确写入 cookie
 */
export async function signup(formData: FormData) {
  try {
    const supabase = await createClient()

    // 从 FormData 中提取数据
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    }

    console.log('[Server Action] 尝试注册:', data.email)

    // 🔐 Supabase Auth: 注册
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    })

    if (error) {
      console.error('[Server Action] 注册失败:', error.message)
      return { error: error.message }
    }

    // 💡 检查是否需要邮箱验证
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      console.log('[Server Action] ⚠️ 需要邮箱验证')
      return { 
        error: '✅ 注册成功！我们已发送验证邮件到 ' + data.email + '，请查收并点击链接完成验证。'
      }
    }

    console.log('[Server Action] ✅ 注册成功，准备重定向')

    // ✅ 注册成功，重新验证路径并重定向
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    // redirect() 会抛出 NEXT_REDIRECT 错误，需要重新抛出
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('[Server Action] 未知错误:', error)
    return { error: '注册失败，请重试' }
  }
}
