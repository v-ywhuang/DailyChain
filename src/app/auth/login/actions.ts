'use server'

import { createClient } from '@/lib/supabase/server'

type LoginState = {
  error: string | null
}

/**
 * 服务端登录 Action
 */
export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: '登录失败，请重试' }
  }
}
