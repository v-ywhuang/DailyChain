/**
 * 客户端 API - 习惯相关
 * 直接在浏览器调用 Supabase，性能更快
 */

import { createClient } from '@/lib/supabase/client';
import type {
  UserHabitWithDetails,
  ApiResponse,
} from '@/lib/types/database.types';

const supabase = createClient();

/**
 * 获取用户的所有习惯
 */
export async function getUserHabits(): Promise<
  ApiResponse<UserHabitWithDetails[]>
> {
  try {
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
        category:habit_categories(*)
      `,
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('获取习惯列表失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取习惯列表失败',
    };
  }
}

/**
 * 获取单个习惯详情
 */
export async function getHabitById(
  habitId: string,
): Promise<ApiResponse<UserHabitWithDetails>> {
  try {
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
        category:habit_categories(*)
      `,
      )
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('获取习惯详情失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取习惯详情失败',
    };
  }
}

/**
 * 创建新习惯
 */
export async function createHabit(
  templateId: string,
  customizations?: {
    target_value?: number;
    custom_name?: string;
    custom_description?: string;
  },
): Promise<ApiResponse<UserHabitWithDetails>> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    // 检查用户习惯数量限制
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('max_active_habits')
      .eq('id', user.id)
      .single();

    const { count } = await supabase
      .from('user_habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (count !== null && profile && count >= profile.max_active_habits) {
      return {
        success: false,
        error: 'NEED_UPGRADE',
      };
    }

    // 创建习惯
    const { data, error } = await supabase
      .from('user_habits')
      .insert({
        user_id: user.id,
        template_id: templateId,
        target_value: customizations?.target_value,
        custom_name: customizations?.custom_name,
        custom_description: customizations?.custom_description,
      })
      .select(
        `
        *,
        habit_template:habit_templates(*)
      `,
      )
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('创建习惯失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建习惯失败',
    };
  }
}

/**
 * 删除习惯
 */
export async function deleteHabit(habitId: string): Promise<ApiResponse<null>> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('未登录');
    }

    const { error } = await supabase
      .from('user_habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('删除习惯失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除习惯失败',
    };
  }
}
