export function HabitDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 animate-pulse">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 w-10 bg-white/10 rounded-xl" />
        <div className="h-8 w-32 bg-white/10 rounded-xl" />
      </div>

      {/* 习惯标题和图标 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-white/10 rounded-2xl" />
        <div className="flex-1">
          <div className="h-8 bg-white/10 rounded-xl mb-2 w-3/4" />
          <div className="h-6 bg-white/10 rounded-xl w-1/2" />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="h-10 bg-white/5 rounded-xl mb-2" />
            <div className="h-6 bg-white/5 rounded-xl w-2/3" />
          </div>
        ))}
      </div>

      {/* 日历占位 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6">
        <div className="h-6 bg-white/5 rounded-xl mb-4 w-1/3" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 animate-pulse">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-10 w-20 bg-white/10 rounded-xl" />
        <div className="h-10 w-32 bg-white/10 rounded-xl" />
      </div>

      {/* 报告容器 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-purple-900/50 backdrop-blur-xl rounded-3xl p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="h-10 bg-white/10 rounded-xl mx-auto w-2/3 mb-4" />
          <div className="h-6 bg-white/10 rounded-xl mx-auto w-1/2" />
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4">
              <div className="h-8 bg-white/10 rounded-xl mb-2" />
              <div className="h-6 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>

        {/* 文案区域 */}
        <div className="space-y-4">
          <div className="h-4 bg-white/10 rounded-xl w-full" />
          <div className="h-4 bg-white/10 rounded-xl w-5/6" />
          <div className="h-4 bg-white/10 rounded-xl w-4/5" />
          <div className="h-4 bg-white/10 rounded-xl w-full" />
          <div className="h-4 bg-white/10 rounded-xl w-3/4" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 animate-pulse">
      {/* 导航栏 */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl" />
            <div className="h-8 w-48 bg-white/10 rounded-xl" />
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="backdrop-blur-xl bg-white/10 rounded-3xl p-6">
              <div className="h-10 bg-white/10 rounded-xl mb-2" />
              <div className="h-6 bg-white/10 rounded-xl w-3/4 mb-2" />
              <div className="h-8 bg-white/10 rounded-xl w-1/2" />
            </div>
          ))}
        </div>

        {/* 打卡按钮 */}
        <div className="h-20 bg-white/10 rounded-3xl mb-8" />

        {/* 习惯列表 */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="backdrop-blur-xl bg-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl" />
                <div className="flex-1">
                  <div className="h-6 bg-white/10 rounded-xl mb-2 w-2/3" />
                  <div className="h-4 bg-white/10 rounded-xl w-1/3" />
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
