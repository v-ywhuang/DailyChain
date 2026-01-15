// 通用的Loading组件 - 透明背景，只显示旋转图标
import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* 旋转的圆环 - 更大更明显 */}
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  )
}
