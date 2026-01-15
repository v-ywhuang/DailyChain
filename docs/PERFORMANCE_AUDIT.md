# 性能优化深度审计报告

## 📊 审计时间
2026年1月15日

## 🔍 三大核心问题分析

---

## 问题1: 颜色配置冲突分析

### ❌ 现状问题
1. **globals.css** 定义了 CSS 变量（shadcn/ui 风格）
   - 使用 HSL 格式：`--primary: 222.2 47.4% 11.2%`
   - 定义了 light/dark 主题
   - **但项目中完全没有使用这些变量**

2. **tailwind.config.ts** 定义了 Tailwind 颜色
   - 使用 HEX 格式：`primary: '#3B82F6'`
   - 定义了完整的语义化颜色系统
   - **这才是项目实际使用的颜色**

### ⚠️ 冲突评估
- **技术冲突**: 无直接冲突（两者不会互相覆盖）
- **维护冲突**: 严重！两套颜色系统会导致混淆
- **包体积**: globals.css 中的 CSS 变量占用约 2KB

### ✅ 解决方案
**删除 globals.css 中未使用的 CSS 变量，只保留 Tailwind 指令**

---

## 问题2: PWA 缓存策略审计

### ❌ 严重问题清单

#### 2.1 Service Worker 策略缺陷
```javascript
// 当前策略：Network First（网络优先）
fetch(event.request)
  .then(response => { /* 缓存 */ })
  .catch(() => { /* 回退到缓存 */ })
```

**问题**:
1. ❌ **没有区分静态资源和动态数据**
   - 静态资源（JS/CSS/图片）应该 Cache First
   - API 数据应该 Network First
   - 当前全部 Network First，浪费流量

2. ❌ **缓存版本号过于简单**
   - `CACHE_NAME = 'dailychain-v1'` 
   - 没有自动化版本更新机制
   - 部署新版本后用户可能看到旧内容

3. ❌ **没有缓存大小限制**
   - 无限制缓存会占用用户存储空间
   - 没有 LRU（最近最少使用）清理策略

4. ❌ **没有缓存预加载**
   - install 事件中 `self.skipWaiting()` 后什么都不做
   - 关键资源应该预缓存（App Shell Pattern）

#### 2.2 Next.js 缓存配置缺失
```typescript
// next.config.ts - 当前配置
const nextConfig: NextConfig = {
  // ❌ 没有配置静态资源缓存头
  // ❌ 没有配置 SWC 编译缓存
  // ❌ 没有配置增量静态生成
}
```

#### 2.3 API 数据缓存缺失
```typescript
// src/lib/api/habits.ts - 当前代码
export async function getUserHabits() {
  const { data } = await supabase.from('user_habits').select('*')
  // ❌ 没有任何缓存策略
  // ❌ 每次都是全量请求
  // ❌ 没有乐观更新
}
```

### ✅ 完整解决方案

#### 方案 A: Service Worker 优化（必须）
```javascript
// 1. 区分缓存策略
const STATIC_CACHE = 'dailychain-static-v1.0.0'  // 静态资源
const DYNAMIC_CACHE = 'dailychain-dynamic-v1.0.0'  // 动态数据
const API_CACHE = 'dailychain-api-v1.0.0'  // API 响应

// 2. 预缓存关键资源（App Shell）
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/check-in',
  '/_next/static/css/...',  // 自动生成
  '/_next/static/chunks/...',  // 自动生成
]

// 3. 按资源类型分类缓存
- 静态资源: Cache First (永久缓存)
- HTML: Network First (始终获取最新)
- API: Stale While Revalidate (先返回缓存，后台更新)
- 图片: Cache First + 过期清理
```

#### 方案 B: React Query 数据缓存（推荐）
```typescript
// 安装 @tanstack/react-query（已安装，但未使用）
// 配置全局缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5分钟内不重新请求
      cacheTime: 30 * 60 * 1000,  // 缓存30分钟
      refetchOnWindowFocus: false,  // 移动端不需要
      retry: 1,  // 失败重试1次
    }
  }
})
```

#### 方案 C: Next.js 优化配置
```typescript
// next.config.ts
const nextConfig = {
  // 1. 静态资源缓存头
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ]
      }
    ]
  },
  
  // 2. 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],  // 现代格式
    deviceSizes: [640, 750, 828, 1080, 1200],  // 移动端优先
  },
  
  // 3. 编译优化
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

---

## 问题3: H5 性能标准评估

### 📊 当前性能评分（预估）

| 指标 | 当前 | 标准 | 状态 |
|------|------|------|------|
| FCP（首次内容绘制） | ~2.5s | <1.8s | ⚠️ 需优化 |
| LCP（最大内容绘制） | ~3.5s | <2.5s | ⚠️ 需优化 |
| FID（首次输入延迟） | ~200ms | <100ms | ⚠️ 需优化 |
| CLS（累积布局偏移） | ~0.15 | <0.1 | ⚠️ 需优化 |
| TTI（可交互时间） | ~4s | <3.8s | ⚠️ 需优化 |

### ❌ 关键性能瓶颈

#### 3.1 缺少 React 性能优化
```typescript
// ❌ 当前问题
- 没有使用 React.memo
- 没有使用 useMemo/useCallback
- Framer Motion 动画没有优化
- 列表没有虚拟化（habits 列表可能很长）
```

#### 3.2 缺少代码分割
```typescript
// ❌ 当前问题
- 没有使用 dynamic import
- 所有页面一次性加载
- Framer Motion 库（~60KB）没有按需加载
- html2canvas（~200KB）在首页就加载
```

#### 3.3 缺少资源优化
```typescript
// ❌ 当前问题
- 没有使用 next/image 的 priority 属性
- 没有使用 loading="lazy"
- 没有配置图片 AVIF/WebP 格式
- 没有字体优化（Plus Jakarta Sans 加载策略）
```

#### 3.4 GPU 加速不完整
```typescript
// ✅ 已完成（刚才添加）
- 添加了 .gpu class
- 在关键动画元素上应用

// ❌ 还需要
- 验证是否真正触发硬件加速
- 检查是否有 paint/layout thrashing
- 优化 Framer Motion 动画配置
```

### ✅ 达到行业标准的完整方案

#### 方案 1: React 性能优化（必须）
```typescript
// 1. 使用 React.memo 包装组件
export const HabitCard = React.memo(({ habit }) => { ... })

// 2. 使用 useMemo 缓存计算
const sortedHabits = useMemo(() => 
  habits.sort((a, b) => a.sort_order - b.sort_order),
  [habits]
)

// 3. 使用 useCallback 缓存函数
const handleCheckIn = useCallback(() => { ... }, [habitId])

// 4. 虚拟滚动（如果习惯数量 > 20）
import { useVirtualizer } from '@tanstack/react-virtual'
```

#### 方案 2: 代码分割（必须）
```typescript
// 1. 动态导入重量级组件
const ReportContent = dynamic(() => import('./report-content'), {
  loading: () => <Skeleton />,
  ssr: false  // 报告页面不需要 SSR
})

// 2. 动态导入第三方库
const html2canvas = await import('html2canvas')

// 3. 路由级代码分割（Next.js 默认，确保没有禁用）
```

#### 方案 3: 资源优化（必须）
```typescript
// 1. 图片优化
<Image 
  src={avatarUrl}
  priority  // 关键图片
  loading="lazy"  // 非关键图片
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// 2. 字体优化
import { Plus_Jakarta_Sans } from 'next/font/google'
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',  // 防止 FOIT
  preload: true,
})

// 3. CSS 优化
- 删除未使用的 Tailwind classes（PurgeCSS）
- 内联关键 CSS
```

#### 方案 4: 运行时优化（必须）
```typescript
// 1. Framer Motion 优化
<motion.div
  initial={false}  // 禁用初始动画（移动端）
  animate={{ y: 0 }}
  transition={{ 
    type: 'tween',  // 使用 tween 而不是 spring（更高效）
    duration: 0.2 
  }}
  style={{ willChange: 'transform' }}  // 提示浏览器
/>

// 2. 防抖/节流
import { useDebouncedCallback } from 'use-debounce'
const debouncedSearch = useDebouncedCallback(handleSearch, 300)

// 3. Intersection Observer（懒加载）
const { ref, inView } = useInView({
  triggerOnce: true,
  threshold: 0.1,
})
```

---

## 🎯 优先级实施计划

### P0 - 立即修复（影响用户体验）
1. ✅ **删除 globals.css 中未使用的 CSS 变量**
2. ✅ **优化 Service Worker 缓存策略**
3. ✅ **配置 React Query 数据缓存**
4. ✅ **添加代码分割（动态导入）**

### P1 - 本周完成（性能提升）
5. ✅ **添加 React.memo/useMemo/useCallback**
6. ✅ **优化 Framer Motion 配置**
7. ✅ **配置 Next.js 缓存头**
8. ✅ **图片优化（priority/lazy/formats）**

### P2 - 持续优化（边际提升）
9. ⏰ **添加虚拟滚动（当习惯数 > 20）**
10. ⏰ **PWA 离线页面**
11. ⏰ **性能监控（Web Vitals）**
12. ⏰ **自动化性能测试**

---

## 📈 预期性能提升

实施完整方案后的预期指标：

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 首屏加载 | ~2.5s | ~1.2s | **52% ⬇️** |
| 包体积 | ~800KB | ~450KB | **44% ⬇️** |
| FCP | ~2.5s | ~1.5s | **40% ⬇️** |
| TTI | ~4s | ~2.8s | **30% ⬇️** |
| Lighthouse Score | ~65 | ~90+ | **38% ⬆️** |

---

## 🚀 立即开始

建议按顺序执行以下文件：
1. `performance-optimization-p0.md` - 立即修复
2. `performance-optimization-p1.md` - 本周完成
3. `performance-optimization-p2.md` - 持续优化

每个文件包含详细的代码示例和实施步骤。
