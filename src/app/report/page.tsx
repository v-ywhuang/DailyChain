import { Suspense } from 'react'
import ReportContent from './report-content'

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
