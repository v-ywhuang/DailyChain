'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 🚀 激进缓存策略 - 针对中国网络慢的问题
        staleTime: 15 * 60 * 1000,  // 15分钟内数据保持新鲜
        gcTime: 30 * 60 * 1000,  // 30分钟后清理缓存
        
        // 网络优化
        refetchOnWindowFocus: false,  // 移动端不需要
        refetchOnReconnect: true,  // 重连时刷新
        retry: 2,  // 失败重试2次
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
        
        // 保持旧数据（防止加载闪烁）
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
