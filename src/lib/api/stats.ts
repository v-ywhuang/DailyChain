// 用户统计和数据分析API
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserStats, HabitStats, ApiResponse } from '@/lib/types/database.types'

// ============================================
// 获取用户总体统计
// ============================================
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取用户资料
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    // 获取活跃习惯数
    const { count: activeHabits } = await supabase
      .from('user_habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    // 获取成就数
    const { count: achievementsCount } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    // 计算总天数（从第一个习惯创建开始）
    const { data: firstHabit } = await supabase
      .from('user_habits')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    
    const totalDays = firstHabit
      ? Math.floor((Date.now() - new Date(firstHabit.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    return {
      success: true,
      data: {
        total_check_ins: profile?.total_check_ins || 0,
        active_habits: activeHabits || 0,
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0,
        achievements_count: achievementsCount || 0,
        total_days: totalDays
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 获取单个习惯的统计数据
// ============================================
export async function getHabitStats(habitId: string): Promise<ApiResponse<HabitStats>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取习惯基础数据
    const { data: habit } = await supabase
      .from('user_habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single()
    
    if (!habit) {
      throw new Error('习惯不存在')
    }
    
    // 获取打卡记录
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('habit_id', habitId)
      .order('check_in_date', { ascending: true })
    
    // 计算本周打卡数
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // 周一
    weekStart.setHours(0, 0, 0, 0)
    
    const weeklyCheckIns = Array(7).fill(0)
    checkIns?.forEach((checkIn) => {
      const date = new Date(checkIn.check_in_date)
      if (date >= weekStart) {
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyCheckIns[dayIndex]++
        }
      }
    })
    
    // 计算完成率
    const completionRate = habit.target_days && habit.target_days > 0
      ? Math.round((habit.total_check_ins / habit.target_days) * 100)
      : 0
    
    return {
      success: true,
      data: {
        total_habits: 1,
        active_habits: habit.is_active ? 1 : 0,
        total_check_ins: habit.total_check_ins,
        current_streak: habit.current_streak,
        longest_streak: habit.longest_streak,
        completion_rate: completionRate,
        weekly_check_ins: weeklyCheckIns
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 获取用户所有习惯的汇总统计
// ============================================
export async function getAllHabitsStats(): Promise<ApiResponse<HabitStats>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取所有习惯
    const { data: habits } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user.id)
    
    if (!habits || habits.length === 0) {
      return {
        success: true,
        data: {
          total_habits: 0,
          active_habits: 0,
          total_check_ins: 0,
          current_streak: 0,
          longest_streak: 0,
          completion_rate: 0,
          weekly_check_ins: [0, 0, 0, 0, 0, 0, 0]
        }
      }
    }
    
    // 统计活跃习惯
    const activeHabits = habits.filter(h => h.is_active).length
    
    // 统计总打卡数
    const totalCheckIns = habits.reduce((sum, h) => sum + h.total_check_ins, 0)
    
    // 找最长连续天数
    const longestStreak = Math.max(...habits.map(h => h.longest_streak))
    
    // 当前连续天数（取平均值）
    const currentStreak = activeHabits > 0
      ? Math.round(habits.filter(h => h.is_active).reduce((sum, h) => sum + h.current_streak, 0) / activeHabits)
      : 0
    
    // 计算总完成率
    const totalTarget = habits.reduce((sum, h) => sum + (h.target_days || 0), 0)
    const completionRate = totalTarget > 0
      ? Math.round((totalCheckIns / totalTarget) * 100)
      : 0
    
    // 获取本周打卡统计
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    
    const { data: weeklyData } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .gte('check_in_date', weekStart.toISOString().split('T')[0])
    
    const weeklyCheckIns = Array(7).fill(0)
    weeklyData?.forEach((checkIn) => {
      const date = new Date(checkIn.check_in_date)
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyCheckIns[dayIndex]++
      }
    })
    
    return {
      success: true,
      data: {
        total_habits: habits.length,
        active_habits: activeHabits,
        total_check_ins: totalCheckIns,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        completion_rate: completionRate,
        weekly_check_ins: weeklyCheckIns
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 获取打卡日历热力图数据
// ============================================
export async function getCheckInHeatmap(
  year: number,
  month?: number
): Promise<ApiResponse<Record<string, number>>> {
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
    
    // 获取打卡数据
    const { data } = await supabase
      .from('check_ins')
      .select('check_in_date, habit_id')
      .eq('user_id', user.id)
      .gte('check_in_date', startDate)
      .lte('check_in_date', endDate)
    
    // 统计每天的打卡数（一天可能有多个习惯打卡）
    const heatmap: Record<string, number> = {}
    data?.forEach((record) => {
      heatmap[record.check_in_date] = (heatmap[record.check_in_date] || 0) + 1
    })
    
    return {
      success: true,
      data: heatmap
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// ============================================
// 获取习惯趋势数据（用于图表）
// ============================================
export async function getHabitTrend(
  habitId: string,
  days = 30
): Promise<ApiResponse<Array<{ date: string; value: number }>>> {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取最近N天的打卡记录
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data } = await supabase
      .from('check_ins')
      .select('check_in_date, weight, pages, duration')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .gte('check_in_date', startDate.toISOString().split('T')[0])
      .order('check_in_date', { ascending: true })
    
    if (!data || data.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    // 转换为趋势数据（以weight为例，可以根据习惯类型调整）
    const trend = data.map((record) => ({
      date: record.check_in_date,
      value: record.weight || record.pages || record.duration || 1
    }))
    
    return {
      success: true,
      data: trend
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}
