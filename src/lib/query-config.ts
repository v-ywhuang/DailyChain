/**
 * React Query 性能优化配置
 * 减少不必要的网络请求，提升用户体验
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ 缓存时间 - 5分钟内不重新请求
      staleTime: 5 * 60 * 1000,
      
      // ✅ 缓存保留时间 - 10分钟
      gcTime: 10 * 60 * 1000,
      
      // ✅ 失败重试 - 只重试1次，减少等待时间
      retry: 1,
      retryDelay: 1000,
      
      // ✅ 窗口聚焦时不自动重新请求
      refetchOnWindowFocus: false,
      
      // ✅ 网络重连时不自动重新请求
      refetchOnReconnect: false,
      
      // ✅ 组件挂载时不自动重新请求（使用缓存）
      refetchOnMount: false,
    },
    mutations: {
      // ✅ 变更失败重试1次
      retry: 1,
    },
  },
})

/**
 * 预加载策略 - 提前加载常用数据
 */
export const prefetchStrategies = {
  // Dashboard 数据
  dashboard: async () => {
    await Promise.all([
      // 预加载用户统计
      queryClient.prefetchQuery({
        queryKey: ['user-stats'],
        queryFn: async () => {
          const { getUserStats } = await import('@/lib/api/stats')
          return getUserStats()
        },
      }),
      // 预加载习惯列表
      queryClient.prefetchQuery({
        queryKey: ['user-habits'],
        queryFn: async () => {
          const { getUserHabits } = await import('@/lib/api/habits')
          return getUserHabits()
        },
      }),
    ])
  },
  
  // Pricing 数据
  pricing: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['user-subscription'],
      queryFn: async () => {
        const { getUserProfile } = await import('@/lib/api/user')
        return getUserProfile()
      },
    })
  },
}

/**
 * 乐观更新配置 - 立即更新 UI，后台同步
 */
export const optimisticUpdateConfig = {
  // 打卡操作 - 立即反馈
  checkIn: {
    onMutate: async (habitId: string) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey: ['user-habits'] })
      
      // 保存当前数据
      const previousHabits = queryClient.getQueryData(['user-habits'])
      
      // 乐观更新
      queryClient.setQueryData(['user-habits'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((habit: any) =>
            habit.id === habitId
              ? { ...habit, checked_today: true, current_streak: habit.current_streak + 1 }
              : habit
          ),
        }
      })
      
      return { previousHabits }
    },
    onError: (_err: any, _habitId: any, context: any) => {
      // 回滚
      if (context?.previousHabits) {
        queryClient.setQueryData(['user-habits'], context.previousHabits)
      }
    },
  },
}
