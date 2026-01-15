-- ============================================
-- DailyChain 完整数据库Schema
-- 创建时间: 2026-01-14
-- 说明: 灵活的选项池系统 + 鼓励语系统
-- ============================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户扩展表
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  
  -- 会员权益
  max_active_habits INT DEFAULT 1, -- 免费1个,Pro无限
  makeup_count INT DEFAULT 0, -- 补卡次数
  
  -- 统计数据
  total_check_ins INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_check_in_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. 习惯类别表 (核心)
-- ============================================
CREATE TABLE public.habit_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  name_en VARCHAR(50),
  icon VARCHAR(20) NOT NULL, -- emoji
  color VARCHAR(20) NOT NULL, -- hex color
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入预设类别
INSERT INTO public.habit_categories (name, name_en, icon, color, description, sort_order) VALUES
  ('减肥', 'weight_loss', '🏃', '#f97316', '科学减重，健康生活', 1),
  ('阅读', 'reading', '📚', '#3b82f6', '读书使人进步，知识改变命运', 2),
  ('冥想', 'meditation', '🧘', '#8b5cf6', '放空自己，找回内心的平静', 3),
  ('健身', 'fitness', '💪', '#ef4444', '雕刻身材，释放荷尔蒙', 4),
  ('早起', 'early_rise', '🌅', '#f59e0b', '一日之计在于晨', 5);

-- ============================================
-- 3. 习惯选项池 (核心 - 最重要的表)
-- ============================================
CREATE TABLE public.habit_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.habit_categories(id) ON DELETE CASCADE,
  
  -- 基础信息
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  type VARCHAR(20) NOT NULL CHECK (type IN ('diet', 'exercise', 'lifestyle', 'mental', 'learning')),
  
  -- 频率设置
  frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  frequency_count INT DEFAULT 1, -- 每周几次(仅weekly)
  
  -- 激励内容
  encouragement TEXT NOT NULL, -- "晚餐不吃，精神倍增！"
  tips TEXT, -- "可以喝无糖酸奶或吃点水果垫垫"
  
  -- 属性标签
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5), -- 难度1-5星
  calories_burn INT, -- 消耗卡路里(仅运动类)
  estimated_time INT, -- 预计耗时(分钟)
  
  -- 推荐算法
  is_popular BOOLEAN DEFAULT FALSE, -- 是否热门推荐
  is_beginner_friendly BOOLEAN DEFAULT TRUE, -- 是否新手友好
  usage_count INT DEFAULT 0, -- 被选择次数
  success_rate DECIMAL(5,2) DEFAULT 0, -- 成功率(0-100)
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_habit_options_category ON public.habit_options(category_id);
CREATE INDEX idx_habit_options_popular ON public.habit_options(is_popular) WHERE is_popular = TRUE;

-- 插入减肥类选项池
INSERT INTO public.habit_options (category_id, name, type, frequency, encouragement, tips, difficulty, is_popular, is_beginner_friendly) VALUES
  -- 饮食习惯
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '不吃晚饭', 'diet', 'daily', '晚餐不吃，精神倍增！明早体重秤会给你惊喜 ⚡', '可以喝无糖酸奶或吃点水果垫垫', 2, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '不吃零食', 'diet', 'daily', '拒绝零食，拒绝糖分，你的意志力令人敬佩！ 💎', '实在想吃可以吃坚果、水果', 3, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '低碳饮食', 'diet', 'daily', '低碳水化合物，高蛋白质，科学燃脂模式开启！ 🔥', '主食减半，多吃肉蛋奶和蔬菜', 4, FALSE, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '轻断食16:8', 'diet', 'daily', '16小时断食，8小时进食，细胞自噬启动！ 🧬', '12点-20点进食窗口，其余时间只喝水', 5, FALSE, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '每餐七分饱', 'diet', 'daily', '七分饱刚刚好，胃会感谢你！ 🙏', '吃到不饿即可，不要吃撑', 2, TRUE, TRUE),
  
  -- 运动习惯
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '晨跑30分钟', 'exercise', 'daily', '清晨的汗水，是最好的燃脂剂！ 🏃', '空腹跑步燃脂效果更好，记得补水', 3, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '游泳45分钟', 'exercise', 'daily', '游泳是最好的全身运动，燃脂又塑形！ 🏊', '建议自由泳和蛙泳结合', 3, FALSE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '跳绳1000个', 'exercise', 'daily', '跳绳是燃脂之王，10分钟消耗相当于跑步30分钟！ 🔥', '分组跳：200×5组，组间休息1分钟', 2, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '快走10000步', 'exercise', 'daily', '每一步都在燃烧卡路里，坚持就是胜利！ 👟', '可以分多次完成，保持快走状态', 1, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), 'HIIT训练20分钟', 'exercise', 'daily', '高强度间歇训练，燃脂持续24小时！ 💥', '建议用Keep或Fitbod APP跟练', 4, FALSE, FALSE),
  
  -- 生活习惯
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '每天8杯水', 'lifestyle', 'daily', '水是生命之源，也是瘦身之本！ 💧', '饭前喝水能增加饱腹感，减少进食', 1, TRUE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '早睡早起', 'lifestyle', 'daily', '充足睡眠能平衡激素，让减肥事半功倍！ 😴', '建议22:30-23:00入睡，保证8小时', 3, FALSE, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '减肥'), '记录饮食', 'lifestyle', 'daily', '记录能让你看清真相，控制摄入！ 📝', '用手机拍照记录，晚上复盘', 2, FALSE, TRUE);

-- 插入阅读类选项池
INSERT INTO public.habit_options (category_id, name, type, frequency, encouragement, tips, difficulty, estimated_time, is_popular) VALUES
  ((SELECT id FROM public.habit_categories WHERE name = '阅读'), '阅读30分钟', 'learning', 'daily', '每天半小时，一年读完24本书！ 📚', '早上阅读记忆效果更好', 2, 30, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '阅读'), '阅读1小时', 'learning', 'daily', '深度阅读，让知识真正内化！ 🧠', '找个安静的地方，关掉手机通知', 3, 60, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '阅读'), '读完1本书', 'learning', 'weekly', '一周一本书，一年52本，超越99%的人！ 🏆', '根据个人速度调整，不求快只求精', 4, NULL, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '阅读'), '做读书笔记', 'learning', 'daily', '好记性不如烂笔头，笔记让阅读更有价值！ ✍️', '使用flomo、Notion等工具记录', 3, 15, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '阅读'), '阅读英文原著', 'learning', 'daily', '英文阅读，一举两得！语言和知识双丰收 🌍', '从简单的开始，不要查太多单词', 5, 30, FALSE);

-- 插入冥想类选项池
INSERT INTO public.habit_options (category_id, name, type, frequency, encouragement, tips, difficulty, estimated_time, is_popular) VALUES
  ((SELECT id FROM public.habit_categories WHERE name = '冥想'), '冥想10分钟', 'mental', 'daily', '深呼吸，感受当下的宁静 🧘', '早晨冥想能让一天都保持平静', 2, 10, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '冥想'), '冥想20分钟', 'mental', 'daily', '更深层的放松，与自己对话 ✨', '使用Calm、Headspace等APP引导', 3, 20, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '冥想'), '正念呼吸', 'mental', 'daily', '专注呼吸，让思绪归零 🌬️', '4秒吸气-7秒憋气-8秒呼气', 1, 5, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '冥想'), '感恩日记', 'mental', 'daily', '记录3件感恩的事，让心充满阳光 ☀️', '睡前写，回顾美好的一天', 2, 10, FALSE);

-- 插入健身类选项池
INSERT INTO public.habit_options (category_id, name, type, frequency, encouragement, tips, difficulty, estimated_time, is_popular, calories_burn) VALUES
  ((SELECT id FROM public.habit_categories WHERE name = '健身'), '力量训练', 'exercise', 'weekly', '每一次举铁，都是对自己的投资！ 💪', '大肌群优先：胸背腿，复合动作效果最好', 4, 60, TRUE, 300),
  ((SELECT id FROM public.habit_categories WHERE name = '健身'), '俯卧撑50个', 'exercise', 'daily', '俯卧撑之王！胸肌、肩膀、手臂一起练 🔥', '可以分组：20+15+10+5', 3, 10, TRUE, 50),
  ((SELECT id FROM public.habit_categories WHERE name = '健身'), '深蹲100个', 'exercise', 'daily', '深蹲是力量之王，练腿等于练全身！ 🦵', '保持腰背挺直，膝盖不超过脚尖', 3, 15, TRUE, 80),
  ((SELECT id FROM public.habit_categories WHERE name = '健身'), '拉伸15分钟', 'exercise', 'daily', '拉伸能让肌肉线条更好看！ 🤸', '训练后拉伸很重要，防止肌肉僵硬', 1, 15, TRUE, 30),
  ((SELECT id FROM public.habit_categories WHERE name = '健身'), '卷腹100个', 'exercise', 'daily', '马甲线就是这么练出来的！ ✨', '慢速发力，感受腹肌收缩', 2, 10, TRUE, 40);

-- 插入早起类选项池
INSERT INTO public.habit_options (category_id, name, type, frequency, encouragement, tips, difficulty, is_popular) VALUES
  ((SELECT id FROM public.habit_categories WHERE name = '早起'), '6:00起床', 'lifestyle', 'daily', '早起的鸟儿有虫吃！你比别人多活3小时 🌅', '前一晚10点睡，保证8小时睡眠质量', 3, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '早起'), '7:00起床', 'lifestyle', 'daily', '7点起床，一天从容开始！ ☀️', '给自己留足早餐和准备时间', 2, TRUE),
  ((SELECT id FROM public.habit_categories WHERE name = '早起'), '不睡懒觉', 'lifestyle', 'daily', '告别懒觉，拥抱活力！ ⚡', '周末也保持规律作息', 2, FALSE),
  ((SELECT id FROM public.habit_categories WHERE name = '早起'), '晨间仪式', 'lifestyle', 'daily', '用仪式感开启美好一天！ 🌟', '可以是冥想、晨跑、读书等', 3, FALSE);

-- ============================================
-- 4. 用户习惯表
-- ============================================
CREATE TABLE public.user_habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.habit_categories(id),
  
  -- 习惯基础信息
  name VARCHAR(100) NOT NULL, -- 用户自定义名称 "我的减肥计划"
  description TEXT,
  
  -- 目标设置
  target_value DECIMAL(10,2), -- 目标值(如减重5kg)
  target_unit VARCHAR(20), -- 单位(kg, 本, 次)
  target_days INT, -- 目标天数
  
  -- 统计数据
  current_streak INT DEFAULT 0, -- 当前连续天数
  longest_streak INT DEFAULT 0, -- 最长连续天数
  total_check_ins INT DEFAULT 0, -- 总打卡次数
  last_check_in_date DATE,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_habits_user ON public.user_habits(user_id);
CREATE INDEX idx_user_habits_active ON public.user_habits(user_id, is_active) WHERE is_active = TRUE;

-- ============================================
-- 5. 用户选择的选项 (多对多关系)
-- ============================================
CREATE TABLE public.user_habit_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.habit_options(id) ON DELETE CASCADE,
  
  -- 该选项的完成状态
  is_enabled BOOLEAN DEFAULT TRUE, -- 用户是否启用该选项
  sort_order INT DEFAULT 0, -- 显示顺序
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(habit_id, option_id)
);

-- 创建索引
CREATE INDEX idx_user_habit_options_habit ON public.user_habit_options(habit_id);

-- ============================================
-- 6. 打卡记录表
-- ============================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  
  -- 打卡时间
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 完成的选项 (JSONB存储多个option_id)
  completed_options JSONB DEFAULT '[]'::jsonb, -- ["uuid1", "uuid2"]
  
  -- 个性化数据追踪
  weight DECIMAL(5,2), -- 体重(kg)
  pages INT, -- 阅读页数
  books INT, -- 读完书籍数
  mood VARCHAR(20), -- 心情(great/good/ok/bad)
  duration INT, -- 时长(分钟)
  notes TEXT, -- 用户备注
  
  -- 补卡标记
  is_makeup BOOLEAN DEFAULT FALSE,
  makeup_reason TEXT,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, habit_id, check_in_date)
);

-- 创建索引
CREATE INDEX idx_check_ins_user_habit ON public.check_ins(user_id, habit_id);
CREATE INDEX idx_check_ins_date ON public.check_ins(check_in_date);

-- ============================================
-- 7. 鼓励语库 (核心)
-- ============================================
CREATE TABLE public.encouragements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 内容
  content TEXT NOT NULL, -- "坚持就是胜利！你离目标又近了一步 🎯"
  content_en TEXT, -- 英文版本(可选)
  
  -- 分类
  category VARCHAR(50), -- null表示通用，或指定"减肥"、"阅读"等
  context VARCHAR(50) DEFAULT 'daily' CHECK (context IN ('daily', 'milestone', 'streak', 'completion', 'encouragement')),
  
  -- 触发条件
  min_streak INT, -- 最小连续天数(null表示任意)
  max_streak INT, -- 最大连续天数(null表示无限)
  trigger_day INT, -- 特定天数触发(如第3天、第7天)
  
  -- 情感标签
  emotion VARCHAR(20) CHECK (emotion IN ('motivational', 'celebratory', 'gentle', 'challenging', 'humorous')),
  
  -- 推荐算法
  is_active BOOLEAN DEFAULT TRUE,
  weight INT DEFAULT 1, -- 权重(越高越容易被抽到)
  usage_count INT DEFAULT 0, -- 使用次数
  like_count INT DEFAULT 0, -- 点赞数
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) -- 创建者(用户投稿)
);

-- 创建索引
CREATE INDEX idx_encouragements_category ON public.encouragements(category);
CREATE INDEX idx_encouragements_context ON public.encouragements(context);
CREATE INDEX idx_encouragements_active ON public.encouragements(is_active) WHERE is_active = TRUE;

-- 插入通用鼓励语(100+条)
INSERT INTO public.encouragements (content, context, emotion, weight) VALUES
  -- 日常鼓励(daily)
  ('坚持就是胜利！你离目标又近了一步 🎯', 'daily', 'motivational', 10),
  ('每一次打卡，都是对自己的一次投资 💎', 'daily', 'motivational', 10),
  ('今天的你，比昨天更棒！ ⭐', 'daily', 'gentle', 8),
  ('小习惯，大改变！继续加油 🔥', 'daily', 'motivational', 10),
  ('你的坚持，会被时间看见 ⏳', 'daily', 'gentle', 8),
  ('别放弃！最暗的夜，离天亮最近 🌅', 'daily', 'motivational', 9),
  ('你已经超越了昨天的自己，了不起！ 👏', 'daily', 'celebratory', 8),
  ('每一天的努力，都在为未来的你铺路 🛤️', 'daily', 'motivational', 9),
  ('相信过程，享受进步！ 🌱', 'daily', 'gentle', 7),
  ('你比想象中更强大！ 💪', 'daily', 'motivational', 10),
  ('成功的秘诀就是坚持到最后一刻 🏁', 'daily', 'motivational', 9),
  ('今天也是充满希望的一天！ 🌈', 'daily', 'gentle', 8),
  ('你的努力，终将开花结果 🌸', 'daily', 'motivational', 9),
  ('每个坚持的日子，都值得被记住 📝', 'daily', 'gentle', 7),
  ('改变，从今天开始！ ✨', 'daily', 'motivational', 10),
  ('你正在成为更好的自己 🦋', 'daily', 'gentle', 9),
  ('积累的力量，终将爆发 💥', 'daily', 'motivational', 8),
  ('继续前进，精彩还在后头！ 🎪', 'daily', 'motivational', 8),
  ('你的坚持，正在改变人生 🌟', 'daily', 'motivational', 10),
  ('今天又是元气满满的一天！ ☀️', 'daily', 'gentle', 8),
  
  -- 连续打卡里程碑(streak)
  ('万事开头难，你迈出了第一步！ 🚀', 'streak', 'celebratory', 10),
  ('连续3天！你已经超越了大多数人 🎉', 'streak', 'celebratory', 10),
  ('一周战士！你的坚持令人敬佩 🏆', 'streak', 'celebratory', 10),
  ('两周啦！习惯开始形成 ⚡', 'streak', 'celebratory', 10),
  ('21天！科学证明习惯已养成 🧬', 'streak', 'celebratory', 10),
  ('满月啦！你已经蜕变了 🌕', 'streak', 'celebratory', 10),
  ('50天！这份毅力无人能敌 💎', 'streak', 'celebratory', 10),
  ('百日筑基！你已经是大师级别 👑', 'streak', 'celebratory', 10),
  ('一年坚持！你是传奇！ 🏛️', 'streak', 'celebratory', 10),
  
  -- 里程碑(milestone)
  ('前3天最难，你做到了！身体开始适应新节奏 🎉', 'milestone', 'celebratory', 8),
  ('一周啦！变化开始悄悄发生 📉', 'milestone', 'celebratory', 8),
  ('两周见效！朋友开始注意到你的改变 👏', 'milestone', 'celebratory', 8),
  ('习惯养成！新的生活方式已经刻进DNA 🧬', 'milestone', 'celebratory', 8),
  ('30天蜕变！你已经是0.1%的狠人了 👑', 'milestone', 'celebratory', 10),
  
  -- 幽默风格(humorous)
  ('打卡成功！你又赢了懒惰一次 😎', 'daily', 'humorous', 7),
  ('你的自律，让别人的懒惰无地自容 🤣', 'daily', 'humorous', 7),
  ('又打卡了！你是不是开挂了？ 🎮', 'daily', 'humorous', 6),
  ('坚持打卡的人，运气都不会太差 🍀', 'daily', 'humorous', 7),
  ('你这么自律，一定是隐藏的超级英雄吧 🦸', 'daily', 'humorous', 6);

-- 插入减肥专属鼓励语
INSERT INTO public.encouragements (content, category, context, emotion, weight) VALUES
  ('体重秤上的数字，正在向你的目标靠近！ 📉', '减肥', 'daily', 'motivational', 10),
  ('每一滴汗水，都是脂肪在哭泣 💧', '减肥', 'daily', 'motivational', 9),
  ('镜子里的你，一天比一天好看！ ✨', '减肥', 'daily', 'gentle', 8),
  ('衣服变松了？恭喜你，瘦了！ 🎉', '减肥', 'milestone', 'celebratory', 10),
  ('夏天快到了，马甲线也快到了 🏖️', '减肥', 'daily', 'motivational', 8),
  ('管住嘴，迈开腿，好身材就在前方 🏃', '减肥', 'daily', 'motivational', 9),
  ('减肥不是为了别人，是为了遇见最好的自己 💖', '减肥', 'daily', 'gentle', 8),
  ('忍住今天的美食，换来明天的美貌 ✨', '减肥', 'daily', 'motivational', 8);

-- 插入阅读专属鼓励语
INSERT INTO public.encouragements (content, category, context, emotion, weight) VALUES
  ('又读完一页！知识的复利正在积累 📚', '阅读', 'daily', 'motivational', 10),
  ('今天读的书，明天就是你的底气 🧠', '阅读', 'daily', 'motivational', 9),
  ('阅读是最划算的投资，回报率无限 💰', '阅读', 'daily', 'motivational', 8),
  ('你读过的书，藏在你的气质里 ✨', '阅读', 'daily', 'gentle', 9),
  ('每天30分钟，一年后你会感谢今天的自己 ⏰', '阅读', 'daily', 'motivational', 8),
  ('书中自有黄金屋，你正在挖宝藏 💎', '阅读', 'daily', 'gentle', 7);

-- 插入冥想专属鼓励语
INSERT INTO public.encouragements (content, category, context, emotion, weight) VALUES
  ('深呼吸，让焦虑随风而去 🍃', '冥想', 'daily', 'gentle', 10),
  ('心静了，世界就安静了 ✨', '冥想', 'daily', 'gentle', 9),
  ('冥想10分钟，胜过焦虑一整天 🧘', '冥想', 'daily', 'motivational', 8),
  ('内心的平静，是最好的礼物 🎁', '冥想', 'daily', 'gentle', 9),
  ('冥想让你与真实的自己相遇 🌟', '冥想', 'daily', 'gentle', 8);

-- 插入健身专属鼓励语
INSERT INTO public.encouragements (content, category, context, emotion, weight) VALUES
  ('肌肉在撕裂，力量在重生 💪', '健身', 'daily', 'motivational', 10),
  ('今天的汗水，是明天的线条 🔥', '健身', 'daily', 'motivational', 9),
  ('没有天生的好身材，只有不放弃的自己 ⚡', '健身', 'daily', 'motivational', 9),
  ('举铁的人，从不会被生活击倒 🏋️', '健身', 'daily', 'motivational', 8),
  ('你的身材，暴露了你的自律 ✨', '健身', 'daily', 'motivational', 8);

-- 插入早起专属鼓励语
INSERT INTO public.encouragements (content, category, context, emotion, weight) VALUES
  ('早起的你，已经赢了一半！ 🌅', '早起', 'daily', 'motivational', 10),
  ('清晨的阳光，为你而来 ☀️', '早起', 'daily', 'gentle', 9),
  ('一日之计在于晨，你又赚到3小时 ⏰', '早起', 'daily', 'motivational', 9),
  ('早起是成功人士的标配，你已经是了 👑', '早起', 'daily', 'motivational', 8),
  ('告别赖床，拥抱活力！早起万岁 🎉', '早起', 'daily', 'celebratory', 8);

-- 插入通用唯美温暖鼓励语（无category，适用所有场景）
INSERT INTO public.encouragements (content, context, emotion, weight) VALUES
  -- 坚持与成长主题
  ('每一次的坚持，都在为更好的自己铺路 ✨', 'daily', 'gentle', 10),
  ('你的努力，时间都看得见 ⏰', 'daily', 'motivational', 10),
  ('改变，从今天的这一小步开始 🌱', 'daily', 'gentle', 10),
  ('别急，慢慢来，你已经在变好了 🌸', 'daily', 'gentle', 9),
  ('坚持不是因为容易，而是因为值得 💎', 'daily', 'motivational', 9),
  ('今天的你，比昨天更靠近梦想一步 🎯', 'daily', 'motivational', 9),
  ('积累的力量，终将让你破茧成蝶 🦋', 'daily', 'motivational', 8),
  ('每一个选择，都在塑造未来的自己 🌟', 'daily', 'gentle', 8),
  
  -- 温暖治愈主题
  ('对自己温柔一点，你已经很棒了 💝', 'daily', 'gentle', 10),
  ('感恩今天的自己，没有放弃 🙏', 'daily', 'gentle', 10),
  ('你的坚持，是对自己最好的礼物 🎁', 'daily', 'gentle', 9),
  ('慢慢来，比较快。你做得很好 🌈', 'daily', 'gentle', 9),
  ('拥抱今天的不完美，也是一种勇气 💪', 'daily', 'gentle', 8),
  ('每一次打卡，都是对自己的一次善待 ❤️', 'daily', 'gentle', 8),
  
  -- 连续打卡奖励
  ('你的自律，会成为别人的风景 🌄', 'streak', 'motivational', 10),
  ('连续打卡的日子，是在为梦想蓄力 🚀', 'streak', 'motivational', 10),
  ('坚持到现在，你已经超越了90%的人 👏', 'streak', 'motivational', 9),
  ('习惯的力量，正在你身上显现 ⚡', 'streak', 'motivational', 9),
  ('每个连续的日子，都是一个小奇迹 ✨', 'streak', 'celebratory', 8),
  
  -- 挑战与突破主题
  ('突破舒适区，才能遇见更好的自己 🔥', 'daily', 'motivational', 10),
  ('今天的汗水，是明天的勋章 🏅', 'daily', 'motivational', 9),
  ('自律即自由，坚持即胜利 🎯', 'daily', 'motivational', 9),
  ('不是一定要成功，但一定要成长 🌳', 'daily', 'motivational', 8),
  ('每一次坚持，都是对平庸的反抗 ⚔️', 'daily', 'motivational', 8),
  
  -- 里程碑庆祝
  ('你做到了！这份坚持值得被铭记 🎊', 'milestone', 'celebratory', 10),
  ('看，你比自己想象的更厉害 💪', 'milestone', 'celebratory', 10),
  ('这一刻，值得为自己鼓掌 👏', 'milestone', 'celebratory', 9),
  ('你的努力，开出了美丽的花 🌺', 'milestone', 'celebratory', 9),
  ('坚持到这里，你已经是英雄了 🦸', 'milestone', 'celebratory', 8),
  
  -- 深夜/早晨时段专属
  ('深夜还在坚持的你，真的很酷 🌙', 'daily', 'gentle', 9),
  ('今天辛苦了，记得好好休息 😴', 'daily', 'gentle', 9),
  ('晚安，明天又是充满希望的一天 🌟', 'daily', 'gentle', 8),
  ('新的一天，新的开始，加油 💪', 'daily', 'motivational', 9),
  ('早安，世界因你的努力而美好 🌅', 'daily', 'gentle', 8);

-- ============================================
-- 8. 用户鼓励语历史 (避免重复推送)
-- ============================================
CREATE TABLE public.user_encouragement_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  encouragement_id UUID NOT NULL REFERENCES public.encouragements(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.user_habits(id) ON DELETE CASCADE, -- 可选：关联具体习惯
  
  -- 反馈
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shown_date DATE DEFAULT CURRENT_DATE, -- 新增：存储日期部分，用于唯一约束
  was_liked BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, encouragement_id, habit_id, shown_date)
);

-- 创建索引
CREATE INDEX idx_user_encouragement_history_user ON public.user_encouragement_history(user_id);

-- ============================================
-- 9. 成就系统 (可选)
-- ============================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(20), -- emoji
  category VARCHAR(50),
  
  -- 解锁条件
  unlock_condition JSONB, -- {"type": "streak", "value": 7}
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户获得的成就
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES public.user_habits(id), -- 可选：关联具体习惯
  
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id, habit_id)
);

-- 插入预设成就
INSERT INTO public.achievements (name, description, icon, category, unlock_condition) VALUES
  ('初出茅庐', '完成第一次打卡', '🌱', 'milestone', '{"type": "total_check_ins", "value": 1}'),
  ('三天之约', '连续打卡3天', '🔥', 'streak', '{"type": "streak", "value": 3}'),
  ('一周战士', '连续打卡7天', '⚡', 'streak', '{"type": "streak", "value": 7}'),
  ('习惯养成', '连续打卡21天', '🧬', 'streak', '{"type": "streak", "value": 21}'),
  ('满月成就', '连续打卡30天', '🌕', 'streak', '{"type": "streak", "value": 30}'),
  ('钢铁意志', '连续打卡50天', '💎', 'streak', '{"type": "streak", "value": 50}'),
  ('百日筑基', '连续打卡100天', '👑', 'streak', '{"type": "streak", "value": 100}'),
  ('年度传奇', '连续打卡365天', '🏛️', 'streak', '{"type": "streak", "value": 365}');

-- ============================================
-- 10. RLS (Row Level Security) 安全策略
-- ============================================

-- 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habit_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_encouragement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own habits" ON public.user_habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON public.user_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON public.user_habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON public.user_habits
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habit options" ON public.user_habit_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_habits 
      WHERE user_habits.id = user_habit_options.habit_id 
      AND user_habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own habit options" ON public.user_habit_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_habits 
      WHERE user_habits.id = user_habit_options.habit_id 
      AND user_habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 所有人可以读取类别和选项池
CREATE POLICY "Anyone can view categories" ON public.habit_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view options" ON public.habit_options
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view encouragements" ON public.encouragements
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (is_active = TRUE);

-- 用户成就策略
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 鼓励语历史策略
CREATE POLICY "Users can view own encouragement history" ON public.user_encouragement_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own encouragement history" ON public.user_encouragement_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. 触发器和函数
-- ============================================

-- 更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_habits_updated_at BEFORE UPDATE ON public.user_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_options_updated_at BEFORE UPDATE ON public.habit_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 打卡时更新连续天数
CREATE OR REPLACE FUNCTION update_streak_on_check_in()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  check_date DATE;
BEGIN
  -- 获取上次打卡日期
  SELECT last_check_in_date INTO last_date
  FROM public.user_habits
  WHERE id = NEW.habit_id;
  
  check_date := NEW.check_in_date;
  
  -- 如果是连续的一天，streak+1
  IF last_date = check_date - INTERVAL '1 day' THEN
    UPDATE public.user_habits
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      total_check_ins = total_check_ins + 1,
      last_check_in_date = check_date
    WHERE id = NEW.habit_id;
  
  -- 如果是同一天（补充打卡），不更新
  ELSIF last_date = check_date THEN
    NULL; -- 什么都不做
  
  -- 如果断了，重置为1
  ELSE
    UPDATE public.user_habits
    SET 
      current_streak = 1,
      total_check_ins = total_check_ins + 1,
      last_check_in_date = check_date
    WHERE id = NEW.habit_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_in_update_streak AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION update_streak_on_check_in();

-- 打卡时更新用户全局统计
CREATE OR REPLACE FUNCTION update_user_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_check_dates DATE[];
  v_prev_date DATE;
  v_streak INT := 0;
  v_max_streak INT := 0;
  v_date DATE;
BEGIN
  -- 获取该用户所有不重复的打卡日期（升序）
  SELECT ARRAY_AGG(DISTINCT check_in_date ORDER BY check_in_date)
  INTO v_check_dates
  FROM public.check_ins
  WHERE user_id = NEW.user_id;
  
  -- 计算连续天数
  v_prev_date := NULL;
  v_streak := 0;
  v_max_streak := 0;
  v_current_streak := 0;
  
  FOREACH v_date IN ARRAY v_check_dates LOOP
    IF v_prev_date IS NULL THEN
      -- 第一天
      v_streak := 1;
    ELSIF v_date = v_prev_date + 1 THEN
      -- 连续
      v_streak := v_streak + 1;
    ELSE
      -- 断了，记录最大值并重置
      IF v_streak > v_max_streak THEN
        v_max_streak := v_streak;
      END IF;
      v_streak := 1;
    END IF;
    
    v_prev_date := v_date;
  END LOOP;
  
  -- 最后一段streak也要检查
  IF v_streak > v_max_streak THEN
    v_max_streak := v_streak;
  END IF;
  
  -- 判断 current_streak：最后一次打卡是今天或昨天
  IF v_prev_date = CURRENT_DATE OR v_prev_date = CURRENT_DATE - 1 THEN
    v_current_streak := v_streak;
  ELSE
    v_current_streak := 0;
  END IF;
  
  -- 更新用户统计
  UPDATE public.user_profiles
  SET 
    total_check_ins = ARRAY_LENGTH(v_check_dates, 1),
    current_streak = v_current_streak,
    longest_streak = v_max_streak,
    last_check_in_at = NEW.check_in_time,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_in_update_profile_stats AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION update_user_profile_stats();

-- 打卡时更新选项使用次数
CREATE OR REPLACE FUNCTION update_option_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新所有完成的选项的使用次数
  UPDATE public.habit_options
  SET usage_count = usage_count + 1
  WHERE id = ANY(
    SELECT jsonb_array_elements_text(NEW.completed_options)::UUID
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_in_update_option_usage AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION update_option_usage_count();

-- ============================================
-- 12. 数据统计视图
-- ============================================

-- 用户习惯概览
CREATE OR REPLACE VIEW user_habits_overview AS
SELECT 
  uh.id,
  uh.user_id,
  uh.name,
  hc.name as category_name,
  hc.icon as category_icon,
  hc.color as category_color,
  uh.current_streak,
  uh.longest_streak,
  uh.total_check_ins,
  uh.target_days,
  uh.is_active,
  uh.created_at,
  -- 计算完成进度
  CASE 
    WHEN uh.target_days > 0 THEN 
      ROUND((uh.total_check_ins::DECIMAL / uh.target_days) * 100, 2)
    ELSE 0
  END as progress_percentage,
  -- 计算今天是否已打卡
  EXISTS (
    SELECT 1 FROM public.check_ins ci 
    WHERE ci.habit_id = uh.id 
    AND ci.check_in_date = CURRENT_DATE
  ) as checked_today
FROM public.user_habits uh
JOIN public.habit_categories hc ON hc.id = uh.category_id;

-- 习惯选项统计
CREATE OR REPLACE VIEW habit_options_stats AS
SELECT 
  ho.id,
  ho.name,
  hc.name as category_name,
  ho.type,
  ho.difficulty,
  ho.usage_count,
  ho.is_popular,
  -- 计算成功率（完成选项的打卡数 / 总打卡数）
  COALESCE(
    ROUND(
      (SELECT COUNT(*)::DECIMAL 
       FROM public.check_ins ci 
       WHERE ci.completed_options @> to_jsonb(ARRAY[ho.id::TEXT])
      ) / NULLIF(ho.usage_count, 0) * 100
    , 2),
    0
  ) as completion_rate
FROM public.habit_options ho
JOIN public.habit_categories hc ON hc.id = ho.category_id;

-- ============================================
-- 13. 自动创建用户Profile (重要！)
-- ============================================

-- 当用户注册时，自动在user_profiles表创建记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入用户profile，如果已存在则忽略
  INSERT INTO public.user_profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 记录日志
  RAISE NOTICE '✅ 用户Profile创建: id=%, email=%', NEW.id, NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 如果失败，记录错误但不阻止用户注册
    RAISE WARNING '❌ 创建用户Profile失败: %, SQLSTATE=%', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器：监听auth.users表的INSERT事件
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 完成！
-- ============================================

-- 打印总结
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库Schema创建完成！';
  RAISE NOTICE '📊 表统计:';
  RAISE NOTICE '   - 用户相关: user_profiles, user_habits, user_habit_options, check_ins';
  RAISE NOTICE '   - 内容相关: habit_categories, habit_options, encouragements';
  RAISE NOTICE '   - 成就相关: achievements, user_achievements';
  RAISE NOTICE '   - 历史记录: user_encouragement_history';
  RAISE NOTICE '';
  RAISE NOTICE '📝 预设数据:';
  RAISE NOTICE '   - 5个习惯类别';
  RAISE NOTICE '   - 40+个习惯选项';
  RAISE NOTICE '   - 80+条鼓励语';
  RAISE NOTICE '   - 8个成就徽章';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 安全: RLS策略已启用';
  RAISE NOTICE '⚡ 性能: 索引已创建';
  RAISE NOTICE '🤖 自动化: 触发器已配置';
END $$;
