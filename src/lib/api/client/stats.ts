/**
 * 客户端 API - 统计数据
 * 直接在浏览器调用 Supabase，性能更快
 */

import { createClient } from '@/lib/supabase/client'
import type { HabitStats, ApiResponse } from '@/lib/types/database.types'

const supabase = createClient()

/**
 * 获取所有习惯的统计数据
 */
export async function getAllHabitsStats(): Promise<ApiResponse<HabitStats>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    // 获取总打卡数
    const { count: totalCheckIns } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    // 获取活跃习惯数
    const { count: activeHabits } = await supabase
      .from('user_habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    // 获取当前连续天数（今天和昨天）
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', yesterday)
      .order('date', { ascending: false })
    
    let currentStreak = 0
    if (recentCheckIns && recentCheckIns.length > 0) {
      // 简化的连续计算
      const dates = [...new Set(recentCheckIns.map(c => c.date))].sort().reverse()
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        if (dates[i] === expected) {
          currentStreak++
        } else {
          break
        }
      }
    }
    
    return {
      success: true,
      data: {
        total_habits: activeHabits || 0,
        active_habits: activeHabits || 0,
        total_check_ins: totalCheckIns || 0,
        current_streak: currentStreak,
        longest_streak: currentStreak, // 简化处理
        completion_rate: 0, // 简化处理
        weekly_check_ins: [] // 简化处理
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取统计数据失败'
    }
  }
}

/**
 * 获取打卡热力图数据
 */
export async function getCheckInHeatmap(year: number): Promise<ApiResponse<Record<string, number>>> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }
    
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    const { data, error } = await supabase
      .from('check_ins')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
    
    if (error) throw error
    
    // 统计每天的打卡次数
    const heatmap: Record<string, number> = {}
    data?.forEach(checkIn => {
      heatmap[checkIn.date] = (heatmap[checkIn.date] || 0) + 1
    })
    
    return {
      success: true,
      data: heatmap
    }
  } catch (error) {
    console.error('获取热力图数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取热力图数据失败'
    }
  }
}
