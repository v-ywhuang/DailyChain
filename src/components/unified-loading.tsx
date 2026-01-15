/**
 * 统一的 Loading 组件
 * 解决：1. 尺寸不统一 2. 背景不统一 3. 位置不居中
 */

interface UnifiedLoadingProps {
  /** 显示模式 */
  variant?: 'inline' | 'overlay' | 'button'
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 文字提示 */
  text?: string
  /** 是否显示背景遮罩 */
  overlay?: boolean
}

export function UnifiedLoading({ 
  variant = 'inline', 
  size = 'md',
  text,
  overlay = true
}: UnifiedLoadingProps) {
  
  // 尺寸映射
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Spinner SVG
  const spinnerSvg = (
    <svg
      className={`animate-spin ${sizeMap[size]} text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  // 按钮内嵌模式（表单提交按钮）
  if (variant === 'button') {
    return (
      <span className="inline-flex items-center justify-center gap-2">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && <span className="text-sm">{text}</span>}
      </span>
    )
  }

  // 覆盖模式（全屏或容器覆盖）
  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-sm" />
        )}
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            {/* 外圈光晕 */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
            {/* Spinner */}
            <div className="relative">
              {spinnerSvg}
            </div>
          </div>
          {text && (
            <p className={`text-white font-medium ${textSizeMap[size]} animate-pulse`}>
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  // 内联模式（默认）
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative">
        {/* 外圈光晕 */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 blur-lg opacity-40 animate-pulse" />
        {/* Spinner */}
        <div className="relative">
          {spinnerSvg}
        </div>
      </div>
      {text && (
        <span className={`text-slate-300 font-medium ${textSizeMap[size]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

/**
 * 页面级别的 Loading（Suspense fallback）
 */
export function PageLoading({ text }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo + Loading 组合 */}
        <div className="relative">
          {/* 外圈旋转光晕 */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 blur-2xl opacity-60 animate-pulse" />
          
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <svg
              className="animate-spin w-full h-full text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
        
        {/* 品牌名称 */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Daily
            </span>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Chain
            </span>
          </h2>
          {text && (
            <p className="text-purple-300 text-sm font-medium animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
