// 鼓励语相关API
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  Encouragement,
  GetEncouragementRequest,
  ApiResponse
} from '@/lib/types/database.types'

// ============================================
// 获取智能推荐的鼓励语
// ============================================
export async function getSmartEncouragement(
  request: GetEncouragementRequest
): Promise<ApiResponse<Encouragement>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取用户最近看过的鼓励语ID（避免重复）
    const { data: history } = await supabase
      .from('user_encouragement_history')
      .select('encouragement_id')
      .eq('user_id', user.id)
      .gte('shown_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7天内
      .order('shown_at', { ascending: false })
      .limit(20)
    
    const recentIds = history?.map(h => h.encouragement_id) || []
    
    // 构建查询
    let query = supabase
      .from('encouragements')
      .select('*')
      .eq('is_active', true)
    
    // 过滤类别
    if (request.category) {
      query = query.or(`category.eq.${request.category},category.is.null`)
    } else {
      query = query.is('category', null)
    }
    
    // 过滤上下文
    if (request.context) {
      query = query.eq('context', request.context)
    }
    
    // 过滤连续天数范围
    if (request.streak !== undefined) {
      query = query.or(
        `and(min_streak.lte.${request.streak},max_streak.gte.${request.streak}),` +
        `and(min_streak.lte.${request.streak},max_streak.is.null),` +
        `and(min_streak.is.null,max_streak.gte.${request.streak}),` +
        `and(min_streak.is.null,max_streak.is.null)`
      )
    }
    
    // 排除最近看过的
    if (recentIds.length > 0) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`)
    }
    
    const { data, error } = await query.order('weight', { ascending: false })
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      // 如果没有找到，返回通用鼓励语
      const { data: fallback } = await supabase
        .from('encouragements')
        .select('*')
        .eq('is_active', true)
        .is('category', null)
        .eq('context', 'daily')
        .order('weight', { ascending: false })
        .limit(1)
        .single()
      
      if (fallback) {
        await recordEncouragementShown(fallback.id, request.habit_id)
        return { success: true, data: fallback }
      }
      
      throw new Error('没有可用的鼓励语')
    }
    
    // 根据权重随机选择
    const totalWeight = data.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight
    
    let selected = data[0]
    for (const encouragement of data) {
      random -= encouragement.weight
      if (random <= 0) {
        selected = encouragement
        break
      }
    }
    
    // 记录已展示
    await recordEncouragementShown(selected.id, request.habit_id)
    
    // 更新使用次数
    await supabase
      .from('encouragements')
      .update({ usage_count: selected.usage_count + 1 })
      .eq('id', selected.id)
    
    return {
      success: true,
      data: selected
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 记录鼓励语展示历史
// ============================================
async function recordEncouragementShown(
  encouragementId: string,
  habitId?: string
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase
      .from('user_encouragement_history')
      .insert({
        user_id: user.id,
        encouragement_id: encouragementId,
        habit_id: habitId
      })
  } catch (error) {
    // 忽略错误
    console.error('Failed to record encouragement:', error)
  }
}

// ============================================
// 点赞鼓励语
// ============================================
export async function likeEncouragement(encouragementId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 更新点赞数
    const { error } = await supabase.rpc('increment_encouragement_likes', {
      encouragement_id: encouragementId
    })
    
    if (error) {
      // 如果RPC不存在，使用直接更新
      const { data: current } = await supabase
        .from('encouragements')
        .select('like_count')
        .eq('id', encouragementId)
        .single()
      
      if (current) {
        await supabase
          .from('encouragements')
          .update({ like_count: current.like_count + 1 })
          .eq('id', encouragementId)
      }
    }
    
    // 记录用户点赞
    await supabase
      .from('user_encouragement_history')
      .update({ was_liked: true })
      .eq('user_id', user.id)
      .eq('encouragement_id', encouragementId)
    
    return {
      success: true,
      message: '感谢你的反馈！'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 获取每日鼓励语（打卡后展示）
// ============================================
export async function getDailyEncouragement(
  habitId: string,
  streak: number
): Promise<ApiResponse<Encouragement>> {
  return getSmartEncouragement({
    habit_id: habitId,
    streak,
    context: 'daily'
  })
}

// ============================================
// 获取里程碑鼓励语（特殊天数：3、7、21、30、100等）
// ============================================
export async function getMilestoneEncouragement(
  habitId: string,
  day: number
): Promise<ApiResponse<Encouragement>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 查找特定天数的里程碑鼓励
    const { data, error } = await supabase
      .from('encouragements')
      .select('*')
      .eq('is_active', true)
      .eq('context', 'milestone')
      .eq('trigger_day', day)
      .order('weight', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      // 如果没有特定的，使用streak鼓励
      return getSmartEncouragement({
        habit_id: habitId,
        streak: day,
        context: 'streak'
      })
    }
    
    await recordEncouragementShown(data.id, habitId)
    
    return {
      success: true,
      data
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 获取 Report 页面专用的鼓励语（温暖唯美风格）
// ============================================
export async function getReportEncouragement(
  streak?: number
): Promise<ApiResponse<Encouragement>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 优先选择 milestone 和 streak 类型的鼓励语
    const contexts = streak && streak >= 7 ? ['milestone', 'streak', 'daily'] : ['daily', 'streak']
    
    // 获取用户最近看过的鼓励语（避免重复）
    const { data: history } = await supabase
      .from('user_encouragement_history')
      .select('encouragement_id')
      .eq('user_id', user.id)
      .gte('shown_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('shown_at', { ascending: false })
      .limit(20)
    
    const recentIds = history?.map(h => h.encouragement_id) || []
    
    // 构建查询 - 选择温暖治愈风格的鼓励语
    let query = supabase
      .from('encouragements')
      .select('*')
      .eq('is_active', true)
      .is('category', null) // 只要通用鼓励语
      .in('context', contexts)
      .in('emotion', ['gentle', 'motivational', 'celebratory']) // 温暖风格
    
    // 排除最近看过的
    if (recentIds.length > 0) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`)
    }
    
    const { data, error } = await query.order('weight', { ascending: false }).limit(10)
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      // 降级：返回任意温暖鼓励语
      const { data: fallback } = await supabase
        .from('encouragements')
        .select('*')
        .eq('is_active', true)
        .is('category', null)
        .in('emotion', ['gentle', 'motivational'])
        .order('weight', { ascending: false })
        .limit(1)
        .single()
      
      if (fallback) {
        await recordEncouragementShown(fallback.id)
        return { success: true, data: fallback }
      }
      
      throw new Error('没有可用的鼓励语')
    }
    
    // 根据权重随机选择
    const totalWeight = data.reduce((sum, e) => sum + e.weight, 0)
    let random = Math.random() * totalWeight
    
    let selected = data[0]
    for (const encouragement of data) {
      random -= encouragement.weight
      if (random <= 0) {
        selected = encouragement
        break
      }
    }
    
    // 记录显示历史
    await recordEncouragementShown(selected.id)
    
    return {
      success: true,
      data: selected
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 获取所有鼓励语（管理用）
// ============================================
export async function getAllEncouragements(
  category?: string,
  context?: string
): Promise<ApiResponse<Encouragement[]>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from('encouragements')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('context', { ascending: true })
      .order('weight', { ascending: false })
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (context) {
      query = query.eq('context', context)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
