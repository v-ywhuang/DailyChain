// 数据库类型定义
export type HabitFrequency = 'daily' | 'weekly' | 'custom'
export type HabitType = 'diet' | 'exercise' | 'lifestyle' | 'mental' | 'learning'
export type UserPlan = 'free' | 'pro' | 'premium'
export type Mood = 'great' | 'good' | 'ok' | 'bad'
export type EmotionType = 'motivational' | 'celebratory' | 'gentle' | 'challenging' | 'humorous'
export type EncouragementContext = 'daily' | 'milestone' | 'streak' | 'completion' | 'encouragement'

// 习惯类别
export interface HabitCategory {
  id: string
  name: string
  name_en: string | null
  icon: string
  color: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// 习惯选项
export interface HabitOption {
  id: string
  category_id: string
  name: string
  name_en: string | null
  type: HabitType
  frequency: HabitFrequency
  frequency_count: number
  encouragement: string
  tips: string | null
  difficulty: number
  calories_burn: number | null
  estimated_time: number | null
  is_popular: boolean
  is_beginner_friendly: boolean
  usage_count: number
  success_rate: number
  created_at: string
  updated_at: string
}

// 用户资料
export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  plan: UserPlan
  max_active_habits: number
  makeup_count: number
  total_check_ins: number
  longest_streak: number
  current_streak: number
  created_at: string
  updated_at: string
  last_check_in_at: string | null
}

// 用户习惯
export interface UserHabit {
  id: string
  user_id: string
  category_id: string
  name: string
  description: string | null
  target_value: number | null
  target_unit: string | null
  target_days: number | null
  current_streak: number
  longest_streak: number
  total_check_ins: number
  last_check_in_date: string | null
  is_active: boolean
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

// 用户习惯选项关联
export interface UserHabitOption {
  id: string
  habit_id: string
  option_id: string
  is_enabled: boolean
  sort_order: number
  created_at: string
}

// 打卡记录
export interface CheckIn {
  id: string
  user_id: string
  habit_id: string
  check_in_date: string
  check_in_time: string
  completed_options: string[] // UUID数组
  weight: number | null
  pages: number | null
  books: number | null
  mood: Mood | null
  duration: number | null
  notes: string | null
  is_makeup: boolean
  makeup_reason: string | null
  created_at: string
}

// 鼓励语
export interface Encouragement {
  id: string
  content: string
  content_en: string | null
  category: string | null
  context: EncouragementContext
  min_streak: number | null
  max_streak: number | null
  trigger_day: number | null
  emotion: EmotionType | null
  is_active: boolean
  weight: number
  usage_count: number
  like_count: number
  created_at: string
  created_by: string | null
}

// 成就
export interface Achievement {
  id: string
  name: string
  description: string | null
  icon: string | null
  category: string | null
  unlock_condition: Record<string, any>
  is_active: boolean
  created_at: string
}

// 用户成就
export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  habit_id: string | null
  unlocked_at: string
}

// ============================================
// 扩展类型（包含关联数据）
// ============================================

export interface HabitCategoryWithOptions extends HabitCategory {
  options: HabitOption[]
}

export interface UserHabitWithDetails extends UserHabit {
  category: HabitCategory
  options: (UserHabitOption & { option: HabitOption })[]
  checked_today: boolean
  progress_percentage: number
}

export interface CheckInWithDetails extends CheckIn {
  habit: UserHabit
  completed_option_details: HabitOption[]
}

// ============================================
// API 请求/响应类型
// ============================================

// 创建习惯请求
export interface CreateHabitRequest {
  category_id: string
  name: string
  description?: string
  target_value?: number
  target_unit?: string
  target_days?: number
  option_ids: string[] // 用户选择的选项ID数组
}

// 打卡请求
export interface CreateCheckInRequest {
  habit_id: string
  check_in_date?: string // 默认今天
  completed_option_ids: string[] // 完成的选项ID
  weight?: number
  pages?: number
  books?: number
  mood?: Mood
  duration?: number
  notes?: string
  is_makeup?: boolean
  makeup_reason?: string
}

// 获取鼓励语请求
export interface GetEncouragementRequest {
  habit_id?: string
  category?: string
  streak?: number
  context?: EncouragementContext
}

// API 响应基础类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 统计数据类型
export interface HabitStats {
  total_habits: number
  active_habits: number
  total_check_ins: number
  current_streak: number
  longest_streak: number
  completion_rate: number
  weekly_check_ins: number[]
}

export interface UserStats {
  total_check_ins: number
  active_habits: number
  current_streak: number
  longest_streak: number
  achievements_count: number
  total_days: number
}
