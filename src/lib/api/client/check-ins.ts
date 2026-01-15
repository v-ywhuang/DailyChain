import { createClient } from '@/lib/supabase/client'
import type { ApiResponse, CheckIn } from '@/lib/types/database.types'

// ============================================
// 创建打卡记录
// ============================================
export async function createCheckIn(data: {
  habit_id: string
  date?: string
  note?: string
  mood?: string
  is_makeup?: boolean
}): Promise<ApiResponse<CheckIn>> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }

    const checkInDate = data.date || new Date().toISOString().split('T')[0]

    const { data: checkIn, error } = await supabase
      .from('check_ins')
      .insert({
        habit_id: data.habit_id,
        user_id: user.id,
        date: checkInDate,
        note: data.note,
        mood: data.mood,
        is_makeup: data.is_makeup || false,
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: checkIn,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// ============================================
// 获取习惯的打卡记录
// ============================================
export async function getHabitCheckIns(habitId: string): Promise<ApiResponse<CheckIn[]>> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('未登录')
    }

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
