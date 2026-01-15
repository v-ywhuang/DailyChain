// 用户相关API
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserProfile, ApiResponse } from '@/lib/types/database.types'

// ============================================
// 获取当前用户资料
// ============================================
export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const supabase = await createServerSupabaseClient()
    
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
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 更新用户资料
// ============================================
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>
): Promise<ApiResponse<UserProfile>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data,
      message: '资料更新成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 升级会员计划
// ============================================
export async function upgradePlan(plan: 'pro' | 'premium'): Promise<ApiResponse<UserProfile>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 根据计划设置权益
    const maxActiveHabits = plan === 'pro' ? 999 : 999 // 无限
    const makeupCount = plan === 'pro' ? 3 : 10
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        plan,
        max_active_habits: maxActiveHabits,
        makeup_count: makeupCount
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data,
      message: `恭喜升级到${plan === 'pro' ? 'Pro' : 'Premium'}会员！`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 检查用户权限
// ============================================
export async function checkUserPermission(
  permission: 'create_habit' | 'makeup' | 'unlimited'
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, max_active_habits, makeup_count')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return { success: true, data: false }
    }
    
    switch (permission) {
      case 'create_habit':
        // 检查是否可以创建新习惯
        const { count } = await supabase
          .from('user_habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)
        
        return {
          success: true,
          data: (count || 0) < profile.max_active_habits
        }
      
      case 'makeup':
        // 检查是否有补卡次数
        return {
          success: true,
          data: profile.makeup_count > 0
        }
      
      case 'unlimited':
        // 检查是否是付费用户
        return {
          success: true,
          data: profile.plan !== 'free'
        }
      
      default:
        return { success: true, data: false }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 获取用户成就列表
// ============================================
export async function getUserAchievements() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 检查并解锁成就
// ============================================
export async function checkAndUnlockAchievements(habitId?: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取所有成就
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
    
    if (!achievements) return { success: true, data: [] }
    
    // 获取用户统计数据（重新查询以获取最新数据）
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('🔍 检查成就解锁条件:', {
      userId: user.id,
      totalCheckIns: profile?.total_check_ins,
      longestStreak: profile?.longest_streak,
      currentStreak: profile?.current_streak
    })
    
    // 检查每个成就的解锁条件
    const newAchievements = []
    
    for (const achievement of achievements) {
      // 检查是否已解锁（不关联habit_id，一个成就全局只解锁一次）
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievement.id)
        .maybeSingle()
      
      if (existing) continue
      
      // 检查解锁条件
      const condition = achievement.unlock_condition as { type: string; value: number }
      let unlocked = false
      
      if (condition.type === 'total_check_ins') {
        // 使用用户总打卡数
        unlocked = (profile?.total_check_ins || 0) >= condition.value
        console.log(`  📋 ${achievement.name}: ${profile?.total_check_ins || 0} >= ${condition.value} = ${unlocked}`)
      } else if (condition.type === 'streak') {
        // 使用用户最长连续记录
        unlocked = (profile?.longest_streak || 0) >= condition.value
        console.log(`  🔥 ${achievement.name}: ${profile?.longest_streak || 0} >= ${condition.value} = ${unlocked}`)
      } else if (condition.type === 'longest_streak') {
        unlocked = (profile?.longest_streak || 0) >= condition.value
        console.log(`  🏆 ${achievement.name}: ${profile?.longest_streak || 0} >= ${condition.value} = ${unlocked}`)
      }
      
      // 解锁成就
      if (unlocked) {
        console.log(`  ✅ 解锁成就: ${achievement.name}`)
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            habit_id: habitId
          })
        
        newAchievements.push(achievement)
      }
    }
    
    console.log(`🎉 本次解锁 ${newAchievements.length} 个成就`)
    
    return {
      success: true,
      data: newAchievements
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
