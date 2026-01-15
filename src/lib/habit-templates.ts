// 习惯模板类型定义
export type HabitFrequency = 'daily' | 'weekly'
export type HabitMetricType = 'weight' | 'pages' | 'mood' | 'time' | 'count'

export interface SubHabit {
  name: string
  type: HabitFrequency
  frequency?: number // 每周次数 (仅weekly)
  encouragement: string
  tips: string
}

export interface Milestone {
  day: number
  message: string
}

export interface HabitMetrics {
  trackWeight?: boolean
  trackPages?: boolean
  trackMood?: boolean
  trackTime?: boolean
  targetLoss?: number // kg
  targetBooks?: number
  estimatedDays?: number
  motivationalMessage: string
}

export interface HabitTemplate {
  id: string
  name: string
  icon: string
  color: string
  description: string
  category: 'health' | 'learning' | 'fitness' | 'lifestyle'
  subHabits: SubHabit[]
  metrics: HabitMetrics
  milestones: Milestone[]
}

// 习惯模板库
export const HABIT_TEMPLATES: Record<string, HabitTemplate> = {
  weight_loss: {
    id: 'weight_loss',
    name: '减肥计划',
    icon: '🏃',
    color: '#f97316',
    description: '科学减重，健康生活',
    category: 'health',
    subHabits: [
      {
        name: '不吃晚饭',
        type: 'daily',
        encouragement: '晚餐不吃，精神倍增！明早体重秤会给你惊喜',
        tips: '可以喝无糖酸奶或吃点水果垫垫'
      },
      {
        name: '晨跑30分钟',
        type: 'daily',
        encouragement: '清晨的汗水，是最好的燃脂剂！',
        tips: '空腹跑步燃脂效果更好，记得补水'
      },
      {
        name: '喝8杯水',
        type: 'daily',
        encouragement: '水是生命之源，也是瘦身之本！',
        tips: '饭前喝水能增加饱腹感，减少进食'
      }
    ],
    metrics: {
      trackWeight: true,
      targetLoss: 5,
      estimatedDays: 30,
      motivationalMessage: '坚持30天，预计减重5kg，遇见更美的自己！'
    },
    milestones: [
      { day: 3, message: '前3天最难，你做到了！身体开始适应新节奏 🎉' },
      { day: 7, message: '一周啦！体重计上的数字开始悄悄变化 📉' },
      { day: 14, message: '两周见效！朋友开始夸你变瘦了 👏' },
      { day: 21, message: '习惯养成！新的生活方式已经刻进DNA 🧬' },
      { day: 30, message: '30天蜕变！你已经是0.1%的狠人了 👑' }
    ]
  },

  reading: {
    id: 'reading',
    name: '每日阅读',
    icon: '📚',
    color: '#3b82f6',
    description: '读书使人进步，知识改变命运',
    category: 'learning',
    subHabits: [
      {
        name: '阅读30分钟',
        type: 'daily',
        encouragement: '每天半小时，一年读完24本书！',
        tips: '早上阅读记忆效果更好，晚上读书助眠'
      }
    ],
    metrics: {
      trackPages: true,
      trackTime: true,
      targetBooks: 24,
      estimatedDays: 365,
      motivationalMessage: '每天30分钟，一年读完24本书，超越99%的人！'
    },
    milestones: [
      { day: 7, message: '一周7次，你已经比90%的人更爱阅读 📖' },
      { day: 30, message: '一本书读完！知识正在改变你 🧠' },
      { day: 100, message: '100天！你的思维方式已经升级 🚀' },
      { day: 365, message: '一年坚持！你已经成为读书达人 🏆' }
    ]
  },

  meditation: {
    id: 'meditation',
    name: '正念冥想',
    icon: '🧘',
    color: '#8b5cf6',
    description: '放空自己，找回内心的平静',
    category: 'health',
    subHabits: [
      {
        name: '冥想10分钟',
        type: 'daily',
        encouragement: '深呼吸，感受当下的宁静',
        tips: '早晨冥想能让一天都保持平静心态'
      }
    ],
    metrics: {
      trackMood: true,
      trackTime: true,
      motivationalMessage: '每天10分钟冥想，减压神器，找回内心平静'
    },
    milestones: [
      { day: 3, message: '3天了！你开始感受到内心的变化 ✨' },
      { day: 7, message: '一周坚持！焦虑感开始减少 😌' },
      { day: 21, message: '21天！心态更平和，生活更从容 🕊️' },
      { day: 100, message: '百日冥想！你已经找到内心的宁静 🌟' }
    ]
  },

  fitness: {
    id: 'fitness',
    name: '健身打卡',
    icon: '💪',
    color: '#ef4444',
    description: '雕刻身材，释放荷尔蒙',
    category: 'fitness',
    subHabits: [
      {
        name: '力量训练',
        type: 'weekly',
        frequency: 3,
        encouragement: '每一次举铁，都是对自己的投资！',
        tips: '大肌群优先：胸背腿，复合动作效果最好'
      },
      {
        name: '拉伸放松',
        type: 'daily',
        encouragement: '拉伸能让肌肉线条更好看！',
        tips: '训练后拉伸很重要，防止肌肉僵硬'
      }
    ],
    metrics: {
      trackTime: true,
      estimatedDays: 84,
      motivationalMessage: '坚持12周，肉眼可见的身材变化！'
    },
    milestones: [
      { day: 7, message: '一周3练！肌肉开始苏醒 💪' },
      { day: 21, message: '三周了！力量明显增长 🔥' },
      { day: 56, message: '8周蜕变！身材开始有型 🏋️' },
      { day: 84, message: '12周完成！你已经是健身达人 🏆' }
    ]
  },

  early_rise: {
    id: 'early_rise',
    name: '早起打卡',
    icon: '🌅',
    color: '#f59e0b',
    description: '一日之计在于晨',
    category: 'lifestyle',
    subHabits: [
      {
        name: '6:00起床',
        type: 'daily',
        encouragement: '早起的鸟儿有虫吃！你比别人多活3小时',
        tips: '前一晚10点睡，保证8小时睡眠质量'
      }
    ],
    metrics: {
      trackTime: true,
      motivationalMessage: '一年早起365天，等于多活45天！'
    },
    milestones: [
      { day: 3, message: '3天！生物钟开始调整 ⏰' },
      { day: 7, message: '一周啦！早起不再痛苦 🌞' },
      { day: 21, message: '21天！早起已经成为习惯 ⚡' },
      { day: 100, message: '百日早起！你是时间管理大师 👑' }
    ]
  }
}

// 获取模板列表
export const getTemplateList = (): HabitTemplate[] => {
  return Object.values(HABIT_TEMPLATES)
}

// 根据ID获取模板
export const getTemplateById = (id: string): HabitTemplate | undefined => {
  return HABIT_TEMPLATES[id]
}

// 每日鼓励语库
export const DAILY_ENCOURAGEMENTS = [
  '坚持就是胜利！你离目标又近了一步 🎯',
  '每一次打卡，都是对自己的一次投资 💎',
  '今天的你，比昨天更棒！ ⭐',
  '小习惯，大改变！继续加油 🔥',
  '你的坚持，会被时间看见 ⏳',
  '别放弃！最暗的夜，离天亮最近 🌅',
  '你已经超越了昨天的自己，了不起！ 👏',
  '每一天的努力，都在为未来的你铺路 🛤️',
  '相信过程，享受进步！ 🌱',
  '你比想象中更强大！ 💪',
  '成功的秘诀就是坚持到最后一刻 🏁',
  '今天也是充满希望的一天！ 🌈',
  '你的努力，终将开花结果 🌸',
  '每个坚持的日子，都值得被记住 📝',
  '改变，从今天开始！ ✨',
  '你正在成为更好的自己 🦋',
  '积累的力量，终将爆发 💥',
  '继续前进，精彩还在后头！ 🎪',
  '你的坚持，正在改变人生 🌟',
  '今天又是元气满满的一天！ ☀️'
]

// 获取随机鼓励语
export const getRandomEncouragement = (): string => {
  return DAILY_ENCOURAGEMENTS[Math.floor(Math.random() * DAILY_ENCOURAGEMENTS.length)]
}

// 根据连续天数获取特殊鼓励
export const getStreakEncouragement = (streak: number): string => {
  if (streak === 1) return '万事开头难，你迈出了第一步！ 🚀'
  if (streak === 3) return '连续3天！你已经超越了大多数人 🎉'
  if (streak === 7) return '一周战士！你的坚持令人敬佩 🏆'
  if (streak === 14) return '两周啦！习惯开始形成 ⚡'
  if (streak === 21) return '21天！科学证明习惯已养成 🧬'
  if (streak === 30) return '满月啦！你已经蜕变了 🌕'
  if (streak === 50) return '50天！这份毅力无人能敌 💎'
  if (streak === 100) return '百日筑基！你已经是大师级别 👑'
  if (streak === 365) return '一年坚持！你是传奇！ 🏛️'
  
  return getRandomEncouragement()
}
