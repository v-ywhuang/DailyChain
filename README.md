# DailyChain (链习惯)

极简、有成就感的习惯养成工具，3秒打卡，看见进步。

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS v3
- **UI设计**: [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **动画**: Framer Motion
- **图表**: Recharts
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: Vercel
- **支付**: Lemon Squeezy

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. 创建数据库表

在Supabase SQL编辑器中执行 `docs/PRD_v1.0.md` 中的SQL脚本。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── auth/         # 认证页面
│   ├── dashboard/    # 主页
│   ├── habits/       # 习惯管理
│   ├── settings/     # 设置
│   └── api/          # API路由
├── components/       # 通用组件
├── lib/             # 工具函数
└── types/           # TypeScript类型
```

## 开发计划

- [x] 项目初始化
- [ ] Week 1: 认证 + 习惯CRUD
- [ ] Week 2: 打卡 + 可视化 + 支付

详细需求见 `docs/PRD_v1.0.md`

## 文档

- [产品需求文档 (PRD)](./docs/PRD_v1.0.md)

## License

MIT
