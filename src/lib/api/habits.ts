// 习惯相关API
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  HabitCategory,
  HabitOption,
  UserHabit,
  UserHabitWithDetails,
  CreateHabitRequest,
  ApiResponse,
  HabitCategoryWithOptions,
} from '@/lib/types/database.types';

// ============================================
// 获取所有习惯类别
// ============================================
export async function getHabitCategories(): Promise<
  ApiResponse<HabitCategory[]>
> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('habit_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 获取类别及其选项池
// ============================================
export async function getCategoriesWithOptions(): Promise<
  ApiResponse<HabitCategoryWithOptions[]>
> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('habit_categories')
      .select(
        `
        *,
        options:habit_options(*)
      `,
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 获取指定类别的选项池
// ============================================
export async function getHabitOptions(
  categoryId: string,
): Promise<ApiResponse<HabitOption[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('habit_options')
      .select('*')
      .eq('category_id', categoryId)
      .order('is_popular', { ascending: false })
      .order('difficulty', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 获取热门选项
// ============================================
export async function getPopularOptions(
  categoryId?: string,
): Promise<ApiResponse<HabitOption[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('habit_options')
      .select('*')
      .eq('is_popular', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query
      .order('usage_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 创建用户习惯
// ============================================
export async function createUserHabit(
  request: CreateHabitRequest,
): Promise<ApiResponse<UserHabit>> {
  try {
    const supabase = await createServerSupabaseClient();

    // 获取当前用户
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    // 检查用户计划限制
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, max_active_habits')
      .eq('id', user.id)
      .single();

    // 检查当前活跃习惯数量
    const { count } = await supabase
      .from('user_habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (profile && count !== null && count >= profile.max_active_habits) {
      return {
        success: false,
        error:
          profile.plan === 'free'
            ? 'NEED_UPGRADE'
            : '已达到习惯上限',
      };
    }

    // 创建习惯
    const { data: habit, error: habitError } = await supabase
      .from('user_habits')
      .insert({
        user_id: user.id,
        category_id: request.category_id,
        name: request.name,
        description: request.description,
        target_value: request.target_value,
        target_unit: request.target_unit,
        target_days: request.target_days,
      })
      .select()
      .single();

    if (habitError) throw habitError;

    // 关联选项
    if (request.option_ids.length > 0) {
      const habitOptions = request.option_ids.map((optionId, index) => ({
        habit_id: habit.id,
        option_id: optionId,
        sort_order: index,
      }));

      const { error: optionsError } = await supabase
        .from('user_habit_options')
        .insert(habitOptions);

      if (optionsError) throw optionsError;
    }

    return {
      success: true,
      data: habit,
      message: '习惯创建成功！',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 获取用户的所有习惯
// ============================================
export async function getUserHabits(
  includeInactive = false,
): Promise<ApiResponse<UserHabitWithDetails[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    // 获取当前用户
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    // 构建查询
    let query = supabase
      .from('user_habits')
      .select(
        `
        *,
        category:habit_categories(*),
        options:user_habit_options(
          *,
          option:habit_options(*)
        )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 检查今天是否已打卡
    const habitsWithDetails = await Promise.all(
      (data || []).map(async (habit) => {
        const { data: checkIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('habit_id', habit.id)
          .eq('check_in_date', new Date().toISOString().split('T')[0])
          .single();

        const progress_percentage =
          habit.target_days && habit.target_days > 0
            ? Math.round((habit.total_check_ins / habit.target_days) * 100)
            : 0;

        return {
          ...habit,
          checked_today: !!checkIn,
          progress_percentage,
        };
      }),
    );

    return {
      success: true,
      data: habitsWithDetails,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 获取单个习惯详情
// ============================================
export async function getHabitById(
  habitId: string,
): Promise<ApiResponse<UserHabitWithDetails>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    const { data, error } = await supabase
      .from('user_habits')
      .select(
        `
        *,
        category:habit_categories(*),
        habit_options:user_habit_options(
          *,
          option:habit_options(*)
        )
      `,
      )
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    // 检查今天是否已打卡
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('habit_id', habitId)
      .eq('check_in_date', new Date().toISOString().split('T')[0])
      .single();

    const progress_percentage =
      data.target_days && data.target_days > 0
        ? Math.round((data.total_check_ins / data.target_days) * 100)
        : 0;

    return {
      success: true,
      data: {
        ...data,
        checked_today: !!checkIn,
        progress_percentage,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 更新习惯
// ============================================
export async function updateUserHabit(
  habitId: string,
  updates: Partial<UserHabit>,
): Promise<ApiResponse<UserHabit>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    const { data, error } = await supabase
      .from('user_habits')
      .update(updates)
      .eq('id', habitId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: '习惯更新成功',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 删除习惯（软删除：设置为不活跃）
// ============================================
export async function deleteUserHabit(
  habitId: string,
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    const { error } = await supabase
      .from('user_habits')
      .update({ is_active: false })
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      success: true,
      message: '习惯已删除',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
