# DailyChain - 习惯打卡工具 PRD v1.0

## 📋 项目信息

**项目名**: DailyChain (链习惯)  
**类型**: Web应用（响应式）  
**开发周期**: 2周  
**目标**: 500用户，50付费，¥750 MRR（3个月内）

---

## 1. 技术方案

### 1.1 技术栈

```
前端: Next.js 16 + React 19 + TypeScript
样式: Tailwind CSS v3
UI设计: ui-ux-pro-max-skill (nextlevelbuilder)
动画: Framer Motion
图表: Recharts
状态: Zustand

后端: Supabase (PostgreSQL)
认证: Supabase Auth (邮箱+密码)
存储: Supabase Storage (头像)
实时: Supabase Realtime

部署: Vercel (免费Hobby计划)
支付: Lemon Squeezy (支持支付宝/微信)
分析: Posthog (免费)
```

### 1.2 数据库设计

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free', -- 'free' | 'pro'
  subscription_end_at TIMESTAMPTZ,
  makeup_count INTEGER DEFAULT 0, -- 本月已用补卡次数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 习惯表
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#3b82f6',
  frequency TEXT DEFAULT 'daily', -- 'daily' | 'weekly'
  target_count INTEGER DEFAULT 1,
  description TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 打卡记录表
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  mood TEXT, -- '😊' | '😐' | '😔'
  is_makeup BOOLEAN DEFAULT FALSE, -- 是否补卡
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- 索引
CREATE INDEX idx_habits_user_id ON habits(user_id) WHERE is_archived = FALSE;
CREATE INDEX idx_check_ins_habit_date ON check_ins(habit_id, date DESC);
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date DESC);

-- RLS策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY users_policy ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY habits_policy ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY check_ins_policy ON check_ins FOR ALL USING (auth.uid() = user_id);
```

### 1.3 认证方案

**Supabase Auth**:
- 邮箱+密码注册
- 邮箱验证（可选）
- Magic Link（备用）
- Session持久化

```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: { data: { name: '张三' } }
})

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser()
```

### 1.4 支付方案

**Lemon Squeezy**:
- 支持个人开发者
- 支持支付宝/微信支付
- 手续费: 5% + $0.50
- 自动处理税务

**订阅计划**:
- Pro月付: ¥15/月
- Pro年付: ¥150/年（8折）

**Webhook处理**:
```typescript
// /api/webhooks/lemon-squeezy
export async function POST(req: Request) {
  const payload = await req.json()
  
  // 验证签名
  const isValid = verifySignature(payload)
  if (!isValid) return new Response('Invalid signature', { status: 401 })
  
  // 处理订阅事件
  switch (payload.meta.event_name) {
    case 'subscription_created':
      // 升级为Pro
      await updateUserPlan(payload.data.attributes.user_email, 'pro')
      break
    case 'subscription_expired':
      // 降级为Free
      await updateUserPlan(payload.data.attributes.user_email, 'free')
      break
  }
}
```

### 1.5 部署方案

**Vercel**:
- 连接GitHub仓库
- 自动CI/CD
- 环境变量配置:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `LEMON_SQUEEZY_API_KEY`
  - `LEMON_SQUEEZY_WEBHOOK_SECRET`

---

## 2. 核心功能需求

### 2.1 【P0】用户认证

#### 2.1.1 注册页面 `/auth/signup`

**页面元素**:
- Logo + "开始改变之旅"
- 邮箱输入框（必填，验证格式）
- 密码输入框（必填，≥8位，显示强度）
- 昵称输入框（必填，2-20字符）
- "创建账号"按钮（加载态）
- "已有账号？登录"链接

**交互流程**:
1. 用户填写信息
2. 前端验证格式
3. 调用`supabase.auth.signUp()`
4. 成功→跳转`/dashboard`
5. 失败→显示错误提示

**错误提示**:
- 邮箱已存在
- 密码过弱
- 网络错误

#### 2.1.2 登录页面 `/auth/login`

**页面元素**:
- Logo + "继续你的旅程"
- 邮箱输入框
- 密码输入框
- "记住我"复选框
- "登录"按钮
- "忘记密码？"链接
- "还没账号？注册"链接

**Magic Link**（可选）:
- "或使用邮箱链接登录"
- 输入邮箱→发送链接→点击登录

#### 2.1.3 个人设置 `/settings/profile`

**可修改信息**:
- 头像（上传到Supabase Storage）
- 昵称
- 邮箱（需验证）
- 密码（需输入旧密码）
- "退出登录"按钮

---

### 2.2 【P0】习惯管理

#### 2.2.1 习惯列表页 `/dashboard`

**布局**:
```
[顶部导航]
  - Logo: DailyChain
  - 用户头像（点击→设置/退出）
  - "升级Pro"按钮（Free用户）

[今日待打卡] (默认展开)
  - [习惯卡片1] 
  - [习惯卡片2]
  - [习惯卡片3]

[已完成] (可折叠)
  - [已打卡习惯1]
  - [已打卡习惯2]

[底部浮动按钮]
  - "+" 创建习惯
```

**习惯卡片**（待打卡状态）:
```
┌─────────────────────────────┐
│ 📚 每日阅读         连续 23天 │
│                              │
│ [━━━━━━━━━━] 今日目标: 30分钟│
│                              │
│ [立即打卡] 大按钮             │
└─────────────────────────────┘
```

**习惯卡片**（已完成状态）:
```
┌─────────────────────────────┐
│ ✅ 📚 每日阅读      连续 24天 │
│                              │
│ 今天 10:23 打卡               │
│ "读完《原则》第3章"           │
└─────────────────────────────┘
```

**长按/右滑操作**:
- 编辑
- 归档
- 删除（二次确认）

#### 2.2.2 创建习惯 `/habits/new`

**表单字段**:

1. **习惯名称**（必填）
   - Placeholder: "例如: 每日阅读30分钟"
   - 限制: 2-30字符
   - 实时字符计数

2. **图标选择器**（必填）
   ```
   [搜索框: "搜索emoji..."]
   
   [分类标签]
   运动🏃 学习📚 健康🧘 工作💼 生活🏡
   
   [图标网格] (50+ emoji)
   📚 📖 📝 ✍️ 🎨 🎵 ...
   ```

3. **颜色选择器**（必填）
   ```
   [12个预设颜色圆圈]
   🔵 蓝 #3b82f6   🟢 绿 #10b981
   🔴 红 #ef4444   🟡 黄 #f59e0b
   🟣 紫 #8b5cf6   🟠 橙 #f97316
   ...
   ```

4. **频率设置**（必填）
   - 单选: ⚪️ 每天（默认）
   - 单选: ⚪️ 每周X次（滑动选择1-7）

5. **描述**（可选）
   - Placeholder: "为什么要养成这个习惯？"
   - 0-200字符
   - 多行文本框

**底部按钮**:
- [取消] [创建习惯]

**验证规则**:
- Free用户: 最多3个习惯（达到限制时弹窗提示升级）
- Pro用户: 无限制

#### 2.2.3 编辑习惯 `/habits/[id]/edit`

**同创建页面**，额外功能:
- "归档习惯"按钮（保留数据，隐藏卡片）
- "删除习惯"按钮（二次确认，永久删除）

---

### 2.3 【P0】打卡功能（最核心）

#### 2.3.1 快速打卡

**流程**:
1. 用户点击"立即打卡"按钮
2. 按钮禁用（防重复点击）
3. 发送请求:
   ```typescript
   const { data, error } = await supabase
     .from('check_ins')
     .insert({
       habit_id: habitId,
       user_id: userId,
       date: new Date().toISOString().split('T')[0]
     })
   ```
4. 成功后:
   - 播放confetti动画（全屏彩色纸屑）
   - 显示Toast: "✅ 打卡成功！连续 24 天"
   - 更新卡片状态（移到"已完成"区域）
   - 更新连续天数
5. 失败处理:
   - 今日已打卡: "今天已经打卡过啦"
   - 网络错误: "打卡失败，请重试"

#### 2.3.2 补卡功能（Pro专属）

**触发场景**:
- 用户连续打卡N天
- 昨天忘记打卡
- 今天打开APP，连续天数归零

**弹窗设计**:
```
┌─────────────────────────────┐
│      😢 连续记录中断了         │
│                              │
│  你的【每日阅读】已经坚持了     │
│  23天，昨天忘记打卡了          │
│                              │
│  [免费用户]                   │
│  ❌ 连续天数已重置为0          │
│  💡 升级Pro可补卡恢复          │
│                              │
│  [升级Pro ¥15/月]             │
│  ✅ 每月3次补卡机会            │
│  ✅ 无限习惯数量               │
│  ✅ 完整数据导出               │
│                              │
│  [残忍拒绝] [立即升级]         │
└─────────────────────────────┘
```

**Pro用户补卡**:
```
┌─────────────────────────────┐
│      🔧 补卡恢复连续天数       │
│                              │
│  你的【每日阅读】昨天忘记打卡了 │
│                              │
│  本月补卡次数: 1/3 已使用      │
│                              │
│  [取消] [确认补卡]             │
└─────────────────────────────┘
```

**补卡逻辑**:
```typescript
// 检查补卡资格
const canMakeup = async (userId: string) => {
  const user = await getUser(userId)
  if (user.plan !== 'pro') return { success: false, reason: 'not_pro' }
  if (user.makeup_count >= 3) return { success: false, reason: 'limit_reached' }
  return { success: true }
}

// 执行补卡
const makeupCheckIn = async (habitId: string, userId: string) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  await supabase.from('check_ins').insert({
    habit_id: habitId,
    user_id: userId,
    date: yesterday.toISOString().split('T')[0],
    is_makeup: true
  })
  
  await supabase.from('users').update({
    makeup_count: user.makeup_count + 1
  }).eq('id', userId)
}
```

#### 2.3.3 打卡笔记（可选）

**快速打卡后弹窗**:
```
┌─────────────────────────────┐
│  ✅ 打卡成功！连续 24 天       │
│                              │
│  [添加笔记] (可选)             │
│  ┌──────────────────────┐   │
│  │ 今天读了《原则》第3章  │   │
│  │ 关于...              │   │
│  └──────────────────────┘   │
│                              │
│  今天心情如何？               │
│  😊 开心  😐 一般  😔 有点难  │
│                              │
│  [跳过] [保存]                │
└─────────────────────────────┘
```

---

### 2.4 【P0】数据可视化

#### 2.4.1 习惯详情页 `/habits/[id]`

**页面布局**:

```
[头部]
  📚 每日阅读
  "坚持就是胜利" (描述)
  创建于: 2026-01-01

[数据卡片]
┌─────────┬─────────┬─────────┬─────────┐
│ 当前连续 │ 最长记录 │ 总打卡数 │ 完成率  │
│ 🔥 24天 │ 🏆 45天 │ ✅ 234次│ 📊 87% │
└─────────┴─────────┴─────────┴─────────┘

[热力图] (类似GitHub Contributions)
  一  二  三  四  五  六  日
  ▢  ▢  ▢  ▢  ▢  ▢  ▢  (1月第1周)
  ▢  ▢  ▣  ▣  ▣  ▣  ▣  (1月第2周)
  ▣  ▣  ▣  ▣  ▣  ▣  ▣  (1月第3周)
  ▣  ▣  ▣  ▣  ▢  ▢  ▢  (1月第4周)
  
  颜色说明:
  ▢ 灰色 = 未完成
  ▣ 浅绿 = 完成
  ▣ 深绿 = 连续完成
  
  悬停显示: "2026-01-14 ✅ 已完成"

[趋势图] (最近30天)
  折线图显示完成率趋势
  标注里程碑: 7天、30天、100天

[心情分布] (如果有记录)
  饼图:
  😊 开心 60%
  😐 一般 30%
  😔 有点难 10%

[打卡记录列表]
  时间倒序:
  2026-01-14 10:23 ✅
  "今天读了《原则》第3章" 😊
  
  2026-01-13 09:15 ✅
  "早起读书感觉真好" 😊
  
  2026-01-12 22:30 ✅
  (无笔记)
```

**热力图实现**:
```typescript
// 使用Recharts的CalendarHeatmap
import { ResponsiveCalendar } from '@nivo/calendar'

<ResponsiveCalendar
  data={checkInsData}
  from="2025-01-01"
  to="2025-12-31"
  emptyColor="#eeeeee"
  colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
  monthBorderColor="#ffffff"
  dayBorderWidth={2}
  dayBorderColor="#ffffff"
/>
```

#### 2.4.2 总览页 `/dashboard`

**顶部统计**:
```
┌─────────────────────────────┐
│ 今日进度: 2/3 已完成          │
│ [━━━━━━━━━━▢▢] 67%           │
│                              │
│ 本周完成率: 18/21 = 85%       │
│ 总连续天数: 🔥 127天          │
└─────────────────────────────┘
```

**习惯排行**:
```
🥇 每日阅读      连续 45天
🥈 早起         连续 32天
🥉 健身         连续 18天
```

---

### 2.5 【P0】成就系统

#### 2.5.1 徽章定义

| 徽章 | 名称 | 条件 | 图标 |
|------|------|------|------|
| 🥉 | 初心者 | 连续7天 | 铜色徽章 |
| 🥈 | 坚持者 | 连续30天 | 银色徽章 |
| 🥇 | 习惯大师 | 连续100天 | 金色徽章 |
| 💎 | 年度传奇 | 连续365天 | 钻石徽章 |

**里程碑**:
- 首次打卡: 🎉 "开启改变之旅"
- 连续3天: ⚡ "三天打鱼不易"
- 连续7天: 🔥 "一周战士"
- 连续30天: 💪 "月度冠军"
- 连续100天: 🏆 "习惯大师"
- 连续365天: 👑 "年度传奇"

#### 2.5.2 达成弹窗

**设计**:
```
┌─────────────────────────────┐
│                              │
│      [金色徽章动画]           │
│         🥇                   │
│                              │
│    恭喜！你获得了徽章          │
│    【习惯大师】               │
│                              │
│  你已经坚持【每日阅读】         │
│  整整100天了！               │
│                              │
│  只有3%的用户能做到            │
│                              │
│  [分享成就] [继续努力]         │
└─────────────────────────────┘
```

**动画效果**:
- 徽章从上方飞入
- 金色光晕扩散
- confetti特效
- 成就音效（可选）

#### 2.5.3 成就墙 `/achievements`

**页面布局**:
```
[我的徽章墙]

[已获得]
🥉 初心者      2026-01-07获得
🥈 坚持者      2026-01-31获得
🥇 习惯大师    2026-04-15获得

[未获得] (灰色+进度)
💎 年度传奇    进度: 134/365天
   还需要 231天
```

---

### 2.6 【P1】社交分享

#### 2.6.1 成就海报生成 `/habits/[id]/share`

**海报模板1**: 极简风格
```
┌─────────────────────────────┐
│                              │
│         DailyChain           │
│                              │
│           📚                 │
│                              │
│        每日阅读               │
│                              │
│      已坚持 100 天            │
│                              │
│  [热力图缩略版]               │
│  ▣▣▣▣▣▣▣                     │
│  ▣▣▣▣▣▣▣                     │
│                              │
│    "读书使人进步"             │
│                              │
│    @张三                      │
│    2026.01.14                │
│                              │
└─────────────────────────────┘
```

**海报模板2**: 数据风格
```
┌─────────────────────────────┐
│  DailyChain 成就分享          │
│                              │
│  📚 每日阅读                  │
│                              │
│  连续天数: 🔥 100天           │
│  总打卡数: ✅ 287次           │
│  完成率:   📊 92%             │
│  获得徽章: 🥇 习惯大师         │
│                              │
│  [数据可视化图表]             │
│                              │
│  扫码加入我的习惯之旅 →       │
│  [二维码]                    │
└─────────────────────────────┘
```

**海报模板3**: 激励风格
```
┌─────────────────────────────┐
│                              │
│    "坚持100天后，            │
│     我成为了更好的自己"       │
│                              │
│         📚 → 💪              │
│                              │
│    每日阅读 x 100天           │
│                              │
│    来自 DailyChain 用户       │
│    @张三                      │
│                              │
│  你也可以做到 →               │
│  dailychain.com              │
│                              │
└─────────────────────────────┘
```

**生成逻辑**:
```typescript
import html2canvas from 'html2canvas'

const generatePoster = async (habitData) => {
  const posterElement = document.getElementById('poster-preview')
  const canvas = await html2canvas(posterElement, {
    scale: 2, // 高清输出
    backgroundColor: '#ffffff',
    logging: false
  })
  
  return canvas.toDataURL('image/png')
}
```

**分享功能**:
- [下载图片] 保存到本地
- [复制链接] 复制分享链接
- [分享到...] (未来: 微信/微博直接分享)

---

### 2.7 【P1】订阅管理

#### 2.7.1 定价页 `/pricing`

**对比表格**:

| 功能 | Free | Pro |
|------|------|-----|
| 习惯数量 | 3个 | ♾️ 无限 |
| 历史数据 | 30天 | ♾️ 全部 |
| 热力图 | ✅ | ✅ |
| 趋势图 | ❌ | ✅ |
| 心情记录 | ❌ | ✅ |
| 补卡功能 | ❌ | ✅ 3次/月 |
| 数据导出 | ❌ | ✅ PDF |
| 分享水印 | 有 | 无 |
| 优先支持 | ❌ | ✅ |

**价格**:
```
Pro月付: ¥15/月
Pro年付: ¥150/年 (省¥30)

[选择月付] [选择年付] ← 推荐
```

**用户评价**:
```
⭐⭐⭐⭐⭐
"补卡功能救了我的100天连续记录！"
—— 用户A

⭐⭐⭐⭐⭐
"界面简洁，数据可视化很棒"
—— 用户B
```

**常见问题**:
- Q: 可以取消订阅吗？
  A: 可以随时取消，到期后自动降级

- Q: 支持哪些支付方式？
  A: 支付宝、微信支付、信用卡

- Q: 数据会保留吗？
  A: 所有数据永久保留，降级后仅限制访问

#### 2.7.2 订阅确认页

**流程**:
1. 用户点击"升级Pro"
2. 跳转到Lemon Squeezy收银台
3. 选择支付方式（支付宝/微信）
4. 完成支付
5. Webhook回调更新用户plan
6. 返回Dashboard，显示Pro标识

#### 2.7.3 订阅管理 `/settings/subscription`

**Pro用户页面**:
```
┌─────────────────────────────┐
│  ✅ Pro会员                   │
│                              │
│  订阅状态: 活跃               │
│  到期时间: 2026-02-14         │
│  自动续费: 开启 [关闭]        │
│                              │
│  本月补卡: 1/3 已使用         │
│                              │
│  [管理订阅] [查看发票]         │
└─────────────────────────────┘
```

**Free用户页面**:
```
┌─────────────────────────────┐
│  🆓 免费版                    │
│                              │
│  习惯数量: 2/3 已使用         │
│  历史数据: 最近30天            │
│                              │
│  [升级Pro] 解锁全部功能        │
│  ✅ 无限习惯                  │
│  ✅ 完整历史数据               │
│  ✅ 补卡功能                  │
│  ✅ 高级统计                  │
│                              │
│  限时优惠: 首月5折 ¥7.5       │
└─────────────────────────────┘
```

---

## 3. 页面路由结构

```
/                          首页（未登录）
/auth/login                登录
/auth/signup               注册
/auth/forgot-password      忘记密码

/dashboard                 习惯列表（首页）
/habits/new                创建习惯
/habits/[id]               习惯详情
/habits/[id]/edit          编辑习惯
/habits/[id]/share         分享成就

/achievements              成就墙
/pricing                   定价页

/settings/profile          个人设置
/settings/subscription     订阅管理

/api/auth/*                认证API（Supabase）
/api/webhooks/lemon-squeezy  支付回调
```

---

## 4. 开发里程碑

### Week 1: 基础功能（Day 1-7）

**Day 1-2: 项目搭建**
- [ ] 初始化Next.js项目
- [ ] 配置Tailwind CSS v3
- [ ] 设置Supabase项目
- [ ] 创建数据库表
- [ ] 配置RLS策略

**Day 3-4: 认证系统**
- [ ] 注册页面 UI
- [ ] 登录页面 UI
- [ ] Supabase Auth集成
- [ ] Session管理
- [ ] 受保护路由

**Day 5-7: 习惯CRUD**
- [ ] 习惯列表页
- [ ] 创建习惯表单
- [ ] 图标选择器组件
- [ ] 颜色选择器组件
- [ ] 编辑/删除功能

### Week 2: 核心功能（Day 8-14）

**Day 8-9: 打卡功能**
- [ ] 打卡按钮组件
- [ ] Confetti动画
- [ ] 连续天数计算
- [ ] 打卡记录API
- [ ] 错误处理

**Day 10-11: 数据可视化**
- [ ] 热力图组件（Recharts）
- [ ] 统计卡片
- [ ] 趋势图
- [ ] 习惯详情页

**Day 12: 成就系统**
- [ ] 徽章定义
- [ ] 达成检测逻辑
- [ ] 庆祝弹窗
- [ ] 成就墙页面

**Day 13: 支付集成**
- [ ] Lemon Squeezy配置
- [ ] 定价页
- [ ] Webhook处理
- [ ] 订阅管理页

**Day 14: 优化上线**
- [ ] 性能优化
- [ ] SEO优化
- [ ] Bug修复
- [ ] Vercel部署

---

## 5. 非功能性需求

### 5.1 性能要求
- 页面首屏加载 < 2秒
- 打卡响应 < 500ms
- 热力图渲染 < 1秒
- 图片懒加载

### 5.2 兼容性
- 桌面端: Chrome/Safari/Edge 最新2个版本
- 移动端: iOS 14+, Android 10+
- 响应式设计: 320px - 1920px

### 5.3 安全性
- 使用HTTPS
- RLS策略防止数据泄露
- Webhook签名验证
- 输入验证和过滤

### 5.4 可用性
- 99.9% uptime (依赖Vercel/Supabase)
- 错误监控（Sentry）
- 日志记录

---

## 6. MVP范围限定

### ✅ MVP必须有（P0）
- 用户注册/登录
- 习惯CRUD
- 打卡功能
- 基础统计（连续天数、完成率）
- 热力图
- 徽章系统
- 付费订阅（Free/Pro）
- 补卡功能（Pro）

### ⏸️ MVP暂不做（P1）
- 习惯模板
- 习惯分类
- 标签系统
- 团队协作
- 社交关注
- 评论点赞
- 推送通知（邮件/桌面）
- 暗黑模式
- 多语言

### 🚫 MVP不做（P2）
- 原生APP
- 数据导入
- API开放
- 习惯社区
- 挑战赛
- AI推荐
- 语音打卡
- 视频打卡

---

## 7. 关键指标

### 用户指标
- 注册用户: 500 (3个月)
- Day 1 留存: >70%
- Day 7 留存: >40%
- Day 30 留存: >20%

### 行为指标
- 平均习惯数: 2.5个/用户
- 打卡频率: 5次/周
- 连续天数中位数: 14天
- 分享率: >15%

### 商业指标
- 付费用户: 50 (3个月)
- 转化率: >10%
- MRR: ¥750
- LTV: >¥180
- CAC: <¥50

### 技术指标
- 页面加载: <2秒
- API响应: <500ms
- 错误率: <0.1%
- 可用性: >99.9%

---

## 8. 风险与应对

### 技术风险
- **Supabase免费额度不够**: 监控使用量，提前升级Pro($25/月)
- **Vercel被墙**: Cloudflare CDN备用
- **支付失败**: Lemon Squeezy备用联系客服

### 产品风险
- **留存率低**: 强化成就感反馈，优化新手引导
- **转化率低**: 优化补卡触发时机，增加免费限制
- **数据准确性**: 单元测试覆盖核心逻辑

### 市场风险
- **竞品抄袭**: 快速迭代，建立品牌
- **获客成本高**: 内容营销，SEO优化

---

## 9. 下一步行动

1. [ ] **今天**: 安装依赖，初始化Supabase
2. [ ] **明天**: 创建数据库表，配置RLS
3. [ ] **Day 3**: 开发注册/登录页面
4. [ ] **Day 5**: 开发习惯列表页
5. [ ] **Day 8**: 开发打卡功能
6. [ ] **Week 2**: 完成MVP，开始内测

---

**文档版本**: v1.0  
**最后更新**: 2026-01-14  
**状态**: ✅ Ready to Build
