// 打卡相关API
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkAndUnlockAchievements } from './user'
import type {
  CheckIn,
  CheckInWithDetails,
  CreateCheckInRequest,
  ApiResponse
} from '@/lib/types/database.types'

// ============================================
// 创建打卡记录
// ============================================
export async function createCheckIn(request: CreateCheckInRequest): Promise<ApiResponse<CheckIn>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 检查今天是否已打卡
    const checkInDate = request.check_in_date || new Date().toISOString().split('T')[0]
    
    const { data: existing } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', user.id)
      .eq('habit_id', request.habit_id)
      .eq('check_in_date', checkInDate)
      .single()
    
    if (existing) {
      return {
        success: false,
        error: '今天已经打卡过了',
        message: '每天只能打卡一次哦'
      }
    }
    
    // 创建打卡记录
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        habit_id: request.habit_id,
        check_in_date: checkInDate,
        completed_options: request.completed_option_ids,
        weight: request.weight,
        pages: request.pages,
        books: request.books,
        mood: request.mood,
        duration: request.duration,
        notes: request.notes,
        is_makeup: request.is_makeup || false,
        makeup_reason: request.makeup_reason
      })
      .select()
      .single()
    
    if (error) throw error
    
    // 等待触发器完成（确保 user_profiles 已更新）
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 🎉 检查并解锁成就
    await checkAndUnlockAchievements(request.habit_id)
    
    return {
      success: true,
      data,
      message: '打卡成功！坚持就是胜利 🎉'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 获取习惯的打卡历史
// ============================================
export async function getCheckInHistory(
  habitId: string,
  limit = 30
): Promise<ApiResponse<CheckIn[]>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .order('check_in_date', { ascending: false })
      .limit(limit)
    
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

// ============================================
// 获取指定日期范围的打卡记录
// ============================================
export async function getCheckInsByDateRange(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<CheckIn[]>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
      .order('check_in_date', { ascending: true })
    
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

// ============================================
// 获取本周打卡统计
// ============================================
export async function getWeeklyCheckIns(): Promise<ApiResponse<Record<string, number>>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 计算本周一和周日
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .gte('check_in_date', monday.toISOString().split('T')[0])
      .lte('check_in_date', sunday.toISOString().split('T')[0])
    
    if (error) throw error
    
    // 统计每天的打卡数
    const weeklyData: Record<string, number> = {}
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    days.forEach((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]
      weeklyData[day] = data?.filter(c => c.check_in_date === dateStr).length || 0
    })
    
    return {
      success: true,
      data: weeklyData
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 补卡（需要补卡次数）
// ============================================
export async function makeupCheckIn(request: CreateCheckInRequest): Promise<ApiResponse<CheckIn>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 检查补卡次数
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('makeup_count')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.makeup_count <= 0) {
      return {
        success: false,
        error: '补卡次数不足，升级Pro会员享每月3次补卡 → /pricing'
      }
    }
    
    // 创建补卡记录
    const result = await createCheckIn({
      ...request,
      is_makeup: true
    })
    
    if (result.success) {
      // 扣除补卡次数
      await supabase
        .from('user_profiles')
        .update({ makeup_count: profile.makeup_count - 1 })
        .eq('id', user.id)
    }
    
    return result
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 获取打卡日历数据（用于热力图）
// ============================================
export async function getCheckInCalendar(
  habitId: string,
  year: number,
  month?: number
): Promise<ApiResponse<Record<string, boolean>>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 构建日期范围
    const startDate = month 
      ? `${year}-${String(month).padStart(2, '0')}-01`
      : `${year}-01-01`
    
    const endDate = month
      ? new Date(year, month, 0).toISOString().split('T')[0]
      : `${year}-12-31`
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
    
    if (error) throw error
    
    // 转换为日历格式
    const calendar: Record<string, boolean> = {}
    data?.forEach(record => {
      calendar[record.check_in_date] = true
    })
    
    return {
      success: true,
      data: calendar
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================
// 删除打卡记录（仅限当天）
// ============================================
export async function deleteCheckIn(checkInId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取打卡记录
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('id', checkInId)
      .eq('user_id', user.id)
      .single()
    
    if (!checkIn) {
      return {
        success: false,
        error: '打卡记录不存在'
      }
    }
    
    // 只能删除当天的打卡
    const today = new Date().toISOString().split('T')[0]
    if (checkIn.check_in_date !== today) {
      return {
        success: false,
        error: '只能删除当天的打卡记录'
      }
    }
    
    const { error } = await supabase
      .from('check_ins')
      .delete()
      .eq('id', checkInId)
      .eq('user_id', user.id)
    
    if (error) throw error
    
    return {
      success: true,
      message: '打卡记录已删除'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
