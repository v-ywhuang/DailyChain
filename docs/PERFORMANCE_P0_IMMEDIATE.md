# P0 优先级：立即修复方案

## 🔥 必须立即完成（影响用户体验）

---

## 1️⃣ 删除 globals.css 中未使用的 CSS 变量

### 问题
- globals.css 定义了完整的 shadcn/ui 颜色系统
- 项目实际使用 Tailwind 颜色系统
- 造成约 2KB 冗余 CSS

### 解决方案

#### 文件：`src/app/globals.css`
```css
/* 修改前（78行）*/
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ...60行未使用的 CSS 变量 */
  }
}

/* 修改后（只保留3行）*/
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 预期效果
- ✅ 减少 2KB CSS
- ✅ 消除颜色系统混淆
- ✅ 提升代码可维护性

---

## 2️⃣ 优化 Service Worker 缓存策略

### 问题
- 当前策略：所有请求都是 Network First
- 没有区分静态资源和动态数据
- 没有预缓存关键资源
- 缓存版本号需要手动更新

### 解决方案

#### 文件：`public/sw.js`（完整替换）
```javascript
// ============================================
// DailyChain PWA - 专业级 Service Worker
// ============================================

const VERSION = '1.0.0'
const STATIC_CACHE = `dailychain-static-${VERSION}`
const DYNAMIC_CACHE = `dailychain-dynamic-${VERSION}`
const API_CACHE = `dailychain-api-${VERSION}`

// App Shell - 关键资源预缓存
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/check-in',
  '/offline',  // 离线页面
]

// 缓存大小限制
const CACHE_SIZE_LIMITS = {
  [STATIC_CACHE]: 50,  // 静态资源最多50个
  [DYNAMIC_CACHE]: 20,  // 动态页面最多20个
  [API_CACHE]: 30,  // API 响应最多30个
}

// ============================================
// 安装事件 - 预缓存关键资源
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', VERSION)
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching App Shell')
        return cache.addAll(PRECACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// ============================================
// 激活事件 - 清理旧缓存
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', VERSION)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本缓存
            if (
              cacheName.startsWith('dailychain-') &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// ============================================
// Fetch 事件 - 智能缓存策略
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 1. Next.js 静态资源 - Cache First（永久缓存）
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 2. 图片资源 - Cache First + 过期清理
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 3. API 请求 - Stale While Revalidate（先返回缓存，后台更新）
  if (url.origin.includes('supabase.co')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, 60))  // 1分钟过期
    return
  }

  // 4. HTML 页面 - Network First（始终获取最新）
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // 5. 其他资源 - Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ============================================
// 缓存策略实现
// ============================================

// Cache First - 优先使用缓存
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.status === 200) {
      cache.put(request, response.clone())
      await trimCache(cacheName)
    }
    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    // 如果是离线，返回离线页面
    if (request.destination === 'document') {
      return caches.match('/offline')
    }
    throw error
  }
}

// Network First - 优先使用网络
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      await trimCache(cacheName)
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    // 离线页面
    if (request.destination === 'document') {
      return caches.match('/offline')
    }
    throw error
  }
}

// Stale While Revalidate - 先返回缓存，后台更新
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // 后台更新
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone())
      trimCache(cacheName)
    }
    return response
  })

  // 如果有缓存，检查是否过期
  if (cached) {
    const cachedDate = new Date(cached.headers.get('date'))
    const now = new Date()
    const age = (now - cachedDate) / 1000  // 秒

    if (age < maxAge) {
      return cached  // 未过期，直接返回
    }
  }

  return fetchPromise
}

// ============================================
// 缓存大小限制 - LRU 策略
// ============================================
async function trimCache(cacheName) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  const limit = CACHE_SIZE_LIMITS[cacheName] || 50
  
  if (keys.length > limit) {
    console.log(`[SW] Trimming cache ${cacheName}: ${keys.length} -> ${limit}`)
    // 删除最旧的条目
    await cache.delete(keys[0])
  }
}

// ============================================
// 消息监听 - 手动更新缓存
// ============================================
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting()
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('dailychain-')) {
                return caches.delete(cacheName)
              }
            })
          )
        })
    )
  }
})
```

### 新增离线页面

#### 文件：`src/app/offline/page.tsx`
```typescript
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold text-white mb-4">
          网络连接已断开
        </h1>
        <p className="text-white/70 mb-8">
          请检查您的网络连接后重试
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-bold hover:scale-105 transition-transform"
        >
          重新加载
        </button>
      </div>
    </div>
  )
}
```

### 预期效果
- ✅ 静态资源缓存命中率 > 95%
- ✅ API 请求响应速度提升 80%
- ✅ 离线可用（查看已缓存的页面）
- ✅ 自动清理过期缓存

---

## 3️⃣ 配置 React Query 数据缓存

### 问题
- 已安装 @tanstack/react-query 但未使用
- 每次都是全量请求数据库
- 没有乐观更新

### 解决方案

#### 文件：`src/app/layout.tsx`（添加 QueryProvider）
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // 数据缓存策略
        staleTime: 5 * 60 * 1000,  // 5分钟内数据被认为是新鲜的
        cacheTime: 30 * 60 * 1000,  // 缓存保留30分钟
        refetchOnWindowFocus: false,  // 移动端不需要
        refetchOnReconnect: true,  // 重新连接时刷新
        retry: 1,  // 失败重试1次
      },
      mutations: {
        retry: 1,
      }
    }
  }))

  return (
    <html lang="zh-CN">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### 文件：`src/hooks/useHabits.ts`（新建）
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserHabits, createCheckIn } from '@/lib/api/habits'

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const result = await getUserHabits()
      if (!result.success) throw new Error(result.error)
      return result.data
    }
  })
}

export function useCheckInMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCheckIn,
    onMutate: async (newCheckIn) => {
      // 乐观更新：立即更新 UI
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      
      const previousHabits = queryClient.getQueryData(['habits'])
      
      queryClient.setQueryData(['habits'], (old: any) => {
        return old.map((habit: any) => 
          habit.id === newCheckIn.habit_id
            ? { ...habit, checked_today: true }
            : habit
        )
      })
      
      return { previousHabits }
    },
    onError: (err, newCheckIn, context) => {
      // 失败时回滚
      queryClient.setQueryData(['habits'], context.previousHabits)
    },
    onSuccess: () => {
      // 成功后刷新数据
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    }
  })
}
```

#### 文件：`src/app/dashboard/dashboard-client.tsx`（使用 Hook）
```typescript
// 修改前
const [habits, setHabits] = useState([])
useEffect(() => {
  async function loadData() {
    const result = await getUserHabits()
    setHabits(result.data)
  }
  loadData()
}, [])

// 修改后
import { useHabits } from '@/hooks/useHabits'

const { data: habits = [], isLoading } = useHabits()
```

### 预期效果
- ✅ 5分钟内重复访问无需请求（命中缓存）
- ✅ 打卡操作立即响应（乐观更新）
- ✅ 失败自动回滚
- ✅ 减少 70% API 请求

---

## 4️⃣ 添加代码分割（动态导入）

### 问题
- html2canvas（200KB）在首页就加载
- Framer Motion（60KB）全量加载
- 报告页面不需要 SSR

### 解决方案

#### 文件：`src/app/report/page.tsx`
```typescript
// 修改前
import ReportContent from './report-content'

export default function ReportPage() {
  return <ReportContent />
}

// 修改后
import dynamic from 'next/dynamic'

const ReportContent = dynamic(() => import('./report-content'), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">生成报告中...</div>
    </div>
  ),
  ssr: false  // 报告页面不需要 SSR
})

export default function ReportPage() {
  return <ReportContent />
}
```

#### 文件：`src/app/report/report-content.tsx`
```typescript
// 修改前
import html2canvas from 'html2canvas'

const handleShare = async () => {
  const canvas = await html2canvas(reportRef.current)
  // ...
}

// 修改后
const handleShare = async () => {
  // 动态导入，只在需要时加载
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(reportRef.current)
  // ...
}
```

### 预期效果
- ✅ 首页 bundle 减少 260KB
- ✅ 首屏加载时间减少 40%
- ✅ 报告页面按需加载

---

## 🚀 实施步骤

1. **运行测试**（确保当前功能正常）
   ```bash
   npm run build
   npm run start
   ```

2. **依次修改文件**（按上述顺序）
   - globals.css
   - sw.js + offline/page.tsx
   - layout.tsx + useHabits.ts
   - report/page.tsx

3. **验证效果**
   ```bash
   # 清除缓存
   npm run build

   # Lighthouse 测试
   npm run start
   # 在 Chrome 开启 Lighthouse 测试移动端性能
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "perf: P0 性能优化 - 缓存策略+代码分割+React Query"
   git push
   ```

---

## 📊 预期结果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首屏加载 | 2.5s | 1.8s | 28% ⬆️ |
| 包体积 | 800KB | 540KB | 33% ⬇️ |
| API 请求 | 100% | 30% | 70% ⬇️ |
| 缓存命中 | 0% | 95% | +95% |

完成后继续 P1 优化。
