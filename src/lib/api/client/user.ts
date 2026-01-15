/**
 * 客户端 API - 用户相关
 * 直接在浏览器调用 Supabase，性能更快
 */

import { createClient } from '@/lib/supabase/client'
import type { UserProfile, ApiResponse } from '@/lib/types/database.types'

const supabase = createClient()

/**
 * 获取当前用户资料
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      // 如果用户资料不存在，创建一个
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!
          })
          .select()
          .single()
        
        if (createError) throw createError
        
        return {
          success: true,
          data: newProfile
        }
      }
      
      throw error
    }
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('获取用户资料失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取用户资料失败'
    }
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<UserProfile>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新用户资料失败'
    }
  }
}
